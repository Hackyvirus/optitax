import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/apiAuth";
import Message from "@/models/Message";
import User from "@/models/User";

export async function GET(req) {
  try {
    const { userId, response } = await requireAuth();
    if (response) {
      return response;
    }

    await connectDB();

    const currentUser = await User.findById(userId).select("role").lean();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestUrl = new URL(req.url);
    const requestedUserId = requestUrl.searchParams.get("userId");
    const isStaffRole =
      currentUser.role === "admin" || currentUser.role === "employee";
    const targetUserId =
      isStaffRole && requestedUserId ? requestedUserId : String(userId);

    const messages = await Message.find({ userId: targetUserId })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(messages);
  } catch (error) {
    console.error("List messages error:", error);
    return NextResponse.json(
      { error: "Couldn't load messages." },
      { status: 500 },
    );
  }
}
