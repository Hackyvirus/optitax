import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import { requireAuth } from "@/lib/apiAuth";

// GET /api/messages?roomId=client_<userId>
export async function GET(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;

  const roomId = req.nextUrl.searchParams.get("roomId") || `client_${userId}`;
  await connectDB();

  const messages = await Message.find({ roomId })
    .populate("senderId", "firstName lastName role photo")
    .sort({ createdAt: 1 })
    .limit(200)
    .lean();

  return NextResponse.json({ messages });
}

// POST /api/messages
export async function POST(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;

  await connectDB();
  const { text, roomId, receiverId } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });

  const message = await Message.create({
    senderId:   userId,
    receiverId: receiverId || undefined,
    roomId:     roomId || `client_${userId}`,
    text:       text.trim(),
  });

  const populated = await message.populate("senderId", "firstName lastName role photo");
  return NextResponse.json({ success: true, message: populated }, { status: 201 });
}