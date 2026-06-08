import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { existsSync, readdirSync, readFileSync } from "fs";
import { jobStore } from "@/lib/jobStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = jobStore.get(jobId);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const fileParam = req.nextUrl.searchParams.get("file");
  if (!fileParam) return NextResponse.json({ error: "file param required" }, { status: 400 });

  // Resolve the path
  const requestedPath = path.resolve(fileParam);

  // Security: must be inside this job's directory
  const jobDir = path.resolve(path.dirname(job.outputDir));
  const safe = requestedPath.toLowerCase().startsWith(jobDir.toLowerCase());
  if (!safe) {
    return NextResponse.json({
      error: "Access denied",
      debug: { requestedPath, jobDir }
    }, { status: 403 });
  }

  // Check existence
  if (!existsSync(requestedPath)) {
    const outputDir = path.resolve(job.outputDir);
    const inputDir  = path.join(jobDir, "inputs");
    let availOut: string[] = [], availIn: string[] = [];
    try { availOut = existsSync(outputDir) ? readdirSync(outputDir) : []; } catch { /* */ }
    try { availIn  = existsSync(inputDir)  ? readdirSync(inputDir)  : []; } catch { /* */ }
    return NextResponse.json({
      error: `File not found: ${path.basename(requestedPath)}`,
      availableOutputs: availOut,
      availableInputs: availIn,
    }, { status: 404 });
  }

  // Try to read the xlsx file
  try {
    // Read file into buffer first — avoids path issues on Windows
    const buffer = readFileSync(requestedPath);

    let XLSX: typeof import("xlsx");
    try {
      XLSX = await import("xlsx");
    } catch {
      return NextResponse.json({
        error: "xlsx package not installed. Run: npm install xlsx",
      }, { status: 500 });
    }

    const wb = XLSX.read(buffer, { type: "buffer" });

    const sheetParam = req.nextUrl.searchParams.get("sheet");
    const sheetName  = sheetParam && wb.SheetNames.includes(sheetParam)
      ? sheetParam
      : wb.SheetNames[0];

    const ws = wb.Sheets[sheetName];
    if (!ws) {
      return NextResponse.json({
        error: `Sheet "${sheetName}" not found`,
        sheetNames: wb.SheetNames,
      }, { status: 404 });
    }

    const raw: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: "",
      blankrows: false,
    });

    if (raw.length === 0) {
      return NextResponse.json({
        headers: [], rows: [], sheetName,
        sheetNames: wb.SheetNames, totalRows: 0,
      });
    }

    // Skip blank/title rows at top to find real header
    let headerIdx = 0;
    for (let i = 0; i < Math.min(raw.length, 15); i++) {
      if (raw[i].some(c => String(c ?? "").trim() !== "")) {
        headerIdx = i;
        break;
      }
    }

    const headers  = raw[headerIdx].map((h, i) =>
      String(h ?? "").trim() || `Col${i + 1}`
    );

    const dataRows = raw
      .slice(headerIdx + 1)
      .filter(r => r.some(c => String(c ?? "").trim() !== ""))
      .slice(0, 500);

    const rows = dataRows.map(r => {
      const obj: Record<string, string | number> = {};
      headers.forEach((h, i) => {
        const v = r[i] ?? "";
        obj[h] = typeof v === "number" ? v : String(v);
      });
      return obj;
    });

    return NextResponse.json({
      headers,
      rows,
      sheetName,
      sheetNames: wb.SheetNames,
      totalRows: dataRows.length,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to read file";
    return NextResponse.json({
      error: `Cannot read file: ${msg}`,
      file: path.basename(requestedPath),
      tip: "Make sure 'npm install xlsx' has been run in your project.",
    }, { status: 500 });
  }
}