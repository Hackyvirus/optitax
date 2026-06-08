import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
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

  const outputDir = path.resolve(job.outputDir);
  const requestedPath = path.resolve(fileParam);
  if (!requestedPath.startsWith(outputDir)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await readFile(requestedPath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${path.basename(requestedPath)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
