import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

function verifyTOTP(secret: string, token: string): boolean {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0;
  const bytes: number[] = [];
  for (const char of secret.toUpperCase()) {
    const idx = base32Chars.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  const crypto = require("crypto");
  const now    = Math.floor(Date.now() / 30000);
  for (const delta of [-1, 0, 1]) {
    const counter = Buffer.alloc(8);
    const step    = now + delta;
    for (let i = 7; i >= 0; i--) { counter[i] = step & 0xff; }
    const hmac  = crypto.createHmac("sha1", Buffer.from(bytes)).update(counter).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const otp   = (((hmac[offset] & 0x7f) << 24) | ((hmac[offset+1] & 0xff) << 16) | ((hmac[offset+2] & 0xff) << 8) | (hmac[offset+3] & 0xff)) % 1000000;
    if (String(otp).padStart(6,"0") === String(token)) return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;

  const { token, action } = await req.json();
  await connectDB();
  const user = await User.findById(userId);
  if (!user || !user.twoFactorSecret) {
    return NextResponse.json({ error: "2FA not set up" }, { status: 400 });
  }

  const valid = verifyTOTP(user.twoFactorSecret, String(token));
  if (!valid) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  if (action === "enable") {
    await User.findByIdAndUpdate(userId, { twoFactorEnabled: true });
    return NextResponse.json({ success: true, message: "2FA enabled successfully" });
  }
  if (action === "disable") {
    await User.findByIdAndUpdate(userId, { twoFactorEnabled: false, twoFactorSecret: null });
    return NextResponse.json({ success: true, message: "2FA disabled successfully" });
  }

  return NextResponse.json({ success: true, valid: true });
}