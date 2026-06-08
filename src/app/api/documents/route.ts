import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Document from "@/models/Document";
import { requireAuth } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;

  const category = req.nextUrl.searchParams.get("category");
  await connectDB();
  const filter: Record<string, unknown> = { clientId: userId };
  if (category && category !== "All") filter.category = category;

  const documents = await Document.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ documents });
}

export async function DELETE(req: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;

  await connectDB();
  const { id } = await req.json();
  await Document.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}