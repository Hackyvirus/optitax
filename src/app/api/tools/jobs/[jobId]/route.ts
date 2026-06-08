import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "@/lib/jobStore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = jobStore.get(jobId);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({
    jobId,
    status: job.status,
    logs: job.logs,
    outputs: job.outputs,
    validations: job.validations,
  });
}
