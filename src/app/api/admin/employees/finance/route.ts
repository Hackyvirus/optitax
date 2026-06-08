import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/apiAuth";

export async function PATCH(req: NextRequest) {
  const { role, response } = await requireAuth() as { userId:string; role:string; response:NextResponse|null };
  if (response) return response;
  if (role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { userId, isFinance } = await req.json();
  await connectDB();
  await User.findByIdAndUpdate(userId, { isFinance: Boolean(isFinance) });
  return NextResponse.json({ success: true });
}