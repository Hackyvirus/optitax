"""
manifest_writer.py
Drop this at: python/manifest_writer.py

Import it in your brand_rate/main.py like:
    from manifest_writer import ManifestWriter, log_ok, log_info, log_warn, log_err
"""

import json
import sys
from pathlib import Path
from datetime import datetime


def _emit(level: str, msg: str):
    """Write a JSON log line to stdout so Next.js can parse it in real-time."""
    print(json.dumps({"level": level, "msg": msg}), flush=True)


def log_info(msg: str): _emit("info", msg)
def log_ok(msg: str):   _emit("ok", msg)
def log_warn(msg: str): _emit("warn", msg)
def log_err(msg: str):  _emit("err", msg)


class ManifestWriter:
    def __init__(self, output_dir: str):
        self.output_dir = Path(output_dir)
        self.outputs = []
        self.validations = []

    def add_output(self, name: str, rows: int, file_path: str, type_: str = "main"):
        self.outputs.append({
            "name": name,
            "rows": int(rows),
            "filePath": str(file_path),
            "type": type_,
        })

    def add_validation(self, group: str, label: str, status: str, value: str):
        self.validations.append({
            "group": group,
            "label": label,
            "status": status,
            "value": str(value),
        })

    def save(self):
        manifest = {
            "outputs": self.outputs,
            "validations": self.validations,
            "completedAt": datetime.utcnow().isoformat(),
        }
        self.output_dir.mkdir(parents=True, exist_ok=True)
        path = self.output_dir / "manifest.json"
        with open(path, "w") as f:
            json.dump(manifest, f, indent=2)
        log_ok(f"Manifest saved: {path}")
