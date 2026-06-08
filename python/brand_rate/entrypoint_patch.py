"""
entrypoint_patch.py
-------------------
Add these lines at the very TOP of version1.py and version2.py,
BEFORE any existing code. This patches the script to read uploaded
files from Next.js env vars instead of from config.yaml + local paths.

HOW TO USE:
  Copy the block between === START === and === END === and paste it
  as the first thing in version1.py (before "import yaml").

=== START PASTE ===

import os, sys, json, shutil
from pathlib import Path

# ── Next.js integration patch ──────────────────────────────────────────────
_INPUT_FILES  = json.loads(os.environ.get("INPUT_FILES",  "{}"))
_TOOL_CONFIG  = json.loads(os.environ.get("TOOL_CONFIG",  "{}"))
_OUTPUT_DIR   = os.environ.get("OUTPUT_DIR", "")

if _INPUT_FILES and _OUTPUT_DIR:
    # Build a synthetic config.yaml in the output dir so load_config() works
    import yaml
    _month = _TOOL_CONFIG.get("month", "January 2025")
    _brand = _TOOL_CONFIG.get("brand_rate", "43")

    # Copy uploaded files to a temp inputs/ dir next to outputs/
    _job_dir   = str(Path(_OUTPUT_DIR).parent)
    _input_dir = str(Path(_job_dir) / "inputs_organised" / _month)
    Path(_input_dir).mkdir(parents=True, exist_ok=True)

    _file_map = {
        "sb":          "shipping_bill.xlsx",
        "boe":         "boe_customs_statement.xlsx",
        "boe_master":  "boe_customs_statement.xlsx",   # v2 alias
        "bom":         "BOMWORKING.xlsx",
        "export_sales":"export_sales.xlsx",
    }
    for _key, _dest_name in _file_map.items():
        if _key in _INPUT_FILES:
            shutil.copy(_INPUT_FILES[_key], str(Path(_input_dir) / _dest_name))

    _config = {
        "months": [_month],
        "company": _TOOL_CONFIG.get("company", "Company Name"),
        "office_address": _TOOL_CONFIG.get("address", ""),
        "brand_rate": _brand,
        "Aplication_no": _brand,
        "plant_code": _TOOL_CONFIG.get("plant_code", "INBD-ICD"),
        "place_left":  _TOOL_CONFIG.get("place_left",  "Pune"),
        "place_right": _TOOL_CONFIG.get("place_right", "Bengaluru"),
        "product_description": _TOOL_CONFIG.get("product_description", "Safety Air Bags, Seat Belts & Steering Wheels"),
        "commencement_date": _TOOL_CONFIG.get("commencement_date", "01-04-2023"),
        "filter_conditions": {"scheme_codes": [19, 43]},
        "parameters": {"air_dbk_percent": 0.02},
        "inputs": {
            "sb":           "shipping_bill.xlsx",
            "boe":          "boe_customs_statement.xlsx",
            "bom":          "BOMWORKING.xlsx",
            "export_sales": "export_sales.xlsx",
        },
    }

    _cfg_path = str(Path(_job_dir) / "config.yaml")
    with open(_cfg_path, "w") as _f:
        yaml.dump(_config, _f)

    # Monkey-patch sys.argv and working dir so load_config finds the file
    sys.argv = [sys.argv[0]]
    os.chdir(_job_dir)

    # Override output base so save_all_outputs writes to our output dir
    _BASE_DIR  = Path(_job_dir) / "inputs_organised"
    _OUTPUT_BASE = Path(_OUTPUT_DIR).parent  # jobs/jobId/

    # ── Structured logger (sends JSON to Next.js) ───────────────────────
    import builtins as _builtins
    _orig_print = _builtins.print
    def _log(level, msg):
        import json as _json
        _orig_print(_json.dumps({"level": level, "msg": str(msg)}), flush=True)
    def log_info(msg): _log("info", msg)
    def log_ok(msg):   _log("ok",   msg)
    def log_warn(msg): _log("warn", msg)
    def log_err(msg):  _log("err",  msg)

    # Patch print so all existing print() calls appear in the frontend log
    def _patched_print(*args, **kwargs):
        msg = " ".join(str(a) for a in args)
        level = "ok" if ("✅" in msg or "OK" in msg.upper()) else \
                "warn" if ("⚠️" in msg or "WARNING" in msg.upper()) else \
                "err"  if ("❌" in msg or "ERROR" in msg.upper() or "Failed" in msg) else \
                "info"
        _log(level, msg.replace("✅","").replace("⚠️","").replace("❌","").strip())
    _builtins.print = _patched_print

# ── End of Next.js patch ───────────────────────────────────────────────────

=== END PASTE ===
"""
