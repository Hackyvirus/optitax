import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { existsSync, readdirSync } from "fs";
import { jobStore } from "@/lib/jobStore";

// Returns list of input files for a job
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = jobStore.get(jobId);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const jobDir = path.resolve(path.dirname(job.outputDir));
  const inputDir = path.join(jobDir, "inputs");

  if (!existsSync(inputDir)) {
    return NextResponse.json({ inputs: [] });
  }

  try {
    const files = readdirSync(inputDir)
      .filter(f => [".xlsx", ".xls", ".csv"].includes(path.extname(f).toLowerCase()))
      .map(f => ({
        name: f,
        // key is the prefix before first underscore (e.g. "sb_shipping_bill.xlsx" → key="sb")
        key: f.split("_")[0],
        filePath: path.join(inputDir, f),
        label: f.split("_").slice(1).join("_").replace(/\.[^.]+$/, "") || f,
      }));

    return NextResponse.json({ inputs: files, inputDir });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to list inputs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
