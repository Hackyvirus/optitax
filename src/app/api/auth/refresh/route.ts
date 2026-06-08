import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST() {
  try {
    const refreshToken = (await cookies()).get("refreshToken")?.value;
    if (!refreshToken || !process.env.JWT_SECRET) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET) as { id: string; type: string };
    if (decoded.type !== "refresh") return NextResponse.json({ error: "Invalid token type" }, { status: 401 });
    const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const res = NextResponse.json({ success: true });
    res.cookies.set("token", newToken, { httpOnly:true, secure:process.env.NODE_ENV==="production", sameSite:"lax", maxAge:60*60*24, path:"/" });
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }
}
