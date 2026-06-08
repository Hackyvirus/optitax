import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Quick DB ping
    const connectDB = (await import("@/lib/mongodb")).default;
    await connectDB();
    return NextResponse.json({ status:"ok", timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status:"error" }, { status: 503 });
  }
}