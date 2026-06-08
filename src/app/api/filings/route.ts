import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Filing from "@/models/Filing";
import { requireAuth } from "@/lib/apiAuth";

export async function GET() {
  const { userId, response } = await requireAuth();
  if (response) return response;

  await connectDB();
  const filings = await Filing.find({ clientId: userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ filings });
}

export async function POST(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;

  await connectDB();
  const body = await req.json();
  const filing = await Filing.create({ ...body, clientId: userId });
  return NextResponse.json({ success: true, filing }, { status: 201 });
}