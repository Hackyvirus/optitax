import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string; role: string; email: string };
    return NextResponse.json({ id: decoded.id, role: decoded.role, email: decoded.email });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}