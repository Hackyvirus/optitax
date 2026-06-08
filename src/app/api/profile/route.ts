import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/apiAuth";

export async function PATCH(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;

  await connectDB();
  const { name, phone, businessName, gstin, pan, address } = await req.json();
  const parts     = (name || "").trim().split(" ");
  const firstName = parts[0] || "";
  const lastName  = parts.slice(1).join(" ") || "";

  await User.findByIdAndUpdate(userId, {
    firstName,
    lastName,
    phone:             phone        || "",
    businessName:      businessName || "",
    gstin:             (gstin || "").toUpperCase(),
    pan:               (pan   || "").toUpperCase(),
    registeredAddress: address || "",
  });

  return NextResponse.json({ success: true });
}