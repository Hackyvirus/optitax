"""
python/brand_rate/main.py

Entry point called by Next.js pythonRunner.ts.
It wraps your existing DBK automation script.

Environment variables provided by Node.js:
  OUTPUT_DIR   - where to write output files and manifest.json
  INPUT_FILES  - JSON: {"sb": "/path/file.xlsx", "boe": "...", "bom": "..."}
  TOOL_CONFIG  - JSON: {"month": "January 2025", "brand_rate": "43"}
  JOB_ID       - unique job ID string
"""

import os
import sys
import json
from pathlib import Path

# Add parent folder to path so we can import manifest_writer
sys.path.insert(0, str(Path(__file__).parent.parent))

from manifest_writer import ManifestWriter, log_info, log_ok, log_warn, log_err

# ── IMPORT YOUR EXISTING DBK CODE ─────────────────────────────────────────────
# Replace "dbk_automation" with whatever your existing Python file is named
# (without the .py extension). Copy that file into python/brand_rate/
try:
    from dbk_automation import (
        load_config,
        process_sb_data,
        create_export_statement,
        create_bom_working,
        create_dbk_statements_90days,
        create_dbk3_statements,
        create_consumption_sheet,
        create_calculation_sheet,
        create_annexures,
        save_all_outputs,
    )
    import pandas as pd
except ImportError as e:
    log_err(f"Cannot import DBK module: {e}")
    log_err("Make sure your DBK script is at python/brand_rate/dbk_automation.py")
    sys.exit(1)


def main():
    # Read env vars from Node.js runner
    output_dir   = os.environ.get("OUTPUT_DIR", "./outputs")
    input_raw    = os.environ.get("INPUT_FILES", "{}")
    config_raw   = os.environ.get("TOOL_CONFIG", "{}")

    input_files: dict = json.loads(input_raw)
    tool_config: dict = json.loads(config_raw)

    month      = tool_config.get("month", "Unknown Month")
    brand_rate = tool_config.get("brand_rate", "")

    log_info(f"Starting Brand Rate / DBK for {month}")

    writer = ManifestWriter(output_dir=output_dir)

    # Build config dict your existing code expects
    config = {
        "months": [month],
        "company": "OptiTax Client",
        "office_address": "",
        "brand_rate": brand_rate,
        "Aplication_no": brand_rate,
        "plant_code": "INBD-ICD",
        "place_left": "Pune",
        "place_right": "Bengaluru",
        "filter_conditions": {"scheme_codes": [19, 43]},
        "parameters": {"air_dbk_percent": 0.02},
        "inputs": {
            "sb":           Path(input_files.get("sb",           "")).name,
            "boe":          Path(input_files.get("boe",          "")).name,
            "bom":          Path(input_files.get("bom",          "")).name,
            "export_sales": Path(input_files.get("export_sales", "")).name,
        },
    }

    # Load input files
    try:
        sb_df  = pd.read_excel(input_files["sb"],  engine="openpyxl") if "sb"  in input_files else pd.DataFrame()
        boe_df = pd.read_excel(input_files["boe"], engine="openpyxl") if "boe" in input_files else pd.DataFrame()
        esr_df = pd.read_excel(input_files["export_sales"], engine="openpyxl") if "export_sales" in input_files else pd.DataFrame()
        log_ok(f"SB: {len(sb_df)} rows | BOE: {len(boe_df)} rows | ESR: {len(esr_df)} rows")
    except Exception as e:
        log_err(f"Failed to read input files: {e}")
        sys.exit(1)

    # Run pipeline
    try:
        output_base = Path(output_dir)

        processed_sb = process_sb_data(sb_df, esr_df, pd.DataFrame(), config, month)
        log_ok(f"SB processed: {len(processed_sb)} rows after filter")

        processed_sb["LEO DATE"] = pd.to_datetime(processed_sb["LEO DATE"], errors="coerce")
        FIRST_LEO_DATE = processed_sb["LEO DATE"].min()
        log_info(f"First LEO date: {FIRST_LEO_DATE}")

        export_df = create_export_statement(processed_sb, config, month, output_base)
        log_ok(f"Export Statement: {len(export_df)} rows")

        bom_working_df, _ = create_bom_working(
            export_df, input_files["bom"], "main", config, month
        )
        log_ok(f"BOM Working: {len(bom_working_df)} rows")

        dbk_items = bom_working_df[
            ~bom_working_df["Sr No"].astype(str).str.contains("Export Product", na=False)
        ]
        consumption_df = (
            dbk_items.groupby(["part no", "Name of the material /component"], as_index=False)
            ["Export quantity"].sum()
            .rename(columns={"Export quantity": "Total Export quantity"})
        )
        consumption_df_dbk = (
            dbk_items.groupby(["Sr No", "part no", "Name of the material /component"], as_index=False)
            ["Export quantity"].sum()
            .rename(columns={"Export quantity": "Total Export quantity"})
        )
        log_ok(f"Consumption pivot: {len(consumption_df)} components")

        dbk2, dbk2a = create_dbk_statements_90days(boe_df, consumption_df, FIRST_LEO_DATE, config)
        log_ok(f"DBK-2: {len(dbk2)} rows | DBK-2A: {len(dbk2a)} rows")

        dbk3, dbk3a = create_dbk3_statements(config=config, month=month)

        consumption_sheet = create_consumption_sheet(dbk2, dbk2a, consumption_df, consumption_df_dbk)
        log_ok(f"Consumption Sheet: {len(consumption_sheet)} rows")

        calc_sheet = create_calculation_sheet(export_df, consumption_sheet, bom_working_df)
        log_ok(f"Calculation Sheet: {len(calc_sheet)} rows")

        annexure_inv, annexure_sb, value_addition, tf = create_annexures(export_df, calc_sheet)

        output_datasets = {
            "Export Statement":    export_df,
            "DBK-1":               bom_working_df,
            "DBK-2":               dbk2,
            "DBK-2A":              dbk2a,
            "DBK-3":               dbk3,
            "DBK-3A":              dbk3a,
            "Consumption Sheet":   consumption_sheet,
            "Calculation Sheet":   calc_sheet,
            "Invoice wise Annexure": annexure_inv,
            "SB wise Annexure":    annexure_sb,
            "Value Addition Sheet": value_addition,
            "BOM":                 bom_working_df,
            "Consumption Pivot":   consumption_df,
        }

        save_all_outputs(output_datasets, month, config)
        log_ok("All sheets saved successfully")

    except Exception as e:
        import traceback
        log_err(f"Pipeline error: {e}")
        log_warn(traceback.format_exc())
        sys.exit(1)

    # Build manifest for frontend
    main_file = str(output_base / month / "DBK Working Sheet.xlsx")
    back_file = str(output_base / month / "Backworking Sheets.xlsx")

    main_sheets = [
        "Export Statement", "DBK-1", "DBK-2", "DBK-2A", "DBK-3", "DBK-3A",
        "Consumption Sheet", "Calculation Sheet", "Invoice wise Annexure",
        "SB wise Annexure", "Value Addition Sheet",
    ]
    back_sheets = ["BOM", "Consumption Pivot"]

    for name in main_sheets:
        df = output_datasets.get(name, pd.DataFrame())
        writer.add_output(name, len(df), main_file, "main")

    for name in back_sheets:
        df = output_datasets.get(name, pd.DataFrame())
        writer.add_output(name, len(df), back_file, "back")

    # Validations
    boe_total = len(dbk2) + len(dbk2a)
    boe_match = boe_total == len(boe_df)
    writer.add_validation("Row count checks", "BOE rows vs DBK rows",
                          "pass" if boe_match else "fail",
                          f"{len(boe_df)} {'=' if boe_match else '≠'} {boe_total}")

    sb_match = len(processed_sb) == len(export_df)
    writer.add_validation("Row count checks", "SB rows vs Export Statement",
                          "pass" if sb_match else "warn",
                          f"{len(processed_sb)} vs {len(export_df)}")

    if not consumption_sheet.empty and "Qty Consumed" in consumption_sheet.columns:
        unmatched = (consumption_sheet["Qty Consumed"] == 0).sum()
        writer.add_validation("Data quality", "BOE descriptions unmatched in BOM",
                              "warn" if unmatched > 0 else "pass",
                              f"{unmatched} rows with Qty Consumed = 0")

    writer.add_validation("Output files", "DBK Working Sheet.xlsx", "pass", f"{len(main_sheets)} sheets")
    writer.add_validation("Output files", "Backworking Sheets.xlsx",  "pass", f"{len(back_sheets)} sheets")

    writer.save()
    log_ok(f"Done. Output at: {output_base / month}")


if __name__ == "__main__":
    main()
