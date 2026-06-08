import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/apiAuth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { notifications } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, cycle, amount } = await req.json();

    const body     = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET||"").update(body).digest("hex");
    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed — invalid signature" }, { status: 400 });
    }

    await connectDB();
    const now = new Date();
    const end = new Date(now);
    if (cycle === "yearly") end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);

    const Subscription = (await import("@/models/Subscription")).default;
    await Subscription.findOneAndUpdate(
      { clientId: userId },
      { clientId:userId, plan:planId, status:"active", razorpayOrderId:razorpay_order_id, razorpayPaymentId:razorpay_payment_id, amount, billingCycle:cycle, currentPeriodStart:now, currentPeriodEnd:end },
      { upsert:true, new:true }
    );
    await User.findByIdAndUpdate(userId, { subscription: planId });

    const user       = await User.findById(userId);
    const validUntil = end.toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });

    if (user) {
      notifications.paymentSuccess({
        email:     user.email,
        name:      `${user.firstName} ${user.lastName}`.trim(),
        plan:      planId, amount, cycle,
        paymentId: razorpay_payment_id,
        orderId:   razorpay_order_id,
        validUntil,
      });
    }

    return NextResponse.json({ success:true, message:"Subscription activated! Invoice sent to your email.", plan:planId, validUntil });
  } catch (err) {
    console.error("verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}