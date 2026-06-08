import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { rateLimit } from "@/lib/rateLimit";
import { auditLog } from "@/lib/audit";
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many login attempts. Please wait 15 minutes." }, { status: 429 });
    }
    const { email, password, expectedRole } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    // Role guard
    if (expectedRole && user.role !== expectedRole) {
      const portals: Record<string, string> = {
        client:   "/client/login",
        employee: "/employee/login",
        admin:    "/admin/login",
      };
      return NextResponse.json({
        error: `This account is registered as "${user.role}". Please use the ${user.role} portal.`,
        correctPortal: portals[user.role],
      }, { status: 403 });
    }

    if (!user.password) {
      return NextResponse.json({ error: "Account has no password set. Please contact support." }, { status: 400 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // Sign JWT — same format requireAuth expects: { id: userId }
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const redirects: Record<string, string> = {
      client:   "/dashboard/client",
      employee: "/dashboard/employee",
      admin:    "/dashboard/admin",
    };

    const response = NextResponse.json({
      success:  true,
      role:     user.role,
      redirect: redirects[user.role] || "/dashboard",
    });

    // Set "token" cookie — exactly what requireAuth reads
    response.cookies.set("token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });

    // Set "role" cookie — what proxy.js reads for routing
        auditLog({ userId:user._id.toString(), userEmail:user.email, userRole:user.role, action:"auth.login", entity:"user", entityId:user._id.toString(), ip: ip });
    response.cookies.set("role", user.role, {
      httpOnly: false, // proxy needs to read this
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });

    return response;

  } catch (err) {
    console.error("login error:", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}