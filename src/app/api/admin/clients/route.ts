import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search");
  const page   = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") || "50"));
  const skip   = (page - 1) * limit;

  await connectDB();

  const filter: Record<string, unknown> = { role: "client" };
  if (search) filter.$or = [
    { firstName:    { $regex: search, $options: "i" } },
    { lastName:     { $regex: search, $options: "i" } },
    { email:        { $regex: search, $options: "i" } },
    { businessName: { $regex: search, $options: "i" } },
    { gstin:        { $regex: search, $options: "i" } },
  ];

  const [clients, total] = await Promise.all([
    User.find(filter).select("firstName lastName email phone businessName gstin pan servicesNeeded createdAt").sort({ createdAt:-1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return NextResponse.json({ clients, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
}