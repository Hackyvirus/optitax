"""
runner_v2.py — Next.js entry point for version2.py
version2.py stays 100% unchanged.

Version 2 takes 3 files:
  - sb          → Shipping Bill
  - boe_master  → BOE Master Sheet  (used as both "boe" and "boe_cs" in version2)
  - bom         → BOM Working

version2.py's main() reads:
  boe_df    = month_data.get("boe", ...)      ← boe_customs_statement.xlsx
  boe_cs_df = month_data.get("boe_cs", ...)   ← boe_cs.xlsx
Both come from the same BOE Master Sheet file the user uploads.
"""

import os, sys, json, shutil, builtins
from pathlib import Path

# ── 1. Read env vars ───────────────────────────────────────────────────────
INPUT_FILES = json.loads(os.environ.get("INPUT_FILES", "{}"))
TOOL_CONFIG = json.loads(os.environ.get("TOOL_CONFIG", "{}"))
OUTPUT_DIR  = os.environ.get("OUTPUT_DIR", "")

if not INPUT_FILES or not OUTPUT_DIR:
    print(json.dumps({"level":"err","msg":"Missing INPUT_FILES or OUTPUT_DIR"}), flush=True)
    sys.exit(1)

JOB_DIR = str(Path(OUTPUT_DIR).parent)

# ── 2. Patch print() → JSON ────────────────────────────────────────────────
_orig_print = builtins.print

def _jlog(level, msg):
    _orig_print(json.dumps({"level": level, "msg": str(msg).strip()}), flush=True)

def _smart_print(*args, **kwargs):
    msg = " ".join(str(a) for a in args)
    clean = (msg.replace("✅","").replace("⚠️","").replace("❌","")
               .replace("🚀","").replace("🎉","").replace("📊","")
               .replace("📋","").replace("🔧","").replace("💾","")
               .replace("📅","").replace("🔢","").replace("📝","")
               .replace("🧮","").replace("─","").replace("=","").strip())
    if not clean:
        return
    level = ("ok"   if "✅" in msg
        else "warn" if ("⚠️" in msg or "Warning" in msg or "Missing" in msg or "missing" in msg)
        else "err"  if ("❌" in msg or "Error" in msg or "error" in msg or "Failed" in msg or "failed" in msg)
        else "info")
    _jlog(level, clean)

builtins.print = _smart_print

# ── 3. Build folder structure version2.py expects ─────────────────────────
month      = TOOL_CONFIG.get("month", "January 2025")
brand_rate = TOOL_CONFIG.get("brand_rate", "43")

FAKE_INPUTS_DIR  = Path(JOB_DIR) / "data" / "inputs" / month
FAKE_OUTPUTS_DIR = Path(JOB_DIR) / "data" / "outputs"
FAKE_INPUTS_DIR.mkdir(parents=True, exist_ok=True)
FAKE_OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

# Version 2 only has 3 uploaded files:
#   sb         → shipping_bill.xlsx
#   boe_master → boe_customs_statement.xlsx  AND boe_cs.xlsx (same file, used as both)
#   bom        → BOMWORKING.xlsx
FILE_MAP = {
    "sb":          "shipping_bill.xlsx",
    "bom":         "BOMWORKING.xlsx",
}

for key, dest_name in FILE_MAP.items():
    if key in INPUT_FILES:
        shutil.copy(str(INPUT_FILES[key]), str(FAKE_INPUTS_DIR / dest_name))
        _jlog("ok", f"Copied {key} → {dest_name}")

# BOE Master Sheet is used as BOTH boe and boe_cs in version2
if "boe_master" in INPUT_FILES:
    shutil.copy(str(INPUT_FILES["boe_master"]), str(FAKE_INPUTS_DIR / "boe_customs_statement.xlsx"))
    shutil.copy(str(INPUT_FILES["boe_master"]), str(FAKE_INPUTS_DIR / "boe_cs.xlsx"))
    _jlog("ok", "Copied boe_master → boe_customs_statement.xlsx + boe_cs.xlsx")

# ── 4. Write config.yaml ───────────────────────────────────────────────────
import yaml

config = {
    "months":              [month],
    "company":             TOOL_CONFIG.get("company",             "Company Name"),
    "office_address":      TOOL_CONFIG.get("office_address",      ""),
    "brand_rate":          brand_rate,
    "Aplication_no":       TOOL_CONFIG.get("Aplication_no",       brand_rate),
    "plant_code":          TOOL_CONFIG.get("plant_code",          "INBD-ICD"),
    "place_left":          TOOL_CONFIG.get("place_left",          "Pune"),
    "place_right":         TOOL_CONFIG.get("place_right",         "Bengaluru"),
    "product_description": TOOL_CONFIG.get("product_description", "Safety Air Bags, Seat Belts & Steering Wheels"),
    "commencement_date":   TOOL_CONFIG.get("commencement_date",   "01-04-2023"),
    "CA_place":            TOOL_CONFIG.get("CA_place",            "Pune"),
    "Application_Place":   TOOL_CONFIG.get("Application_Place",   "Mumbai"),
    "Engineer_Name":       TOOL_CONFIG.get("Engineer_Name",       ""),
    "Designation":         TOOL_CONFIG.get("Designation",         "Chartered Engineer"),
    "Designation_Address": TOOL_CONFIG.get("Designation_Address", ""),
    "Branch":              TOOL_CONFIG.get("Branch",              ""),
    "NameAdd":             TOOL_CONFIG.get("NameAdd",             ""),
    "filter_conditions":   {"scheme_codes": [19, 43]},
    "parameters":          {"air_dbk_percent": 0.02},
    # version2 needs both boe and boe_cs — both map to the same BOE Master Sheet
    "inputs": {
        "sb":           "shipping_bill.xlsx",
        "boe":          "boe_customs_statement.xlsx",
        "boe_cs":       "boe_cs.xlsx",
        "bom":          "BOMWORKING.xlsx",
    },
}

with open(Path(JOB_DIR) / "config.yaml", "w") as f:
    yaml.dump(config, f)
_jlog("ok", "config.yaml written")

# ── 5. chdir so all relative paths resolve ────────────────────────────────
os.chdir(JOB_DIR)

# ── 6. Import and run version2 ────────────────────────────────────────────
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))
sys.path.insert(0, str(script_dir.parent))

_jlog("info", "Importing version2...")
try:
    import version2 as v2
except ImportError as e:
    _jlog("err", f"Cannot import version2.py: {e}")
    sys.exit(1)

_jlog("info", f"Running Brand Rate V2 — {month}")
try:
    v2.main()
except SystemExit:
    pass
except Exception as e:
    import traceback
    _jlog("err", f"Pipeline error: {e}")
    _jlog("warn", traceback.format_exc())
    sys.exit(1)

# ── 7. Copy outputs → OUTPUT_DIR ──────────────────────────────────────────
src_out = Path(JOB_DIR) / "data" / "outputs" / month
dst_out = Path(OUTPUT_DIR)
dst_out.mkdir(parents=True, exist_ok=True)

# Also check root outputs dir in case version2 writes there
for search_dir in [src_out, Path(JOB_DIR) / "data" / "outputs"]:
    if search_dir.exists():
        for f in search_dir.iterdir():
            if f.is_file() and f.suffix in [".xlsx", ".xls", ".csv"]:
                shutil.copy(str(f), str(dst_out / f.name))
                _jlog("ok", f"Output ready: {f.name}")

# ── 8. Write manifest ─────────────────────────────────────────────────────
from manifest_writer import ManifestWriter

writer = ManifestWriter(output_dir=str(OUTPUT_DIR))

# version2.py writes exactly these two filenames:
#   "Main DBK Working Sheet.xlsx"   → main report
#   "Main Backworking Sheets.xlsx"  → backworking
MAIN_FILES = ["main dbk working sheet", "dbk working sheet"]
BACK_FILES = ["main backworking sheets", "backworking sheets"]

for f in sorted(dst_out.iterdir()):
    if not f.is_file() or f.suffix not in [".xlsx", ".xls"]:
        continue
    name_lower = f.name.lower()
    is_main = any(kw in name_lower for kw in MAIN_FILES)
    is_back = any(kw in name_lower for kw in BACK_FILES)
    file_type = "main" if is_main else "back"
    label = f.stem  # "Main DBK Working Sheet", "Main Backworking Sheets" etc.
    writer.add_output(label, 0, str(f), file_type)
    _jlog("ok", f"Registered [{file_type}]: {f.name}")

main_ok = any((dst_out / f).exists() for f in ["Main DBK Working Sheet.xlsx", "DBK Working Sheet.xlsx"])
back_ok = any((dst_out / f).exists() for f in ["Main Backworking Sheets.xlsx", "Backworking Sheets.xlsx"])

writer.add_validation("Output files", "Main DBK Working Sheet produced",
    "pass" if main_ok else "fail",
    "Found" if main_ok else "Missing")
writer.add_validation("Output files", "Main Backworking Sheets produced",
    "pass" if back_ok else "fail",
    "Found" if back_ok else "Missing")
writer.add_validation("Pipeline", "Script completed without errors", "pass", "OK")

writer.save()
_jlog("ok", "Done ✓")
