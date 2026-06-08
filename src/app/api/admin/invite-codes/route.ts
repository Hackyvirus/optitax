import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import InviteCode from "@/models/InviteCode";
import { requireAuth } from "@/lib/apiAuth";

function randomCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function GET() {
  const { userId, response } = await requireAuth();
  if (response) return response;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const codes = await InviteCode.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ codes });
}

export async function POST(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { role, label, maxUses, expiresAt, customCode } = await req.json();
  if (!["employee","admin"].includes(role)) {
    return NextResponse.json({ error: "Role must be employee or admin" }, { status: 400 });
  }
  const code     = customCode ? String(customCode).toUpperCase().trim() : randomCode();
  const existing = await InviteCode.findOne({ code });
  if (existing) return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  const invite = await InviteCode.create({ code, role, label:label||"", maxUses:maxUses??1, createdBy:userId, expiresAt:expiresAt||null });
  return NextResponse.json({ success: true, invite }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id, isActive } = await req.json();
  const code = await InviteCode.findByIdAndUpdate(id, { isActive }, { new: true });
  return NextResponse.json({ success: true, code });
}

export async function DELETE(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const { id } = await req.json();
  await InviteCode.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}