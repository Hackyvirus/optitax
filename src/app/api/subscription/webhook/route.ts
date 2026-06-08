import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { notifications } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const body      = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const secret    = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    // Verify webhook signature
    if (secret) {
      const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
      if (expected !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(body);
    console.log("[Razorpay Webhook]", event.event);

    if (event.event === "payment.captured") {
      const payment  = event.payload.payment.entity;
      const notes    = payment.notes || {};
      const clientId = notes.clientId;
      const planId   = notes.planId   || "starter";
      const cycle    = notes.cycle    || "monthly";

      if (!clientId) return NextResponse.json({ ok: true });

      await connectDB();
      const now = new Date();
      const end = new Date(now);
      if (cycle === "yearly") end.setFullYear(end.getFullYear() + 1);
      else end.setMonth(end.getMonth() + 1);

      const Subscription = (await import("@/models/Subscription")).default;
      const existing = await Subscription.findOne({ clientId });

      // Only activate if not already active (avoid double-activation)
      if (!existing || existing.status !== "active") {
        await Subscription.findOneAndUpdate(
          { clientId },
          { clientId, plan:planId, status:"active", razorpayPaymentId:payment.id, amount:payment.amount, billingCycle:cycle, currentPeriodStart:now, currentPeriodEnd:end },
          { upsert:true, new:true }
        );
        await User.findByIdAndUpdate(clientId, { subscription: planId });

        const user       = await User.findById(clientId);
        const validUntil = end.toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });

        if (user) {
          notifications.paymentSuccess({
            email: user.email, name:`${user.firstName} ${user.lastName}`.trim(),
            plan:planId, amount:payment.amount, cycle,
            paymentId:payment.id, orderId:payment.order_id||"", validUntil,
          });
        }

        console.log(`[Webhook] Subscription activated for client ${clientId}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook error]", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}