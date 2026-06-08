import { NextRequest, NextResponse } from "next/server";
import { setOTP } from "@/lib/otpStore";
import { sendMail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rateLimit";
import { otpEmail } from "@/lib/emailTemplates";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, purpose } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const normalizedEmail = email.trim().toLowerCase();
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    if (!rateLimit(`otp:${normalizedEmail}:${ip}`, 3, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many OTP requests. Please wait 15 minutes." }, { status: 429 });
    }

    const otp    = generateOTP();
    await setOTP(normalizedEmail, otp); // async now

    const portal = purpose === "admin" ? "Admin Portal" : purpose === "employee" ? "Employee Portal" : "Client Portal";

    let emailSent = false;
    try {
      await sendMail({ to: normalizedEmail, subject: `Your OptiTax OTP — ${otp}`, html: otpEmail(otp, portal) });
      emailSent = true;
    } catch (mailErr) {
      console.error("📧 Mail send failed:", mailErr);
    }

    if (process.env.NODE_ENV !== "production") {
    }

    return NextResponse.json({
      success: true,
      message: emailSent ? `OTP sent to ${email}` : "OTP generated (check server console)",
      ...(process.env.NODE_ENV !== "production" ? { _dev_otp: otp } : {}),
    });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Could not send OTP. Please try again." }, { status: 500 });
  }
}