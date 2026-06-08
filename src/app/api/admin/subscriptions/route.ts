import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import connectDB from "@/lib/mongodb";

export async function GET() {
  const { userId, response } = await requireAuth();
  if (response) return response;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const Subscription = (await import("@/models/Subscription")).default;
  const subscriptions = await Subscription.find()
    .populate("clientId", "firstName lastName businessName email")
    .sort({ createdAt: -1 }).lean();
  return NextResponse.json({ subscriptions });
}
