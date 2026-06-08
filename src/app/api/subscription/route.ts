import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import connectDB from "@/lib/mongodb";
import { checkSubscriptionExpiry } from "@/lib/subscriptionGuard";

export async function GET() {
  const { userId, response } = await requireAuth();
  if (response) return response;

  await connectDB();
  await checkSubscriptionExpiry(userId!); // auto-expire if needed

  const Subscription = (await import("@/models/Subscription")).default;
  const sub = await Subscription.findOne({ clientId: userId }).lean();
  return NextResponse.json({ subscription: sub || null });
}