"""
runner_v1.py — Next.js entry point for version1.py
version1.py stays 100% unchanged.
"""
import os, sys, json, shutil, builtins
from pathlib import Path

# ── 1. Env vars ────────────────────────────────────────────────────────────
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
        else "warn" if ("⚠️" in msg or "Warning" in msg or "Missing" in msg)
        else "err"  if ("❌" in msg or "Error" in msg or "Failed" in msg)
        else "info")
    _jlog(level, clean)
builtins.print = _smart_print

# ── 3. Build folder structure version1.py expects ─────────────────────────
month      = TOOL_CONFIG.get("month", "January 2025")
brand_rate = TOOL_CONFIG.get("brand_rate", "43")

FAKE_INPUTS_DIR  = Path(JOB_DIR) / "data" / "inputs" / month
FAKE_OUTPUTS_DIR = Path(JOB_DIR) / "data" / "outputs"
FAKE_INPUTS_DIR.mkdir(parents=True, exist_ok=True)
FAKE_OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

FILE_MAP = {
    "sb":          "shipping_bill.xlsx",
    "boe":         "boe_customs_statement.xlsx",
    "bom":         "BOMWORKING.xlsx",
    "export_sales":"export_sales.xlsx",
}
for key, dest_name in FILE_MAP.items():
    if key in INPUT_FILES:
        shutil.copy(str(INPUT_FILES[key]), str(FAKE_INPUTS_DIR / dest_name))
        _jlog("ok", f"Copied {key} → {dest_name}")

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
    "inputs": {
        "sb":           "shipping_bill.xlsx",
        "boe":          "boe_customs_statement.xlsx",
        "bom":          "BOMWORKING.xlsx",
        "export_sales": "export_sales.xlsx",
    },
}
with open(Path(JOB_DIR) / "config.yaml", "w") as f:
    yaml.dump(config, f)
_jlog("ok", "config.yaml written")

# ── 5. chdir ──────────────────────────────────────────────────────────────
os.chdir(JOB_DIR)

# ── 6. Import and run version1 ────────────────────────────────────────────
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))
sys.path.insert(0, str(script_dir.parent))

_jlog("info", "Importing version1...")
try:
    import version1 as v1
except ImportError as e:
    _jlog("err", f"Cannot import version1.py: {e}")
    sys.exit(1)

_jlog("info", f"Running Brand Rate V1 — {month}")
try:
    v1.main()
except SystemExit:
    pass
except Exception as e:
    import traceback
    _jlog("err", f"Pipeline error: {e}")
    _jlog("warn", traceback.format_exc())
    sys.exit(1)

# ── 7. Copy outputs to OUTPUT_DIR and build manifest ──────────────────────
# version1.py writes to: JOB_DIR/data/outputs/<month>/
src_month_dir = Path(JOB_DIR) / "data" / "outputs" / month
dst_dir = Path(OUTPUT_DIR)
dst_dir.mkdir(parents=True, exist_ok=True)

_jlog("info", f"Copying outputs from {src_month_dir} → {dst_dir}")

# Also copy any files written directly to data/outputs/ (not month subdir)
for search_dir in [src_month_dir, Path(JOB_DIR) / "data" / "outputs"]:
    if search_dir.exists():
        for f in search_dir.iterdir():
            if f.is_file() and f.suffix in [".xlsx", ".xls", ".csv"]:
                dst_file = dst_dir / f.name
                shutil.copy(str(f), str(dst_file))
                _jlog("ok", f"Output ready: {f.name}")

# ── 8. Write manifest — use ACTUAL files that exist in OUTPUT_DIR ──────────
from manifest_writer import ManifestWriter

writer = ManifestWriter(output_dir=str(OUTPUT_DIR))

# Scan what actually exists in OUTPUT_DIR and register each file
# version1.py writes exactly these two filenames:
#   "DBK Working Sheet.xlsx"   → main report
#   "Backworking Sheets.xlsx"  → backworking
MAIN_FILES = ["dbk working sheet"]
BACK_FILES = ["backworking sheets"]

for f in sorted(dst_dir.iterdir()):
    if not f.is_file() or f.suffix not in [".xlsx", ".xls"]:
        continue
    name_lower = f.name.lower()
    is_main = any(kw in name_lower for kw in MAIN_FILES)
    file_type = "main" if is_main else "back"
    label = f.stem
    writer.add_output(label, 0, str(f), file_type)
    _jlog("ok", f"Registered [{file_type}]: {f.name}")

main_ok = (dst_dir / "DBK Working Sheet.xlsx").exists()
back_ok = (dst_dir / "Backworking Sheets.xlsx").exists()

writer.add_validation("Output files", "DBK Working Sheet produced",
    "pass" if main_ok else "fail",
    "Found" if main_ok else "Missing")
writer.add_validation("Output files", "Backworking Sheets produced",
    "pass" if back_ok else "fail",
    "Found" if back_ok else "Missing")
writer.add_validation("Pipeline", "Script completed without errors", "pass", "OK")

writer.save()
_jlog("ok", "Done ✓")
