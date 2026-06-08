import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { jobStore } from "@/lib/jobStore";
import { runPythonTool } from "@/lib/pythonRunner";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const toolId = formData.get("toolId") as string;
    const scriptKey = formData.get("scriptKey") as string;
    const configRaw = formData.get("config") as string;
    const toolConfig: Record<string, string> = configRaw ? JSON.parse(configRaw) : {};

    if (!toolId || !scriptKey) {
      return NextResponse.json({ error: "toolId and scriptKey required" }, { status: 400 });
    }

    const jobId = randomUUID();
    const jobDir = path.join(process.cwd(), "data", "jobs", jobId);
    const inputDir = path.join(jobDir, "inputs");
    const outputDir = path.join(jobDir, "outputs");
    await mkdir(inputDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });

    const savedFiles: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (["toolId", "scriptKey", "config"].includes(key)) continue;
      if (value instanceof File && value.size > 0) {
        const safeName = value.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = path.join(inputDir, `${key}_${safeName}`);
        await writeFile(filePath, Buffer.from(await value.arrayBuffer()));
        savedFiles[key] = filePath;
      }
    }

    jobStore.create(jobId, { toolId, scriptKey, config: toolConfig, inputFiles: savedFiles, outputDir });
    jobStore.addLog(jobId, "info", `Job created — ${Object.keys(savedFiles).length} file(s) uploaded`);
    Object.entries(savedFiles).forEach(([k, fp]) =>
      jobStore.addLog(jobId, "ok", `Received: ${k} → ${path.basename(fp)}`)
    );

    runPythonTool({ jobId, scriptKey, config: toolConfig, inputFiles: savedFiles, outputDir }).catch((err: Error) => {
      jobStore.addLog(jobId, "err", `Runner error: ${err.message}`);
      jobStore.setStatus(jobId, "failed");
    });

    return NextResponse.json({ jobId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
