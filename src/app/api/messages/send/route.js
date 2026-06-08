import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/apiAuth";
import Message from "@/models/Message";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { userId, response } = await requireAuth();
    if (response) {
      return response;
    }

    const body = await req.json();
    const text = String(body?.text || "").trim();

    if (!text) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }

    await connectDB();

    const currentUser = await User.findById(userId).select("role").lean();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestedUserId = String(body?.userId || "").trim();
    const isStaffRole =
      currentUser.role === "admin" || currentUser.role === "employee";
    const targetUserId =
      isStaffRole && requestedUserId ? requestedUserId : String(userId);

    await Message.create({
      userId: targetUserId,
      sender: isStaffRole ? "admin" : "user",
      text,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Couldn't send message." },
      { status: 500 },
    );
  }
}
