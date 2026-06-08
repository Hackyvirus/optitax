import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const otp = String(body?.otp || "").trim();
    const firstName = String(body?.firstName || "").trim();
    const lastName = String(body?.lastName || "").trim();
    const phone = String(body?.phone || "").trim();
    const address = String(body?.address || "").trim();
    const aadhaar = String(body?.aadhaar || "").trim();
    const companyName = String(body?.companyName || "").trim();
    const companyAddress = String(body?.companyAddress || "").trim();
    const requestedRole = String(body?.role || "").trim().toLowerCase();
    const photo = typeof body?.photo === "string" ? body.photo : "";
    if (
      !email ||
      !firstName ||
      !lastName ||
      !phone ||
      !address ||
      !aadhaar
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }
    if (!/^\d+$/.test(phone)) {
      return NextResponse.json(
        { error: "Phone number must contain digits only." },
        { status: 400 },
      );
    }
    if (!/^\d+$/.test(aadhaar)) {
      return NextResponse.json(
        { error: "Aadhaar number must contain digits only." },
        { status: 400 },
      );
    }
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: "Server misconfigured." },
        { status: 500 },
      );
    }
    await connectDB();
    const user = await User.findOne({ email });
    const isOtpValid = Boolean(otp) && user?.otp === otp;
    if (!user || (!user.isVerified && !isOtpValid)) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }
    const existingRole = String(user.role || "").trim().toLowerCase();
    const isRequestedStaff =
      requestedRole === "admin" || requestedRole === "employee";
    const isExistingStaff = existingRole === "admin" || existingRole === "employee";
    const role = isRequestedStaff
      ? requestedRole
      : isExistingStaff
        ? existingRole
        : "user";
    user.isVerified = true;
    user.otp = null;
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    user.address = address;
    user.aadhaar = aadhaar;
    user.companyName = companyName;
    user.companyAddress = companyAddress;
    user.role = role;
    user.photo = photo;
    user.name = firstName;
    await user.save();
    const token = jwt.sign(
      { id: user._id.toString(), role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );
    const redirectTo =
      role === "admin"
        ? "/dashboard/admin/profile"
        : role === "employee"
          ? "/dashboard/employee/profile"
          : "/dashboard";
    const response = NextResponse.redirect(new URL(redirectTo, req.url));
    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set("role", role, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("Profile setup error:", error);
    return NextResponse.json(
      { error: "Couldn't finish profile setup." },
      { status: 500 },
    );
  }
}
