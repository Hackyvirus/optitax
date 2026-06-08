import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";

// Base32 encode for TOTP secret
function base32Encode(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += alphabet[(value << (5 - bits)) & 31];
  return result;
}

export async function POST() {
  const { userId, response } = await requireAuth();
  if (response) return response;

  await connectDB();
  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Generate secret
  const secret    = base32Encode(crypto.randomBytes(20));
  const issuer    = "OptiTax";
  const otpauth  = `otpauth://totp/${issuer}:${user.email}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

  // Store secret temporarily (not enabled until verified)
  await User.findByIdAndUpdate(userId, { twoFactorSecret: secret, twoFactorEnabled: false });

  return NextResponse.json({ secret, otpauth, email: user.email });
}