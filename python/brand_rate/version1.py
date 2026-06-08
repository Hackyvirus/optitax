import yaml
from pathlib import Path
import numpy as np
import warnings
warnings.filterwarnings('ignore')
from datetime import datetime
from dateutil.relativedelta import relativedelta
from openpyxl.utils import get_column_letter
from openpyxl.styles import Border, Side, Font, Alignment, PatternFill
from openpyxl import load_workbook
import pandas as pd
from openpyxl.cell.cell import MergedCell

def load_config(config_path: str = "config.yaml") -> dict:
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def format_date_ddmmyyyy(value):
    try:
        return pd.to_datetime(value).strftime("%d/%m/%Y")
    except:
        return ""
   
def read_input_files(base_dir: Path, config: dict) -> dict:
    datasets = {}
    months = config.get("months", [])
    
    for month in months:
        month_dir = base_dir / month
        month_datasets = {}
        
        for name, file_name in config["inputs"].items():
            full_path = month_dir / file_name
            print('full_path', full_path)
            if full_path.exists():
                try:
                    if file_name.lower().endswith(('.xlsx', '.xls')):
                        try:
                            df = pd.read_excel(full_path, engine='openpyxl')
                        except Exception as e:
                            print(f"⚠️ openpyxl failed for {file_name}, retrying with xlrd...")
                            df = pd.read_excel(full_path, engine='xlrd')
                    else:
                        continue
                    month_datasets[name] = df
                    print(f"✅ Loaded {name} ({month}): {full_path.name}")
                except Exception as e:
                    print(f"❌ Failed to load {full_path.name}: {e}")
            else:
                print(f"Missing file ({month}): {full_path}")
        
        datasets[month] = month_datasets
    
    return datasets

def map_plant(address: str) -> str:
    if pd.isna(address):
        return None
    
    addr = str(address).strip().lower()
    
    if "badli" in addr:
        return "INBD"
    elif "mysore" in addr or "kadakola" in addr:
        return "AIX"
    elif "bengaluru" in addr or "bangalore" in addr or "north yelahanka" in addr or "northyelahanka" in addr:
        return "AIB"
    
    return None

def find_column(df: pd.DataFrame, keywords: list, exact_match: str = None) -> str:
    if exact_match and exact_match in df.columns:
        return exact_match
    
    for col in df.columns:
        col_lower = col.lower().strip()
        for keyword in keywords:
            if keyword.lower() in col_lower:
                return col
    return None

def style_table_body_wb(wb_or_path, sheet_name, start_row=9):
    from openpyxl import load_workbook
    from openpyxl.styles import Font, Alignment, Border, Side

    if isinstance(wb_or_path, str) or hasattr(wb_or_path, "__fspath__"):
        wb = load_workbook(wb_or_path)
        should_save = True
        file_path = wb_or_path
    else:
        wb = wb_or_path
        should_save = False
        file_path = None

    ws = wb[sheet_name]

    last_row = ws.max_row
    last_col = ws.max_column

    header_font = Font(size=10, bold=True)
    body_font = Font(size=10)

    thin = Side(style="thin")
    medium = Side(style="medium")

    thin_border = Border(top=thin, bottom=thin, left=thin, right=thin)

    # HEADER
    for col in range(1, last_col + 1):
        cell = ws.cell(row=start_row, column=col)
        if cell.coordinate in ws.merged_cells:
            continue
        cell.font = header_font
        cell.border = thin_border
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # BODY
    for row in range(start_row + 1, last_row + 1):
        for col in range(1, last_col + 1):
            cell = ws.cell(row=row, column=col)
            if cell.coordinate in ws.merged_cells:
                continue
            cell.font = body_font
            cell.border = thin_border
            cell.alignment = Alignment(horizontal="left", vertical="center")

    # OUTER BORDER (correct merge with existing)
    for col in range(1, last_col + 1):
        cell_top = ws.cell(row=start_row, column=col)
        cell_bottom = ws.cell(row=last_row, column=col)

        cell_top.border = Border(top=medium, left=thin, right=thin, bottom=thin)
        cell_bottom.border = Border(bottom=medium, left=thin, right=thin, top=thin)

    for row in range(start_row, last_row + 1):
        cell_left = ws.cell(row=row, column=1)
        cell_right = ws.cell(row=row, column=last_col)

        cell_left.border = Border(left=medium, top=thin, bottom=thin, right=thin)
        cell_right.border = Border(right=medium, top=thin, bottom=thin, left=thin)

    if should_save:
        wb.save(file_path)
        wb.close()

def add_sheet_header_wb(wb_or_path, sheet_name: str, title: str, config: dict):
    from openpyxl import load_workbook
    from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
    from openpyxl.utils import get_column_letter

    # ✅ Detect type
    if isinstance(wb_or_path, str) or hasattr(wb_or_path, "__fspath__"):
        wb = load_workbook(wb_or_path)
        should_save = True
        file_path = wb_or_path
    else:
        wb = wb_or_path
        should_save = False
        file_path = None

    if sheet_name not in wb.sheetnames:
        return

    ws = wb[sheet_name]
    max_col = ws.max_column if ws.max_column > 1 else 15

    title_fill = PatternFill("solid", fgColor="D9E1F2")
    subtitle_fill = PatternFill("solid", fgColor="E9EFF7")

    bold_side = Side(style="medium")
    bold_border = Border(bold_side, bold_side, bold_side, bold_side)

    # Merge
    ws.merge_cells(f"A1:{get_column_letter(max_col)}1")
    ws.merge_cells(f"A2:{get_column_letter(max_col)}2")
    ws.merge_cells(f"A4:{get_column_letter(max_col)}4")

    # Values
    ws["A1"] = config.get("company", "Company Name")
    ws["A2"] = config.get("office_address", "Office Address")
    ws["A4"] = title

    # Fonts
    ws["A1"].font = Font(size=14, bold=True)
    ws["A2"].font = Font(size=10)
    ws["A4"].font = Font(size=11, bold=True)

    # Alignment
    ws["A1"].alignment = Alignment(horizontal="left")
    ws["A2"].alignment = Alignment(horizontal="left")
    ws["A4"].alignment = Alignment(horizontal="center")

    # Borders
    for row, fill in [(1, title_fill), (2, subtitle_fill), (4, subtitle_fill)]:
        for col in range(1, max_col + 1):
            ws.cell(row=row, column=col).border = bold_border

    # Heights
    ws.row_dimensions[1].height = 30
    ws.row_dimensions[2].height = 22
    ws.row_dimensions[4].height = 22

    if should_save:
        wb.save(file_path)
        wb.close()

def add_sheet_footer_wb(wb_or_path, sheet_name: str, config: dict):
    from openpyxl import load_workbook
    from openpyxl.styles import Font, Alignment

    # ✅ Detect type
    if isinstance(wb_or_path, str) or hasattr(wb_or_path, "__fspath__"):
        wb = load_workbook(wb_or_path)
        should_save = True
        file_path = wb_or_path
    else:
        wb = wb_or_path
        should_save = False
        file_path = None

    if sheet_name not in wb.sheetnames:
        return

    ws = wb[sheet_name]

    last_row = ws.max_row + 2

    ws[f"A{last_row}"] = "Prepared By"
    ws[f"E{last_row}"] = "Checked By"
    ws[f"I{last_row}"] = "Authorized Signatory"

    for col in ["A", "E", "I"]:
        cell = ws[f"{col}{last_row}"]
        cell.font = Font(size=10, bold=True)
        cell.alignment = Alignment(horizontal="center")

    if should_save:
        wb.save(file_path)
        wb.close()


def process_sb_data(sb_df: pd.DataFrame, current_esr_df: pd.DataFrame, pre_esr_df: pd.DataFrame, config: dict, month: str) -> pd.DataFrame:
    if sb_df.empty:
        print("⚠️ SB DataFrame is empty!")
        return sb_df
    
    print(f"Processing SB data for {month}...")
    sb_df = sb_df.copy()
    column_mapping = {
    "SB No": "SB No",
    "SB Date": "SB Date",
    "INVOICE No.(REF)": "Invoice Number",
    "INVOICE Dt.(REF)": "Invoice Date",
    "LEO Date.(PROCESS DETAILS)": "LEO DATE",
    "Port Code": "Port Code",
    "Export Part no": "Export Part no.",
    "DESCRIPTION(ITEM DETAILS)": "Description",
    "QUANTITY(ITEM DETAILS)": "QTY",
    "UQC(ITEM DETAILS)": "Unit",
    "FOB (INR)": "FOB",
    "DBK RATE(DRAWBACK & ROSL CLAIM)": "DBK_Rate",
    "DBK SNO(DRAWBACK & ROSL CLAIM)": "DBK_SNo",
    "EXPORTER'S NAME & ADDRESS": "Exporter Name",
    "HS CD(ITEM DETAILS)": "HSN",
    "HS CD": "HSN_2",
    "INV Qty": "Invoice Qty",
    "ITEM Qty": "Item Qty",
    "SQC MSR": "SQC MSR",
    "PMV": "PMV"
    }
    sb_df = sb_df[list(column_mapping.keys())].rename(columns=column_mapping)
    final_columns = list(column_mapping.values())
    sb_df = sb_df[final_columns]

    
    # Step 4: Add Plant column
    # if 'Plant' not in sb_df.columns:
    #     sb_df.insert(0, 'Plant', '')
    #     print("Step 4) Plant Column Added")
    
    # Step 5: Map plants
    # address_col = find_column(sb_df, ['Exporter Address'])
    # if address_col:
    #     sb_df['Plant'] = sb_df[address_col].apply(map_plant)
    #     print(f"Step 5) Mapped plants using column: {address_col}")
    
    # Step 7: Apply filters
    scheme_col = find_column(sb_df, ['Scheme Code'])
    if scheme_col:
        valid_schemes = config["filter_conditions"].get("scheme_codes", [19, 43])
        sb_df = sb_df[sb_df[scheme_col].isin(valid_schemes)]
    
    dbk_col = find_column(sb_df, ['DBK_SNo'])
    if dbk_col:
        mask = (sb_df[dbk_col].astype(str).str.startswith('9807') & 
                sb_df[dbk_col].astype(str).str.endswith('B'))
        sb_df = sb_df[mask]    
    return sb_df

def create_export_statement(sb_df: pd.DataFrame, config: dict, month: str, output_base: Path = Path("./data/outputs")) -> pd.DataFrame:
    if sb_df.empty:
        print(f"⚠️ No SB data for {month}, skipping Export Statement.")
        return pd.DataFrame()

    print(f"📋 Creating Export Statement for {month}...")

    month_output_path = output_base / month
    month_output_path.mkdir(parents=True, exist_ok=True)
    export_statement_path = month_output_path / "export-statement.xlsx"

    # Create structure
    export_statement_sheet = pd.DataFrame(columns=[
        'SR', 'INVOICE NO', 'Invoice Date', 'SB No', 'SB Date', 'LEO Date',
        'PORT OF EXPORT', 'Part Number of Export Product',
        'DESCRIPTION OF THE EXPORT PRODUCT AS PER SHIPPING BILL',
        'QTY(Nos)', 'FOB VALUE as per SB (Rs)', 'PM VALUE as per SB (Rs)',
        'NET Wt', 'AIR DBK'
    ])

    with pd.ExcelWriter(export_statement_path, mode="w", engine="openpyxl") as writer:
        export_statement_sheet.to_excel(writer, sheet_name="Export Statement sheet", index=False, startrow=6)

    # Add header
    wb = load_workbook(export_statement_path)
    ws = wb['Export Statement sheet']
    ws.merge_cells("A1:O1")
    ws.merge_cells("A2:O2")
    ws.merge_cells("A4:O4")
    ws['A1'] = config.get('company', 'Company Name')
    ws['A2'] = config.get('office_address', 'Office Address')
    ws['A4'] = 'Export Statement'
    ws['A1'].font = Font(size=14, bold=True)
    ws['A2'].font = Font(size=10)
    ws['A4'].font = Font(size=10, bold=True)
    for cell in ['A1', 'A2', 'A4']:
        ws[cell].alignment = Alignment(horizontal='center')
    wb.save(export_statement_path)
    wb.close()

    # Fill data
    export_df = pd.read_excel(export_statement_path, engine='openpyxl', header=6)
    export_df["INVOICE NO"] = sb_df.get("Invoice Number")
    export_df["Invoice Date"] = pd.to_datetime(sb_df.get("Invoice Date"), errors="coerce").dt.strftime("%d/%m/%Y")
    export_df["SB No"] = sb_df.get("SB No")
    export_df["SB Date"] = pd.to_datetime(sb_df.get("SB Date"), errors="coerce").dt.strftime("%d/%m/%Y")
    export_df["LEO Date"] = pd.to_datetime(sb_df.get("LEO DATE"), errors="coerce").dt.strftime("%d/%m/%Y")
    export_df["PORT OF EXPORT"] = sb_df.get("Port Code")
    export_df["Part Number of Export Product"] = sb_df.get("Export Part no.")
    export_df["DESCRIPTION OF THE EXPORT PRODUCT AS PER SHIPPING BILL"] = sb_df.get("Description")
    export_df["QTY(Nos)"] = sb_df.get("QTY")
    export_df["FOB VALUE as per SB (Rs)"] = sb_df.get("FOB")
    export_df["PM VALUE as per SB (Rs)"] = sb_df.get("PMV")
    export_df["NET Wt"] = sb_df.get("SQC MSR")

    # Step 18: Calculated columns
    air_dbk_percent = config.get("parameters", {}).get("air_dbk_percent", 0.02)
    export_df["AIR DBK"] = np.ceil(export_df["FOB VALUE as per SB (Rs)"].astype(float) * air_dbk_percent)
    export_df["Total Shipment"] = export_df.groupby("Part Number of Export Product")["QTY(Nos)"].transform("sum")
    export_df.dropna(subset=["Part Number of Export Product"], inplace=True)
    export_df["SR"] = range(1, len(export_df) + 1)

    with pd.ExcelWriter(export_statement_path, mode="a", if_sheet_exists="overlay", engine="openpyxl") as writer:
        export_df.to_excel(writer, sheet_name="Export Statement sheet", index=False, startrow=6)

    print(f"✅ Export Statement created: {len(export_df)} rows")
    return export_df

def create_bom_working(export_df: pd.DataFrame, bom_file: str, bom_sheet: str, config: dict, month: str) -> tuple:
    print(f"🔧 Creating BOM Working for {month}...")

    # Read BOM
    df_test = pd.read_excel(bom_file, sheet_name=bom_sheet, header=None, nrows=20)
    header_row = None
    for row_idx in range(20):
        row = df_test.iloc[row_idx]
        if any('parent' in str(val).lower() for val in row if pd.notna(val)):
            header_row = row_idx
            break
    if header_row is None:
        header_row = 0

    bom_df = pd.read_excel(bom_file, sheet_name=bom_sheet, engine='openpyxl', header=header_row)
    bom_df.columns = bom_df.columns.str.strip()
    bom_df = bom_df.dropna(how='all')

    parent_col = None
    for col in bom_df.columns:
        if str(col).lower().strip() == 'parent':
            parent_col = col
            break

    if parent_col is None:
        raise KeyError("'parent' column not found in BOM")

    # Create output directory
    base_dir = Path("./data/outputs")
    month_dir = base_dir / month
    month_dir.mkdir(parents=True, exist_ok=True)
    file_path = month_dir / "bom-working-file.xlsx"

    # Step 32-42: Build BOM working
    # columns = [
    #     "Sr No", "Name of the material /component", "part no", "Qty",
    #     "Technical characteristic", "whether imported or indigenous", "UQC",
    #     "Gross Qty Required", "Recoverable Wastage", "Irrecoverable Wastage",
    #     "Per Unit Wastage", "ByProduct Qty", "ByProduct Price",
    #     "Net Qty", "Remarks", "Export quantity"
    # ]
    columns = [
        "Sr No", "Name of the material /component", "part no", "Qty",
        "Technical characteristic","Gross Qty Required", "Export quantity"
    ]

    bom_working_df = pd.DataFrame(columns=columns)
    unique_export_parts = export_df['Part Number of Export Product'].dropna().unique()

    dbk_counter = 1
    for product in unique_export_parts:
        product_rows = export_df[export_df['Part Number of Export Product'] == product]
        product_bom = bom_df[bom_df[parent_col] == product]

        if len(product_bom) > 0:
            # Export product row
            export_row = {
                "Sr No": "Export Product",
                "Name of the material /component": product_rows.iloc[0].get(
                    "DESCRIPTION OF THE EXPORT PRODUCT AS PER SHIPPING BILL", ""
                ),
                "part no": product,
                "Export quantity": product_rows["QTY(Nos)"].sum(),
            }
            bom_working_df = pd.concat(
                [bom_working_df, pd.DataFrame([export_row], columns=columns)],
                ignore_index=True
            )

            for _, r in product_bom.iterrows():
                desc = str(r.get("child part description", "")).lower()
                if "thread" in desc or "tread" in desc:
                    continue

                export_qty = pd.to_numeric(export_row.get("Export quantity", 0), errors="coerce")
                num2 = pd.to_numeric(r.get("number 2", 0), errors="coerce")
                dbk_row = {
                    "Sr No": f"DBK-{dbk_counter}",
                    "Name of the material /component": r.get("child part description", ""),
                    "part no": r.get("Child_Part_Number", ""),
                    "Qty": r.get("BOM Quantity", ""),
                    "Technical characteristic": r.get("child part description", ""),
                    # "whether imported or indigenous": r.get("imported", ""),
                    "whether imported or indigenous": "imported", 
                    # "UQC": r.get("BOM_UOM", ""),
                    "Gross Qty Required": r.get("number 2", ""),
                    # "Recoverable Wastage": r.get("1", ""),
                    # "Irrecoverable Wastage": r.get("2", ""),
                    # "Per Unit Wastage": r.get("3", ""),
                    # "ByProduct Qty": r.get("4", ""),
                    # "ByProduct Price": r.get("5", ""),
                    # "Net Qty": r.get("6.00", ""),
                    # "Remarks": "",
                    "Export quantity": export_qty * num2
                }
                bom_working_df = pd.concat(
                    [bom_working_df, pd.DataFrame([dbk_row], columns=columns)],
                    ignore_index=True
                )
                dbk_counter += 1

    # Save with header
    with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
        bom_working_df.to_excel(writer, sheet_name="BOM Working Sheet", index=False, startrow=6)

    wb = load_workbook(file_path)
    ws = wb["BOM Working Sheet"]
    ws.merge_cells("A1:P1")
    ws.merge_cells("A2:P2")
    ws.merge_cells("A4:P4")
    ws["A1"] = config.get("company", "Company Name")
    ws["A2"] = config.get("office_address", "Office Address")
    ws["A4"] = "Bill of Materials (BOM) Working Sheet"
    ws["A1"].font = Font(size=14, bold=True)
    ws["A2"].font = Font(size=10)
    ws["A4"].font = Font(size=10, bold=True)
    for cell in ["A1", "A2", "A4"]:
        ws[cell].alignment = Alignment(horizontal="center")
    wb.save(file_path)
    wb.close()

    print(f"✅ BOM Working saved: {len(bom_working_df)} rows")
    return bom_working_df, export_df

def create_dbk_statements_90days(boe_cs_df: pd.DataFrame, consumption_df, DATE, config):

    if boe_cs_df.empty:
        return pd.DataFrame(), pd.DataFrame()

    # -----------------------------
    # Date setup
    # -----------------------------
    current_date = pd.Timestamp(DATE).normalize()
    ninety_days_ago = current_date - pd.Timedelta(days=90)

    # -----------------------------
    # Detect required columns
    # -----------------------------
    desc_col = find_column(boe_cs_df, ['Description'])
    qty_col  = find_column(boe_cs_df, ['Stock available', 'STOCK AVAILABLE','QTY','Quantity'])
    date_col = find_column(boe_cs_df, ['BE Date', 'BOE Date', 'Date'])

    if not all([desc_col, qty_col, date_col]):
        raise ValueError("Required BOE columns missing")

    boe_cs_df = boe_cs_df.copy()

    # -----------------------------
    # Normalize BOE date
    # -----------------------------
    boe_cs_df["BE Date"] = pd.to_datetime(
        boe_cs_df[date_col],
        dayfirst=True,
        errors="coerce"
    ).dt.normalize()

    boe_cs_df = boe_cs_df[boe_cs_df["BE Date"].notna()]

    # -----------------------------
    # Quantity tracking
    # -----------------------------
    boe_cs_df["_total_qty"] = pd.to_numeric(
        boe_cs_df[qty_col],
        errors="coerce"
    ).fillna(0)

    boe_cs_df["_used_qty"] = 0.0

    # -----------------------------
    # DBK classification (ONCE)
    # -----------------------------
    boe_cs_df["_dbk_type"] = boe_cs_df["BE Date"].apply(
        lambda d: "DBK2" if ninety_days_ago <= d <= current_date else "DBK2A"
    )

    # =========================================================
    # CONSUMPTION ALLOCATION (NO DBK ROW CREATION HERE)
    # =========================================================
    if not consumption_df.empty:

        for _, cons in consumption_df.iterrows():

            part_no = str(cons.get("part no", "")).strip()
            desc    = str(cons.get("Name of the material /component", "")).strip()

            required_qty = pd.to_numeric(
                cons.get("Total Export quantity", 0),
                errors="coerce"
            )

            if required_qty <= 0:
                continue

            matches = boe_cs_df[
                (boe_cs_df[desc_col].astype(str).str.contains(part_no, case=False, na=False)) |
                (boe_cs_df[desc_col].astype(str).str.contains(desc, case=False, na=False))
            ].sort_values("BE Date")

            remaining = required_qty

            for idx, b in matches.iterrows():

                available = b["_total_qty"] - boe_cs_df.at[idx, "_used_qty"]
                if available <= 0:
                    continue

                consume = min(available, remaining)
                boe_cs_df.at[idx, "_used_qty"] += consume
                remaining -= consume

                if remaining <= 0:
                    break

    dbk2_rows, dbk2a_rows = [], []
    sr2, sr2a = 1, 1

    for _, b in boe_cs_df.iterrows():

        b_dict = b.to_dict()

  
        if b["_used_qty"] > 0:
            b_dict["USED_QTY"] = b["_used_qty"]
        else:
            b_dict["USED_QTY"] = b["_total_qty"]

        mapped_row = {
            "SR. NO.": None, 
            "DESCRIPTION": b_dict.get("Description", ""),
            # "TECH. CHAR.": b_dict.get("Description", ""),
            # "S.NO. IN DBK I STATEMENT": b_dict.get("S.NO. IN DBK I STATEMENT", ""),
            # "B/E. NO. & DT. UNDER WHICH IMPORTED":
                # b_dict.get("B/E. NO. & DT. UNDER WHICH IMPORTED", ""),
            "B/E DATE": b_dict.get("BE Date", ""),
            "NAME OF CUSTOMS HOUSE": b_dict.get("Supplier Name And Address", ""),
            # "UNIT": b_dict.get("UNIT", ""),
            "QTY. IMPORTED ORIGINALY": b_dict.get("QTY", 0),
            "ASSES-SABLE-VALUE(RS.)": b_dict.get("Assesable Value", 0),
            "HEADING NO. IN CUSTOMS TARIFF ACT1975":
                b_dict.get("HSN code as per BE", ""),
            "RATE OF DUTY (%)": b_dict.get("BCD Rate", ""),
            "COUNTRY FROM WHERE IMPORTED & NAMEOF SUPPLIER":
                b_dict.get("Supplier Name And Address", ""),
            "IS ASSESSMENT FINAL": b_dict.get("Prov/Final", ""),
            "BCD": b_dict.get("BCD Rate", 0),
            "SWS 10%": b_dict.get("SWS Rate", 0),
            "TOTAL DUTY OF CUSTOMS":
                b_dict.get("Total duty", 0),
            "NAME & FULL ADD. OF SUPLR IN CASE FOREIGN MATRL/CMPNT OBTND LOCALY":
                b_dict.get(
                    "Supplier Name And Address", ""
                ),
            "Stock available": b_dict["USED_QTY"],
            "Remark": ""
        }

        if b["_dbk_type"] == "DBK2":
            mapped_row["SR. NO."] = sr2
            dbk2_rows.append(mapped_row)
            sr2 += 1
        else:
            mapped_row["SR. NO."] = sr2a
            dbk2a_rows.append(mapped_row)
            sr2a += 1


    columns = [
        "SR. NO.","DESCRIPTION","B/E DATE","NAME OF CUSTOMS HOUSE",
        "QTY. IMPORTED ORIGINALY","ASSES-SABLE-VALUE(RS.)",
        "HEADING NO. IN CUSTOMS TARIFF ACT1975","RATE OF DUTY (%)",
        "COUNTRY FROM WHERE IMPORTED & NAMEOF SUPPLIER","IS ASSESSMENT FINAL",
        "BCD","SWS 10%","TOTAL DUTY OF CUSTOMS",
        "NAME & FULL ADD. OF SUPLR IN CASE FOREIGN MATRL/CMPNT OBTND LOCALY",
        "Stock available","Remark"
    ]
    # columns = [
    #     "SR. NO.","DESCRIPTION","TECH. CHAR.","S.NO. IN DBK I STATEMENT",
    #     "B/E. NO. & DT. UNDER WHICH IMPORTED","B/E DATE","NAME OF CUSTOMS HOUSE","UNIT",
    #     "QTY. IMPORTED ORIGINALY","ASSES-SABLE-VALUE(RS.)",
    #     "HEADING NO. IN CUSTOMS TARIFF ACT1975","RATE OF DUTY (%)",
    #     "COUNTRY FROM WHERE IMPORTED & NAMEOF SUPPLIER","IS ASSESSMENT FINAL",
    #     "BCD","SWS 10%","TOTAL DUTY OF CUSTOMS",
    #     "NAME & FULL ADD. OF SUPLR IN CASE FOREIGN MATRL/CMPNT OBTND LOCALY",
    #     "Stock available","Remark"
    # ]

    dbk2_df  = pd.DataFrame(dbk2_rows,  columns=columns)
    dbk2a_df = pd.DataFrame(dbk2a_rows, columns=columns)

    dbk2_df["B/E DATE"]  = dbk2_df["B/E DATE"].apply(format_date_ddmmyyyy)
    dbk2a_df["B/E DATE"] = dbk2a_df["B/E DATE"].apply(format_date_ddmmyyyy)

    total_boe = len(boe_cs_df)
    total_dbk = len(dbk2_df) + len(dbk2a_df)

    print(f"BOE rows : {total_boe}")
    print(f"DBK rows : {total_dbk}")

    if total_boe != total_dbk:
        raise RuntimeError("❌ BOE and DBK row count mismatch")

    return dbk2_df, dbk2a_df

def create_dbk3_statements(config: dict, month: str) -> tuple:
    print(f"📝 Creating DBK-3 and DBK-3A for {month}...")
    
    current_date = datetime.now().strftime("%d/%m/%Y")
    
    try:
        month_str = month.strip()
        print("month str", month_str)
        for fmt in ["%B %Y", "%B-%Y", "%b %Y", "%b-%Y", "%B", "%b"]:
            try:
                parsed_month = datetime.strptime(month_str, fmt)
                print("parsed_month",parsed_month)
                if fmt in ["%B", "%b"]:
                    parsed_month = parsed_month.replace(year=datetime.now().year)
                month_display = parsed_month.strftime("%b %Y").upper()
                print("month_display",month_display)
                break
            except:
                continue
        else:
            month_display = month.upper()
    except:
        month_display = month.upper()
    
    brand_rate = config.get("brand_rate", "43")
    plant_code = config.get("plant_code", "INBD-ICD")
    product_description = config.get("product_description", "Safety Air Bags, Seat Belts & Steering Wheels")
    commencement_date = config.get("commencement_date", "01-04-2023")
    company_name = config.get("company", "Autoliv India Pvt Limited")
    company_address = config.get("office_address", "")
    place_left = config.get("place_left", "Pune")
    place_right = config.get("place_right", "Bengaluru")
    
    dbk3_df = create_dbk3_sheet(company_name, company_address, brand_rate, plant_code, 
                                 month_display, product_description, commencement_date, 
                                 place_left, place_right, current_date)
    
    dbk3a_df = create_dbk3a_sheet(company_name, company_address, brand_rate, plant_code,
                                   month_display, product_description, commencement_date,
                                   place_left, place_right, current_date)
    
    print(f"✅ DBK-3 and DBK-3A created")
    return dbk3_df, dbk3a_df

def create_dbk3_sheet(company_name, company_address, brand_rate, plant_code, month_display,
                      product_description, commencement_date, place_left, place_right, current_date):
    """Create DBK-3 sheet structure"""
    
    columns = [
        "SR. NO.", "DESCRIPTION", "TECHNICAL CHARACT- ERISTICS", "S.NO. IN DBK I STATE- MENT",
        "UNIT", "QUANTITY PURCHASED", "ASSES- SABLE VALUE (RS.)", "C. EXCISE TARIFF HEADING NO.",
        "EFFECTIVE RATE OF DUTY (%)", "BASIC EXCISE DUTY PAID", "EDU. CESS", "HIGHER EDU CESS",
        "ADDNL DUTY", "TOTAL DUTY", "NAME AND ADDRESS OF SUPPLIER", "GATE PASS NO AND DATE",
        "IS ASSES- SMENT OF DUTY FINAL ?", "Remarks per Unit(KG) Duty (RS)", "ASSASS- ABLE VALUE PER UNIT(KGS) (Rs)"]
    
    col_numbers = ["1", "2", "3", "4", "4A", "5", "6", "7", "8", "9A", "9B", "9C", "9D", "9E", "10", "11", "12", "13", "14"]
    nil_row = ["NIL"] * 19
    
    data = [col_numbers,nil_row]
    df = pd.DataFrame(data, columns=columns)
    
    df.attrs['company_name'] = company_name
    df.attrs['company_address'] = company_address
    df.attrs['title'] = f"STATEMENT - DBK - III - BRAND RATE-{brand_rate} {plant_code}-{month_display}"
    df.attrs['description'] = f"Materials / Components of Indian origin obtained by the manufacturer during the period commencing three months prior to the date of shipment / first shipment upto the date of application for manufacture of products: - {product_description}"
    df.attrs['commencement'] = f"COMMENCEMENT DATE: {commencement_date}"
    df.attrs['place_left'] = place_left
    df.attrs['place_right'] = place_right
    df.attrs['current_date'] = current_date
    df.attrs['sheet_type'] = 'DBK-3'
    
    return df

def create_dbk3a_sheet(company_name, company_address, brand_rate, plant_code, month_display,
                       product_description, commencement_date, place_left, place_right, current_date):
    """Create DBK-3A sheet structure"""
    
    columns = [
        "SR. NO.", "DESCRIPTION", "TECHNICAL CHARACT- ERISTICS", "S.NO. IN DBK I STATE- MENT",
        "UNIT", "QUANTITY PURCHASED ORIGINALLY", "ASSES- SABLE VALUE (RS.)", "C. EXCISE TARIFF HEADING NO.",
        "EFFECTIVE RATE OF DUTY (%)", "BASIC EXCISE DUTY", "EDU. CESS", "HIGHER EDU CESS",
        "ADDNL DUTY", "TOTAL DUTY", "NAME AND ADDRESS OF SUPPLIER", "GATE PASS NO AND DATE",
        "IS ASSES- SMENT OF DUTY FINAL ?", "STOCK AS ON", "Remarks per Unit(KGS) Duty(Rs)", "ASSASSABLE VALUE UNIT(KGS) RS"
    ]
    
    col_numbers = ["1", "2", "3", "4", "4A", "5", "6", "7", "8", "9A", "9B", "9C", "9D", "9E", "10", "11", "12", "13", "14", "15"]
    nil_row = ["NIL"] * 20
    
    data = [col_numbers, nil_row]
    df = pd.DataFrame(data, columns=columns)
    
    df.attrs['company_name'] = company_name
    df.attrs['company_address'] = company_address
    df.attrs['title'] = f"STATEMENT - DBK - IIIA - BRAND RATE-{brand_rate} {plant_code}-{month_display}"
    df.attrs['description'] = f"Details of procurements relating to stocks of indigenous materials as on commencement date {commencement_date} (the date three months prior to the date of shipment / first shipment) based on FIFO principle, required for the manufacture of products: {product_description}"
    df.attrs['place_left'] = place_left
    df.attrs['place_right'] = place_right
    df.attrs['current_date'] = current_date
    df.attrs['sheet_type'] = 'DBK-3A'
    
    return df

def format_dbk3_sheets(wb_or_path, sheet_name: str, df: pd.DataFrame):
    """Apply full styling to DBK-3 or DBK-3A sheets (supports wb OR path)"""

    from openpyxl import load_workbook
    from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
    from openpyxl.utils import get_column_letter

    try:
        # ✅ HANDLE BOTH TYPES
        if isinstance(wb_or_path, str) or hasattr(wb_or_path, "__fspath__"):
            wb = load_workbook(wb_or_path)
            should_save = True
            file_path = wb_or_path
        else:
            wb = wb_or_path
            should_save = False
            file_path = None

        if sheet_name not in wb.sheetnames:
            print(f"⚠️ Sheet '{sheet_name}' not found")
            return

        ws = wb[sheet_name]

        # ---------------- META ----------------
        company_name = df.attrs.get('company_name', '')
        company_address = df.attrs.get('company_address', '')
        title = df.attrs.get('title', '')
        description = df.attrs.get('description', '')
        commencement = df.attrs.get('commencement', '')
        place_left = df.attrs.get('place_left', 'Pune')
        place_right = df.attrs.get('place_right', 'Bengaluru')
        current_date = df.attrs.get('current_date', '')

        # ---------------- STYLES ----------------
        thin = Side(style='thin')
        medium = Side(style='medium')

        thin_border = Border(left=thin, right=thin, top=thin, bottom=thin)

        bold_font = Font(bold=True, size=10)
        title_font = Font(bold=True, size=11)

        center = Alignment(horizontal='center', vertical='center', wrap_text=True)
        left = Alignment(horizontal='left', vertical='center', wrap_text=True)
        right = Alignment(horizontal='right', vertical='center', wrap_text=True)

        fill = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")

        # ---------------- RESET SHEET ----------------
        ws.delete_rows(1, ws.max_row)

        # ---------------- HEADER ----------------
        ws.merge_cells('A1:T1')
        ws['A1'] = company_name
        ws['A1'].font = Font(bold=True, size=12)
        ws['A1'].alignment = center

        ws.merge_cells('A2:T2')
        ws['A2'] = company_address
        ws['A2'].alignment = center

        ws.merge_cells('A4:T4')
        ws['A4'] = title
        ws['A4'].font = title_font
        ws['A4'].alignment = center

        ws.merge_cells('A5:T5')
        ws['A5'] = description
        ws['A5'].alignment = left

        header_row = 8 if commencement else 7

        if commencement:
            ws.merge_cells('A6:T6')
            ws['A6'] = commencement
            ws['A6'].alignment = left

        # ---------------- TABLE HEADER ----------------
        for col_idx, col_name in enumerate(df.columns, start=1):
            cell = ws.cell(row=header_row, column=col_idx)
            cell.value = col_name
            cell.font = bold_font
            cell.alignment = center
            cell.fill = fill
            cell.border = thin_border
            ws.column_dimensions[get_column_letter(col_idx)].width = 12

        # ---------------- DATA ----------------
        for row_idx, row in enumerate(df.itertuples(index=False), start=header_row + 1):
            for col_idx, value in enumerate(row, start=1):
                cell = ws.cell(row=row_idx, column=col_idx)
                cell.value = value
                cell.border = thin_border
                cell.alignment = center

        last_row = ws.max_row

        # ---------------- CERTIFICATE ----------------
        cert_row = last_row + 3

        ws.merge_cells(f'A{cert_row}:T{cert_row}')
        ws[f'A{cert_row}'] = "C  E  R  T  I  F  I  C  A  T  E"
        ws[f'A{cert_row}'].font = title_font
        ws[f'A{cert_row}'].alignment = center

        # ---------------- SIGN ----------------
        sig_row = cert_row + 4

        ws.merge_cells(f'A{sig_row}:I{sig_row}')
        ws[f'A{sig_row}'] = "Signature of CA"
        ws[f'A{sig_row}'].alignment = left

        ws.merge_cells(f'K{sig_row}:T{sig_row}')
        ws[f'K{sig_row}'] = company_name
        ws[f'K{sig_row}'].alignment = right

        # ---------------- OUTER BORDER ----------------
        for col in range(1, 21):
            ws.cell(row=1, column=col).border = Border(top=medium)
            ws.cell(row=last_row, column=col).border = Border(bottom=medium)

        for row in range(1, last_row + 1):
            ws.cell(row=row, column=1).border = Border(left=medium)
            ws.cell(row=row, column=20).border = Border(right=medium)

        # ---------------- SAVE ----------------
        if should_save:
            wb.save(file_path)
            wb.close()

        print(f"✨ Formatted {sheet_name} successfully!")

    except Exception as e:
        print(f"❌ Error formatting {sheet_name}: {e}")

def create_consumption_sheet(
    dbk2_df: pd.DataFrame,
    dbk2a_df: pd.DataFrame,
    consumption_pivot: pd.DataFrame,
    consumption_df_dbk: pd.DataFrame
) -> pd.DataFrame:

    print("📊 Creating Consumption Sheet...")

    # ---------------- Validate ----------------
    for df in [dbk2_df, dbk2a_df]:
        if "DESCRIPTION" not in df.columns:
            raise KeyError("Missing 'DESCRIPTION' column")

    # ---------------- Merge BOE ----------------
    dbk2_nil = dbk2_df.empty or (dbk2_df["DESCRIPTION"].astype(str).str.upper() == "NIL").all()
    dbk2a_nil = dbk2a_df.empty or (dbk2a_df["DESCRIPTION"].astype(str).str.upper() == "NIL").all()

    if dbk2_nil and not dbk2a_nil:
        all_boe = dbk2a_df.copy()
    elif dbk2a_nil and not dbk2_nil:
        all_boe = dbk2_df.copy()
    else:
        all_boe = pd.concat([dbk2_df, dbk2a_df], ignore_index=True)

    if all_boe.empty or consumption_pivot.empty:
        return pd.DataFrame()

    cs = all_boe.iloc[:-5].reset_index(drop=True)

    # ---------------- Normalize column names ----------------
    cs.columns = cs.columns.str.strip().str.replace(r"\s+", " ", regex=True)

    # ---------------- Final Columns ----------------
    columns = [
        "SR. NO.","DESCRIPTION","B/E DATE",
        "QTY. IMPORTED ORIGINALY","ASSES-SABLE-VALUE(RS.)",
        "TOTAL DUTY OF CUSTOMS","Stock available",
        "PER UNIT (CUSTOM DUTY) (Rs.)","PER UNIT A. VALUE (Rs.)",
        "Qty Consumed","Balance","Amt Claimed"
    ]
    # columns = [
    #     "SR. NO.","DESCRIPTION","TECH. CHAR.","B/E DATE",
    #     "QTY. IMPORTED ORIGINALY","ASSES-SABLE-VALUE(RS.)",
    #     "TOTAL DUTY OF CUSTOMS","Stock available",
    #     "PER UNIT (CUSTOM DUTY) (Rs.)","PER UNIT A. VALUE (Rs.)",
    #     "Qty Consumed","Balance","Amt Claimed"
    # ]

    final_df = pd.DataFrame(index=cs.index)

    for col in columns:
        final_df[col] = cs[col] if col in cs.columns else np.nan

    # ---------------- Numeric Cleaning ----------------
    numeric_cols = [
        "TOTAL DUTY OF CUSTOMS",
        "QTY. IMPORTED ORIGINALY",
        "ASSES-SABLE-VALUE(RS.)",
        "Stock available"
    ]

    for col in numeric_cols:
        if col in final_df.columns:
            final_df[col] = (
                final_df[col]
                .astype(str)
                .str.replace(",", "", regex=False)
                .str.replace("Rs.", "", regex=False)
                .str.strip()
            )
            final_df[col] = pd.to_numeric(final_df[col], errors="coerce").fillna(0)

    final_df["Qty Consumed"] = 0.0
    final_df["Balance"] = 0.0

    # ---------------- FAST Mapping (vectorized) ----------------
    if (
        "Name of the material /component" in consumption_pivot.columns
        and "Total Export quantity" in consumption_pivot.columns
    ):
        pivot = consumption_pivot.copy()
        pivot["key"] = pivot["Name of the material /component"].str.lower().str.strip()

        final_df["desc_key"] = final_df["DESCRIPTION"].astype(str).str.lower().str.strip()

        lookup = dict(zip(pivot["key"], pivot["Total Export quantity"]))

        final_df["Qty Consumed"] = final_df["desc_key"].map(lookup).fillna(0)

        final_df.drop(columns=["desc_key"], inplace=True)

    # ---------------- Per Unit ----------------
    final_df["PER UNIT (CUSTOM DUTY) (Rs.)"] = np.where(
        final_df["QTY. IMPORTED ORIGINALY"] > 0,
        final_df["TOTAL DUTY OF CUSTOMS"] / final_df["QTY. IMPORTED ORIGINALY"],
        0
    )

    final_df["PER UNIT A. VALUE (Rs.)"] = np.where(
        final_df["QTY. IMPORTED ORIGINALY"] > 0,
        final_df["ASSES-SABLE-VALUE(RS.)"] / final_df["QTY. IMPORTED ORIGINALY"],
        0
    )

    # ---------------- Stock Logic ----------------
    for desc in final_df["DESCRIPTION"].dropna().unique():
        mask = final_df["DESCRIPTION"] == desc
        indices = final_df[mask].index

        carry = 0.0
        for idx in indices:
            stock = final_df.at[idx, "Stock available"]
            required = final_df.at[idx, "Qty Consumed"] + carry

            if required > stock:
                final_df.at[idx, "Qty Consumed"] = stock
                final_df.at[idx, "Balance"] = 0.0
                carry = required - stock
            else:
                final_df.at[idx, "Qty Consumed"] = required
                final_df.at[idx, "Balance"] = stock - required
                carry = 0.0

    # ---------------- Amount ----------------
    final_df["Amt Claimed"] = (
        final_df["PER UNIT (CUSTOM DUTY) (Rs.)"] * final_df["Qty Consumed"]
    )

    # ---------------- Date ----------------
    if "B/E DATE" in final_df.columns:
        final_df["B/E DATE"] = pd.to_datetime(
            final_df["B/E DATE"], errors="coerce"
        ).dt.strftime("%d-%m-%Y")

    # ---------------- SR NO ----------------
    final_df["SR. NO."] = range(1, len(final_df) + 1)

    print(f"✅ Consumption Sheet created: {len(final_df)} rows")
    return final_df

def create_calculation_sheet(
    export_df: pd.DataFrame,
    consumption_sheet: pd.DataFrame,
    dbk1_df: pd.DataFrame
) -> pd.DataFrame:

    print("🧮 Creating Calculation Sheet...")

    if export_df.empty:
        return pd.DataFrame()

    # ---------------- Normalize column names ----------------
    export_df.columns = export_df.columns.str.strip().str.replace(r"\s+", " ", regex=True)
    consumption_sheet.columns = consumption_sheet.columns.str.strip().str.replace(r"\s+", " ", regex=True)

    # ---------------- Validate ----------------
    if 'Part Number of Export Product' not in export_df.columns:
        return pd.DataFrame()

    # ---------------- Build Base Sheet ----------------
    calc_rows = []

    grouped = export_df.groupby('Part Number of Export Product')

    for part_no, part_exports in grouped:

        for _, exp_row in part_exports.iterrows():
            calc_rows.append({
                'Seq': exp_row.get('SR', 0),
                'Invoice Number': exp_row.get('INVOICE NO', ''),
                'Invoice Date': exp_row.get('Invoice Date', ''),
                'SB No': exp_row.get('SB No', ''),
                'SB Date': exp_row.get('SB Date', ''),
                'LEO Date': exp_row.get('LEO Date', ''),
                'Part Number of Export Product': part_no,
                'DESCRIPTION': exp_row.get('DESCRIPTION OF THE EXPORT PRODUCT AS PER SHIPPING BILL', ''),
                'Export Product Qty (Nos)': pd.to_numeric(exp_row.get('QTY(Nos)', 0), errors='coerce'),
                'NET Wt': pd.to_numeric(exp_row.get('NET Wt', 0), errors='coerce'),
                'FOB VALUE OF EXPORT PRODUCT (Rs.)': pd.to_numeric(exp_row.get('FOB VALUE as per SB (Rs)', 0), errors='coerce')
            })

        # Total row
        calc_rows.append({
            'Seq': 'Total',
            'Part Number of Export Product': part_no,
            'Export Product Qty (Nos)': part_exports['QTY(Nos)'].sum(),
            'NET Wt': part_exports['NET Wt'].sum(),
            'FOB VALUE OF EXPORT PRODUCT (Rs.)': part_exports['FOB VALUE as per SB (Rs)'].sum()
        })

    calc_df = pd.DataFrame(calc_rows)

    # ---------------- Duty Mapping ----------------
    if not consumption_sheet.empty and 'DESCRIPTION' in consumption_sheet.columns:

        # Normalize text for matching
        consumption_sheet['desc_key'] = consumption_sheet['DESCRIPTION'].astype(str).str.lower().str.strip()
        calc_df['desc_key'] = calc_df['DESCRIPTION'].astype(str).str.lower().str.strip()

        # Validate required columns
        required_cols = ['Qty Consumed', 'Amt Claimed', 'ASSES-SABLE-VALUE(RS.)']
        for col in required_cols:
            if col not in consumption_sheet.columns:
                raise KeyError(f"{col} missing in consumption_sheet")

        # Create pivot
        per_unit_pivot = consumption_sheet.groupby('desc_key').agg({
            'Qty Consumed': 'sum',
            'Amt Claimed': 'sum',
            'ASSES-SABLE-VALUE(RS.)': 'mean'
        }).reset_index()

        # Safe division
        per_unit_pivot['Customs Duty Per Unit'] = np.where(
            per_unit_pivot['Qty Consumed'] > 0,
            per_unit_pivot['Amt Claimed'] / per_unit_pivot['Qty Consumed'],
            0
        )

        # Lookup maps
        duty_lookup = dict(zip(per_unit_pivot['desc_key'], per_unit_pivot['Customs Duty Per Unit']))
        assess_lookup = dict(zip(per_unit_pivot['desc_key'], per_unit_pivot['ASSES-SABLE-VALUE(RS.)']))

        # Apply mapping
        calc_df['CUSTOMS DUTY PER UNIT (Rs.)'] = calc_df['desc_key'].map(duty_lookup).fillna(0)
        calc_df['ASSESS-ABLE VALUE PER UNIT (Rs.)'] = calc_df['desc_key'].map(assess_lookup).fillna(0)

        # Calculations
        calc_df['DRAW-BACK AMT. TOTAL (Rs.)'] = (
            calc_df['Export Product Qty (Nos)'] * calc_df['CUSTOMS DUTY PER UNIT (Rs.)']
        )

        calc_df['CIF VALUE TOTAL (Rs.)'] = (
            calc_df['Export Product Qty (Nos)'] * calc_df['ASSESS-ABLE VALUE PER UNIT (Rs.)']
        )

        calc_df.drop(columns=['desc_key'], inplace=True)

    print(f"✅ Calculation Sheet created: {len(calc_df)} rows")
    return calc_df

def create_annexures(export_df: pd.DataFrame, calc_df: pd.DataFrame) -> tuple:
    print("Creating Annexures...")

    annexure_inv = export_df.iloc[:-4].copy()
    calc_df = calc_df.copy()
    print('calc_dfcalc_df',calc_df.columns)

    annexure_inv.columns = annexure_inv.columns.str.strip()
    calc_df.columns = calc_df.columns.str.strip()

    if 'Seq' in calc_df.columns and 'Invoice No' in calc_df.columns:
        drawback_totals = calc_df[calc_df['Seq'].str.upper() == 'TOTAL'][[
            'Invoice No', 'DRAW-BACK AMT. TOTAL (Rs.)'
        ]]
        drawback_lookup = drawback_totals.set_index('Invoice No')['DRAW-BACK AMT. TOTAL (Rs.)'].to_dict()
    else:
        drawback_lookup = {}


    annexure_inv['TOTAL DRAWBACK CLAIM (Rs.)'] = annexure_inv['INVOICE NO'].map(drawback_lookup).fillna(0)

    columns = [
        'SR No.', 'Invoice No', 'Invoice Date', 'SB Number', 'SB Date', 'LEO Date',
        'PORT OF EXPORT', 'Part Number of Export Product',
        'Description of Product as per SB', 'Qty (Nos)',
        'TOTAL DRAWBACK CLAIM (Rs.)', 'REMARK'
    ]

    DRAWBACK_CLAIM_INVOICE_DF = pd.DataFrame(columns=columns)

    if not annexure_inv.empty:
        DRAWBACK_CLAIM_INVOICE_DF['SR No.'] = annexure_inv['SR']
        DRAWBACK_CLAIM_INVOICE_DF['Invoice No'] = annexure_inv['INVOICE NO']
        DRAWBACK_CLAIM_INVOICE_DF['Invoice Date'] = annexure_inv['Invoice Date']
        DRAWBACK_CLAIM_INVOICE_DF['SB Number'] = annexure_inv['SB No']
        DRAWBACK_CLAIM_INVOICE_DF['SB Date'] = annexure_inv['SB Date']
        DRAWBACK_CLAIM_INVOICE_DF['LEO Date'] = annexure_inv['LEO Date']
        DRAWBACK_CLAIM_INVOICE_DF['PORT OF EXPORT'] = annexure_inv['PORT OF EXPORT']
        DRAWBACK_CLAIM_INVOICE_DF['Part Number of Export Product'] = annexure_inv['Part Number of Export Product']
        DRAWBACK_CLAIM_INVOICE_DF['Description of Product as per SB'] = annexure_inv['DESCRIPTION OF THE EXPORT PRODUCT AS PER SHIPPING BILL']
        DRAWBACK_CLAIM_INVOICE_DF['Qty (Nos)'] = annexure_inv['QTY(Nos)']
        
        calc_df = calc_df.reset_index(drop=True)

        calc_df['Seq'] = calc_df['Seq'].astype(str).str.strip().str.upper()
        calc_df['DRAW-BACK AMT. TOTAL (Rs.)'] = pd.to_numeric(
            calc_df['DRAW-BACK AMT. TOTAL (Rs.)'],
            errors='coerce'
        )

        sr_to_total = {}

        seq_series = calc_df['Seq']

        for idx, val in seq_series.items():

            if pd.notna(val) and str(val).strip().isdigit():
                sr = int(float(val))  # handles "1.0" also

                for j in range(idx + 1, len(seq_series)):
                    if str(seq_series[j]).strip().upper() == 'TOTAL':
                        sr_to_total[sr] = calc_df.loc[
                            j, 'DRAW-BACK AMT. TOTAL (Rs.)'
                        ]
                        break

                for j in range(idx + 1, len(seq_series)):
                    if seq_series[j] == 'TOTAL':
                        sr_to_total[sr] = calc_df.loc[
                            j, 'DRAW-BACK AMT. TOTAL (Rs.)'
                        ]
                        break
        DRAWBACK_CLAIM_INVOICE_DF['TOTAL DRAWBACK CLAIM (Rs.)'] = (
            annexure_inv['SR']
            .map(sr_to_total)
            .fillna(0)
        )
        DRAWBACK_CLAIM_INVOICE_DF['REMARK'] = '-'

    numeric_cols = ['QTY(Nos)', 'FOB VALUE as per SB (Rs)', 'PM VALUE as per SB (Rs)']
    br_and_drawback_df_pivot = DRAWBACK_CLAIM_INVOICE_DF.groupby('SB Number', as_index=False).agg({
        'TOTAL DRAWBACK CLAIM (Rs.)': 'sum'
    })

    for c in numeric_cols:
        annexure_inv[c] = annexure_inv[c].replace(r'^\s*$', pd.NA, regex=True)
        annexure_inv[c] = pd.to_numeric(annexure_inv[c], errors='coerce')

    annexure_inv_clean = annexure_inv.dropna(subset=numeric_cols, how='all')


    annexure_sb = (
        annexure_inv_clean
        .groupby(['SB No', 'SB Date', 'LEO Date', 'PORT OF EXPORT'], as_index=False)
        .agg({
            'QTY(Nos)': 'sum',
            'FOB VALUE as per SB (Rs)': 'sum',
            'PM VALUE as per SB (Rs)': 'sum',
        })
    )

    annexure_sb['33% PMV'] = annexure_sb['PM VALUE as per SB (Rs)'] / 3
    annexure_sb['AIR'] = annexure_sb['FOB VALUE as per SB (Rs)'] * 0.02
    total_rows = calc_df[calc_df['Seq'].str.upper() == 'TOTAL']
    total_rows = total_rows.reset_index(drop=True)
    annexure_sb['Brand Rate'] = br_and_drawback_df_pivot['TOTAL DRAWBACK CLAIM (Rs.)']
    annexure_sb['4/5 of Br Rate'] = annexure_sb['Brand Rate'] * 0.8
    annexure_sb['Net DBK'] = annexure_sb['Brand Rate'] - annexure_sb['AIR']
    annexure_sb['Rule 7'] = np.where(annexure_sb['4/5 of Br Rate'] > annexure_sb['AIR'], 'Fullfilled', 'Unfullfilled')

    value_addition_sb = (
        calc_df
        .groupby('SB No', as_index=False)
        .agg({
            "FOB VALUE OF EXPORT PRODUCT (Rs.)": "sum",
            "CIF VALUE TOTAL (Rs.)": "sum",
        })
    )

    value_addition_sb["FOB VALUE OF EXPORT PRODUCT (Rs.)"] = pd.to_numeric(
        value_addition_sb["FOB VALUE OF EXPORT PRODUCT (Rs.)"],
        errors="coerce"
    )

    value_addition_sb["CIF VALUE TOTAL (Rs.)"] = pd.to_numeric(
        value_addition_sb["CIF VALUE TOTAL (Rs.)"],
        errors="coerce"
    )

    value_addition_sb["VA"] = np.where(
        value_addition_sb["CIF VALUE TOTAL (Rs.)"] > 0,
        (
            (value_addition_sb["FOB VALUE OF EXPORT PRODUCT (Rs.)"]
            - value_addition_sb["CIF VALUE TOTAL (Rs.)"])
            / value_addition_sb["CIF VALUE TOTAL (Rs.)"]
        ) * 100,
        0
    )

    value_addition_sb["VA"] = value_addition_sb["VA"].round(2)

    value_addition_sb["Application NO"] = ""

    value_addition_sb = value_addition_sb.rename(columns={
        "SB No": "SB",
        "FOB VALUE OF EXPORT PRODUCT (Rs.)": "FOB",
        "CIF VALUE TOTAL (Rs.)": "CIF"
    })

    value_addition_sb["SR No"] = range(1, len(value_addition_sb) + 1)

    value_addition_sb = value_addition_sb[['SR No', 'Application NO', 'SB', 'FOB', 'CIF', 'VA']
    ]

    return DRAWBACK_CLAIM_INVOICE_DF, annexure_sb, value_addition_sb,br_and_drawback_df_pivot

def set_border(cell, top=None, bottom=None, left=None, right=None):
    cell.border = Border(
        top=top or cell.border.top,
        bottom=bottom or cell.border.bottom,
        left=left or cell.border.left,
        right=right or cell.border.right
    )

def safe_write(ws, row, col, value):
    cell = ws.cell(row=row, column=col)

    if isinstance(cell, MergedCell):
        for merged_range in ws.merged_cells.ranges:
            if (
                merged_range.min_row <= row <= merged_range.max_row and
                merged_range.min_col <= col <= merged_range.max_col
            ):
                row = merged_range.min_row
                col = merged_range.min_col
                break

    ws.cell(row=row, column=col).value = value

def merge_and_style(ws, row, start_col, end_col, text=None, bold=False, align="left", border=False):
    """Helper for merging + styling"""
    cell = ws.cell(row=row, column=start_col)

    if text:
        cell.value = text

    cell.font = Font(bold=bold)

    if align == "center":
        cell.alignment = Alignment(horizontal="center", wrap_text=True)
    else:
        cell.alignment = Alignment(wrap_text=True)

    ws.merge_cells(start_row=row, start_column=start_col, end_row=row, end_column=end_col)

    if border:
        thick = Side(style="medium")
        for col in range(start_col, end_col + 1):
            ws.cell(row=row, column=col).border = Border(
                top=thick,
                bottom=thick,
                left=thick if col == start_col else None,
                right=thick if col == end_col else None
            )

def create_dbk_sr_numbers(dbk1_df: pd.DataFrame, dbk2_df: pd.DataFrame, 
                         dbk2a_df: pd.DataFrame, calc_df: pd.DataFrame,
                         consumption_sheet: pd.DataFrame) -> dict:
    """Create DBK serial numbers mapping (Steps 88-94)"""
    print("🔢 Creating DBK Serial Numbers...")
    
    if dbk1_df.empty:
        return {}
    
    # Step 89-92: Create pivot and concatenate serial numbers
    if 'Name of the material /component' in dbk1_df.columns and 'Sr No' in dbk1_df.columns:
        dbk_sr_pivot = dbk1_df.groupby('Name of the material /component')['Sr No'].apply(
            lambda x: '&'.join(map(str, x))
        ).reset_index()
        
        dbk_sr_pivot.columns = ['Description', 'Serial_Numbers']
        sr_lookup = dbk_sr_pivot.set_index('Description')['Serial_Numbers'].to_dict()
        
        # Step 93: Apply to all sheets
        for df in [dbk2_df, dbk2a_df, calc_df, consumption_sheet]:
            if not df.empty and 'DESCRIPTION' in df.columns:
                df['S.NO. IN DBK I STATEMENT'] = df['DESCRIPTION'].map(sr_lookup)
        
        print("✅ DBK serial number mappings added")
        return sr_lookup
    
    return {}

def save_all_outputs(datasets: dict, month: str, config: dict):
    output_dir = Path("./data/outputs") / month
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"💾 Saving outputs for {month}...")

    main_file = output_dir / "DBK Working Sheet.xlsx"
    backworking_file = output_dir / "Backworking Sheets.xlsx"

    app_no = config.get("Aplication_no", "")

    sheet_configs = {
        "Export Statement": {"file": "main", "title": f"EXPORT STATEMENT - BRAND RATE - {app_no}", "custom_format": False},
        "DBK-1": {"file": "main", "title": f"STATEMENT DBK-I - BRAND RATE - {app_no}", "custom_format": False},
        "DBK-2": {"file": "main", "title": f"STATEMENT DBK-II - BRAND RATE - {app_no}", "custom_format": False},
        "DBK-2A": {"file": "main", "title": f"STATEMENT DBK-IIA - BRAND RATE - {app_no}", "custom_format": False},
        "DBK-3": {"file": "main", "title": f"STATEMENT DBK-III - BRAND RATE - {app_no}", "custom_format": True},
        "DBK-3A": {"file": "main", "title": f"STATEMENT DBK-IIIA - BRAND RATE - {app_no}", "custom_format": True},
        "Consumption Sheet": {"file": "main", "title": f"CONSUMPTION STATEMENT - BRAND RATE - {app_no}", "custom_format": False},
        "Calculation Sheet": {"file": "main", "title": f"WORKING SHEET - BRAND RATE - {app_no}", "custom_format": False},
        "Invoice wise Annexure": {"file": "main", "title": f"ANNEXURE - INVOICE WISE - {app_no}", "custom_format": False},
        "SB wise Annexure": {"file": "main", "title": f"ANNEXURE - SB WISE - {app_no}", "custom_format": False},
        "Value Addition Sheet": {"file": "main", "title": f"VALUE ADDITION SHEET - {app_no}", "custom_format": False},

        "BOM": {"file": "back", "title": "Bill of Materials Working", "custom_format": False},
        "Consumption Pivot": {"file": "back", "title": "Consumption Pivot", "custom_format": False},
        "Consumption Pivot DBK": {"file": "back", "title": "Consumption Pivot DBK", "custom_format": False},
        "Count Calculation Sheet": {"file": "back", "title": "Count Calculation Sheet", "custom_format": False},
        "SR Mapping Sheet": {"file": "back", "title": "SR Mapping Sheet", "custom_format": False},
        "Per Unit Assessable Value": {"file": "back", "title": "Per Unit Assessable Value", "custom_format": False},
        "Per Unit Lookup Summary": {"file": "back", "title": "Per Unit Lookup Summary", "custom_format": False},
    }

    # ================= WRITE DATA =================
    with pd.ExcelWriter(main_file, engine="openpyxl") as main_writer, \
         pd.ExcelWriter(backworking_file, engine="openpyxl") as back_writer:

        for sheet_name, df in datasets.items():
            if df.empty:
                continue

            cfg = sheet_configs.get(sheet_name, {"file": "back", "title": sheet_name, "custom_format": False})
            safe_name = sheet_name[:31]
            writer = main_writer if cfg["file"] == "main" else back_writer

            if cfg["custom_format"]:
                df.to_excel(writer, sheet_name=safe_name, index=False, header=False)
            else:
                df.to_excel(writer, sheet_name=safe_name, index=False, startrow=8)

    # ================= FORMAT MAIN FILE =================
    wb_main = load_workbook(main_file)

    for sheet_name, df in datasets.items():
        if df.empty:
            continue

        cfg = sheet_configs.get(sheet_name)
        if not cfg or cfg["file"] != "main":
            continue

        safe_name = sheet_name[:31]
        if safe_name not in wb_main.sheetnames:
            continue

        if cfg["custom_format"]:
            format_dbk3_sheets(wb_main, safe_name, df)
        else:
            add_sheet_header_wb(wb_main, safe_name, cfg["title"], config)
            style_table_body_wb(wb_main, safe_name, start_row=9)
            add_sheet_footer_wb(wb_main, safe_name, config)

    wb_main.save(main_file)
    wb_main.close()

    # ================= FORMAT BACK FILE =================
    wb_back = load_workbook(backworking_file)

    for sheet_name, df in datasets.items():
        if df.empty:
            continue

        cfg = sheet_configs.get(sheet_name)
        if not cfg or cfg["file"] != "back":
            continue

        safe_name = sheet_name[:31]
        if safe_name not in wb_back.sheetnames:
            continue

        add_sheet_header_wb(wb_back, safe_name, cfg["title"], config)
        style_table_body_wb(wb_back, safe_name, start_row=9)
        add_sheet_footer_wb(wb_back, safe_name, config)

    wb_back.save(backworking_file)
    wb_back.close()

    print(f"✅ Saved main report: {main_file}")
    print(f"✅ Saved backworking file: {backworking_file}")

def main():
    print("🚀 Starting Autoliv DBK Automation Process")
    print("=" * 50)
    
    config = load_config("config.yaml")
    print("✅ Configuration loaded")
    
    datasets = read_input_files(Path("./data/inputs"), config)
    
    months = config.get("months", [])
    
    for i, month in enumerate(months):
        print(f"\n📅 Processing {month}")
        print("-" * 30)
        
        month_data = datasets.get(month, {})
        output_datasets = {}
        
        # Get current month data
        sb_df = month_data.get("sb", pd.DataFrame())
        current_esr_df = month_data.get("export_sales", pd.DataFrame())
        boe_df = month_data.get("boe", pd.DataFrame())
        
        # Get previous month data (for fallback Export Item No.)
        previous_month = months[i + 1] if i + 1 < len(months) else None
        previous_month_data = datasets.get(previous_month, {}) if previous_month else {}
        previous_esr_df = previous_month_data.get("export_sales", pd.DataFrame())
        
        if sb_df.empty:
            print(f"⚠️ No SB data for {month}, skipping...")
            continue

        # ===== STEP 1-15: Process SB Data =====
        processed_sb = process_sb_data(sb_df, current_esr_df, previous_esr_df, config, month)
        processed_sb['LEO DATE'] = pd.to_datetime(
            processed_sb['LEO DATE'],
            format='%d-%m-%Y',
            errors='coerce'
        )
        FIRST_LEO_DATE = processed_sb['LEO DATE'].min()
        
        # Save processed SB data
        month_output = Path("./data/outputs") / month
        month_output.mkdir(parents=True, exist_ok=True)
        processed_sb.to_excel(month_output / "Data for DBK.xlsx", sheet_name="Data For DBK", index=False)
        print(f"✅ Saved Data for DBK")
    
        # ===== STEP 16-19: Create Export Statement =====
        export_statement = create_export_statement(processed_sb, config, month)
        output_datasets["Export Statement"] = export_statement
        
        # ===== STEP 20-42: Create BOM Working and DBK-1 =====
        bom_file_path = f"./data/inputs/{month}/BOMWORKING.xlsx"
        bom_working_df, _ = create_bom_working(
            export_statement,
            bom_file=bom_file_path,
            bom_sheet="main",
            config=config,
            month=month
        )
        output_datasets["BOM"] = bom_working_df
        output_datasets["DBK-1"] = bom_working_df
        
        # ===== STEP 43-47: Create Consumption Pivot =====
        if (
            not bom_working_df.empty
            and "part no" in bom_working_df.columns
            and "Export quantity" in bom_working_df.columns
        ):
            # Filter out Export Product rows
            dbk_items = bom_working_df[~bom_working_df['Sr No'].astype(str).str.contains('Export Product', na=False)]

            # Create consumption pivot
            consumption_df = (
                dbk_items.groupby(["part no", "Name of the material /component"], as_index=False)["Export quantity"]
                .sum()
                .rename(columns={"Export quantity": "Total Export quantity"})
            )
            consumption_df_dbk = (
                dbk_items.groupby(["Sr No","part no", "Name of the material /component"], as_index=False)["Export quantity"]
                .sum()
                .rename(columns={"Export quantity": "Total Export quantity"})
            )
            output_datasets["Consumption Pivot"] = consumption_df
            output_datasets["Consumption Pivot DBK"] = consumption_df_dbk
            print(f"✅ Created consumption pivot: {len(consumption_df)} rows")
            print(f"✅ Created Consumption Pivot DBK: {len(consumption_df_dbk)} rows")
        else:
            consumption_df = pd.DataFrame(
                columns=["part no", "Name of the material /component", "Total Export quantity"]
            )
            consumption_df_dbk = pd.DataFrame(
                columns=["Sr No","part no", "Name of the material /component","Total Export quantity"]
            )
            output_datasets["Consumption Pivot"] = consumption_df
            output_datasets["Consumption Pivot DBK"] = consumption_df_dbk
        
        # ===== STEP 48-51: Create DBK-2 and DBK-2A =====
        dbk2, dbk2a = create_dbk_statements_90days(
            boe_cs_df=boe_df,
            consumption_df=consumption_df,
            DATE=FIRST_LEO_DATE,
            config=config
        )

        output_datasets["DBK-2"] = dbk2
        output_datasets["DBK-2A"] = dbk2a
        
        # ===== Create DBK-3 and DBK-3A =====
        dbk3, dbk3a = create_dbk3_statements(config=config, month=month)
        output_datasets["DBK-3"] = dbk3
        output_datasets["DBK-3A"] = dbk3a
        
        # ===== STEP 52-54: Create Consumption Sheet =====
        consumption_sheet = create_consumption_sheet(dbk2,
            dbk2a,
            consumption_df,
            consumption_df_dbk)
        output_datasets["Consumption Sheet"] = consumption_sheet
        
        # ===== STEP 55-71: Create Calculation Sheet =====
        calculation_sheet = create_calculation_sheet(export_statement, consumption_sheet, bom_working_df)
        output_datasets["Calculation Sheet"] = calculation_sheet
        
        # ===== STEP 72-87: Create Annexures =====
        annexure_inv, annexure_sb, value_addition, tf = create_annexures(export_statement, calculation_sheet)
        output_datasets["Invoice wise Annexure"] = annexure_inv
        output_datasets["SB wise Annexure"] = annexure_sb
        output_datasets["Value Addition Sheet"] = value_addition
        output_datasets["tf"] = tf
        # output_datasets["Invoice wise Annexure"] = annexure_inv
        # output_datasets["Annexure SB"] = annexure_sb
        # output_datasets["Value Addition Sheet"] = value_addition
        
        # # ===== STEP 88-94: Create DBK Serial Numbers =====
        dbk_sr_mapping = create_dbk_sr_numbers(
            bom_working_df, dbk2, dbk2a, calculation_sheet, consumption_sheet
        )
        
        # # Update datasets with serial numbers
        if dbk_sr_mapping:
            output_datasets["DBK-2"] = dbk2
            output_datasets["DBK-2A"] = dbk2a
            output_datasets["Calculation Sheet"] = calculation_sheet
            output_datasets["Consumption Sheet"] = consumption_sheet
        
        # # ===== Summary =====
        print(f"\n📊 Output datasets summary for {month}:")
        for sheet_name, df in output_datasets.items():
            print(f"   - {sheet_name}: {len(df)} rows")
        
        # ===== Save All Outputs =====
        save_all_outputs(output_datasets, month, config)
        
        print(f"✅ Completed processing for {month}")
    
    print("\n🎉 All months processed successfully!")
    print("=" * 50)


if __name__ == "__main__":
    main()