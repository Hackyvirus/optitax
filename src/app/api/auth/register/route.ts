import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifyOTP } from "@/lib/otpStore";
import { notifications } from "@/lib/notifications";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`register:${ip}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many registration attempts. Try again in 1 hour." }, { status: 429 });
    }
    const body = await req.json();
    const { role, emailOtp } = body;

    // ── 1. Validate role ─────────────────────────────────────────────────
    if (!["client","employee","admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // ── 2. Required fields ───────────────────────────────────────────────
    const email    = String(body.email    || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email)             return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!password)          return NextResponse.json({ error: "Password is required" }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    // ── 3. Verify OTP ────────────────────────────────────────────────────
    if (!emailOtp) return NextResponse.json({ error: "Email OTP is required" }, { status: 400 });
    if (!await verifyOTP(email, String(emailOtp))) {
      return NextResponse.json({ error: "Invalid or expired OTP — please request a new one" }, { status: 400 });
    }

    // ── 4. Role-specific guards ──────────────────────────────────────────
    if (role === "employee" && !String(body.inviteCode || "").trim()) {
      return NextResponse.json({ error: "Employee invite code is required" }, { status: 400 });
    }
    // TODO: validate invite code against a codes collection in MongoDB
    if (role === "admin") {
      const key = String(body.adminSecret || "");
      if (key !== (process.env.ADMIN_SECRET || "optitax-admin-2025")) {
        return NextResponse.json({ error: "Invalid authorization key" }, { status: 403 });
      }
    }

    // ── 5. Connect DB & check duplicate ──────────────────────────────────
    await connectDB();
    const existing = await User.findOne({ email });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    // ── 6. Hash password ─────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── 7. Build user document ───────────────────────────────────────────
    const userData: Record<string, unknown> = {
      email,
      password:   hashedPassword,
      role,
      isVerified: true,
      firstName:  String(body.firstName || "").trim(),
      lastName:   String(body.lastName  || "").trim(),
      phone:      String(body.phone     || "").trim(),
    };

    if (role === "client") {
      Object.assign(userData, {
        businessName:        body.businessName       || "",
        businessType:        body.businessType       || "",
        industry:            body.industry           || "",
        pan:                 body.pan                || "",
        gstin:               body.gstin              || "",
        tan:                 body.tan                || "",
        iec:                 body.iec                || "",
        cin:                 body.cin                || "",
        udyamReg:            body.udyamReg           || "",
        registeredAddress:   body.registeredAddress  || "",
        operationalAddress:  body.operationalAddress || "",
        gstReturnFrequency:  body.gstReturnFrequency || "Monthly",
        gstFilingType:       body.gstFilingType      || "Regular",
        annualTurnover:      body.annualTurnover     || "",
        servicesNeeded:      body.servicesNeeded     || [],
        hasImportExport:     !!body.hasImportExport,
        hasCustomsDuty:      !!body.hasCustomsDuty,
        hasSEZ:              !!body.hasSEZ,
        hasMOOWR:            !!body.hasMOOWR,
        hasBrandRate:        !!body.hasBrandRate,
        contactPersons: body.cpName ? [{
          name:        body.cpName        || "",
          designation: body.cpDesignation || "",
          phone:       body.cpPhone       || "",
          email:       body.cpEmail       || "",
        }] : [],
        onboardingCompleted: false,
      });
    }

    if (role === "employee") {
      Object.assign(userData, {
        department:      body.department      || "",
        designation:     body.designation     || "",
        specializations: body.specializations || [],
        inviteCode:      body.inviteCode      || "",
      });
    }

    if (role === "admin") {
      Object.assign(userData, {
        adminLevel: body.adminLevel || "regular",
      });
    }

    // ── 8. Save to MongoDB ───────────────────────────────────────────────
    const user = await User.create(userData);

    // Send welcome email (non-blocking)
    notifications.welcome({ email: user.email, firstName: user.firstName || "there", role });

    const redirects: Record<string, string> = {
      client:   "/dashboard/client",
      employee: "/dashboard/employee",
      admin:    "/dashboard/admin",
    };

    return NextResponse.json({ success: true, role, redirect: redirects[role] }, { status: 201 });

  } catch (err: unknown) {
    console.error("register error:", err);
    // Mongoose duplicate key error
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}