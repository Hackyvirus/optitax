import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const { userId, role, response } = await requireAuth() as { userId:string; role:string; response:NextResponse|null };
  if (response) return response;
  if (role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page  = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 50;
  const skip  = (page - 1) * limit;

  await connectDB();
  const AuditLog = (await import("@/models/AuditLog")).default;
  const [logs, total] = await Promise.all([
    AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(),
  ]);

  return NextResponse.json({ logs, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
}