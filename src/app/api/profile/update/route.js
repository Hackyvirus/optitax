import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import connectDB from "@/lib/mongodb";
import { applyUserUpdates, PROFILE_EDITABLE_FIELDS } from "@/lib/userUpdates";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { userId, response } = await requireAuth();
    if (response) {
      return response;
    }

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const body = { ...payload };

    if (typeof body.emailotp === "string" && body.emailOtp === undefined) {
      body.emailOtp = body.emailotp;
    }

    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    applyUserUpdates(user, body, PROFILE_EDITABLE_FIELDS);

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
