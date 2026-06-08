import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const g = globalThis as typeof globalThis & {
  __resetTokens?: Map<string, { userId: string; exp: number }>;
};

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const entry = g.__resetTokens?.get(token);
    if (!entry || Date.now() > entry.exp) {
      return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 });
    }

    await connectDB();
    const hashed = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(entry.userId, { password: hashed });
    g.__resetTokens?.delete(token); // one-time use

    return NextResponse.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("reset-password error:", err);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}