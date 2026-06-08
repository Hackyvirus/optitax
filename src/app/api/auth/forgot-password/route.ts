import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { sendMail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rateLimit";
import { forgotPasswordEmail } from "@/lib/emailTemplates";

const g = globalThis as typeof globalThis & {
  __resetTokens?: Map<string, { userId: string; exp: number }>;
};
if (!g.__resetTokens) g.__resetTokens = new Map();

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`forgot:${ip}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Try again in 15 minutes." }, { status: 429 });
  }

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Always return success — prevents user enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: "If this email exists, a reset link has been sent." });
    }

    const token  = crypto.randomBytes(32).toString("hex");
    const exp    = Date.now() + 30 * 60 * 1000; // 30 minutes
    g.__resetTokens!.set(token, { userId: user._id.toString(), exp });

    const baseUrl  = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/${user.role}/reset-password?token=${token}`;

    await sendMail({
      to:      user.email,
      subject: "Reset your OptiTax password",
      html:    forgotPasswordEmail({ name: user.firstName || "there", role: user.role, resetUrl }),
    });

    return NextResponse.json({ success: true, message: "If this email exists, a reset link has been sent." });
  } catch (err) {
    console.error("forgot-password error:", err);
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}