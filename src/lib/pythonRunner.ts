import { spawn } from "child_process";
import path from "path";
import { jobStore } from "@/lib/jobStore";

interface RunOptions {
  jobId: string;
  scriptKey: string;
  config: Record<string, string>;
  inputFiles: Record<string, string>;
  outputDir: string;
}

const SCRIPTS: Record<string, string> = {
  "brand-rate-v1": path.join(process.cwd(), "python", "brand_rate", "runner_v1.py"),
  "brand-rate-v2": path.join(process.cwd(), "python", "brand_rate", "runner_v2.py"),
};

// Use full path to Python 3.11 to avoid msys64 conflict on Windows
const PYTHON = process.platform === "win32"
  ? "C:\\Users\\susha\\AppData\\Local\\Programs\\Python\\Python311\\python.exe"
  : "python3";

export async function runPythonTool(opts: RunOptions): Promise<void> {
  const { jobId, scriptKey, config, inputFiles, outputDir } = opts;
  jobStore.setStatus(jobId, "running");
  jobStore.addLog(jobId, "info", `Starting script: ${scriptKey}`);

  const scriptPath = SCRIPTS[scriptKey];
  if (!scriptPath) {
    jobStore.addLog(jobId, "err", `No script registered for: ${scriptKey}`);
    jobStore.setStatus(jobId, "failed");
    return;
  }

  const env = {
    ...process.env,
    JOB_ID: jobId,
    OUTPUT_DIR: outputDir,
    TOOL_CONFIG: JSON.stringify(config),
    INPUT_FILES: JSON.stringify(inputFiles),
  };

  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON, [scriptPath], { env });

    proc.stdout.on("data", (chunk: Buffer) => {
      chunk.toString().split("\n").filter(Boolean).forEach((line) => {
        try {
          const p = JSON.parse(line);
          jobStore.addLog(jobId, p.level || "info", p.msg || line);
        } catch {
          const clean = line.replace(/[✅⚠️❌🚀🎉📊📋🔧💾📅🔢📝🧮]/g, "").trim();
          if (!clean) return;
          const level = line.includes("✅") ? "ok" : line.includes("⚠️") ? "warn" : line.includes("❌") ? "err" : "info";
          jobStore.addLog(jobId, level, clean);
        }
      });
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      chunk.toString().split("\n").filter(Boolean).forEach((line) => {
        if (line.trim()) jobStore.addLog(jobId, "warn", `[stderr] ${line.trim()}`);
      });
    });

    proc.on("close", async (code) => {
      if (code === 0) {
        try {
          const { readFile } = await import("fs/promises");
          const raw = await readFile(path.join(outputDir, "manifest.json"), "utf-8");
          const manifest = JSON.parse(raw);
          if (manifest.outputs) jobStore.setOutputs(jobId, manifest.outputs);
          if (manifest.validations) jobStore.setValidations(jobId, manifest.validations);
        } catch {
          jobStore.addLog(jobId, "warn", "No manifest.json found");
        }
        jobStore.addLog(jobId, "ok", "Job completed successfully");
        jobStore.setStatus(jobId, "done");
        resolve();
      } else {
        jobStore.addLog(jobId, "err", `Process exited with code ${code}`);
        jobStore.setStatus(jobId, "failed");
        reject(new Error(`Exit ${code}`));
      }
    });

    proc.on("error", (err) => {
      jobStore.addLog(jobId, "err", `Failed to start Python: ${err.message}`);
      jobStore.setStatus(jobId, "failed");
      reject(err);
    });
  });
}
