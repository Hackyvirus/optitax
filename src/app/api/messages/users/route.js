import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/apiAuth";
import Message from "@/models/Message";
import User from "@/models/User";

function getDisplayName(user) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.name ||
    user.email
  );
}

export async function GET() {
  try {
    const { userId, response } = await requireAuth();
    if (response) {
      return response;
    }

    await connectDB();

    const currentUser = await User.findById(userId)
      .select("role firstName lastName name email")
      .lean();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isStaffRole =
      currentUser.role === "admin" || currentUser.role === "employee";

    if (!isStaffRole) {
      return NextResponse.json([
        {
          id: String(currentUser._id),
          name: getDisplayName(currentUser),
          email: currentUser.email,
          role: currentUser.role || "user",
        },
      ]);
    }

    const users = await User.find({})
      .select("firstName lastName name email role")
      .sort({ createdAt: -1 })
      .lean();

    const ids = users.map((user) => user._id);

    const lastMessages = await Message.aggregate([
      { $match: { userId: { $in: ids } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$userId",
          text: { $first: "$text" },
          createdAt: { $first: "$createdAt" },
        },
      },
    ]);

    const lastByUser = new Map(
      lastMessages.map((entry) => [String(entry._id), entry]),
    );

    const result = users.map((user) => {
      const last = lastByUser.get(String(user._id));
      return {
        id: String(user._id),
        name: getDisplayName(user),
        email: user.email,
        role: user.role || "user",
        lastMessage: last?.text || "",
        lastMessageAt: last?.createdAt || null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json(
      { error: "Couldn't load users." },
      { status: 500 },
    );
  }
}
