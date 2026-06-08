import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * @typedef {Object} AuthResult
 * @property {string|null} userId
 * @property {string|null} role
 * @property {NextResponse|null} response
 */

export async function requireAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return { userId: null, role: null, response: NextResponse.json({ error: "Unauthorized — please log in" }, { status: 401 }) };
    }
    if (!process.env.JWT_SECRET) {
      return { userId: null, role: null, response: NextResponse.json({ error: "Server configuration error" }, { status: 500 }) };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return { userId: null, role: null, response: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
    }

    return { userId: decoded.id, role: decoded.role, response: null };
  } catch (err) {
    const isExpired = err instanceof Error && err.name === "TokenExpiredError";
    return {
      userId: null, role: null,
      response: NextResponse.json(
        { error: isExpired ? "Session expired — please log in again" : "Invalid token" },
        { status: 401 }
      ),
    };
  }
}
