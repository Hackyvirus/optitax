import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear both cookies set by login
  response.cookies.set("token", "", { maxAge: 0, path: "/" });
  response.cookies.set("role",  "", { maxAge: 0, path: "/" });

  return response;
}