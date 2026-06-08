import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, phone, otp, type } = await req.json();

    if (!otp || !type) {
      return NextResponse.json({ error: "OTP and type are required" }, { status: 400 });
    }

    await connectDB();

    if (type === "email") {
      const user = await User.findOne({ email });
      if (!user) return NextResponse.json({ error: "Email not found" }, { status: 404 });
      if (user.emailOtp !== otp) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
      if (new Date() > user.emailOtpExp) return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 400 });

      await User.findOneAndUpdate({ email }, { isVerified: true, emailOtp: null, emailOtpExp: null });
      return NextResponse.json({ success: true, message: "Email verified" });

    } else if (type === "mobile") {
      const user = await User.findOne({ phone });
      if (!user) return NextResponse.json({ error: "Phone not found" }, { status: 404 });
      if (user.mobileOtp !== otp) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
      if (new Date() > user.mobileOtpExp) return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 400 });

      await User.findOneAndUpdate({ phone }, { mobileVerified: true, mobileOtp: null, mobileOtpExp: null });
      return NextResponse.json({ success: true, message: "Mobile verified" });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
