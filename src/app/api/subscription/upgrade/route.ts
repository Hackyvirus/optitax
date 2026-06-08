import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const PLANS: Record<string, { name: string; monthlyAmount: number; yearlyAmount: number }> = {
  starter:      { name:"Starter",      monthlyAmount:99900,  yearlyAmount:999900  },
  professional: { name:"Professional", monthlyAmount:249900, yearlyAmount:2499900 },
  enterprise:   { name:"Enterprise",   monthlyAmount:499900, yearlyAmount:4999900 },
};

export async function POST(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
  }

  try {
    const { planId, cycle } = await req.json();
    const plan = PLANS[planId];
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const amount = cycle === "yearly" ? plan.yearlyAmount : plan.monthlyAmount;

    // Lazy import — never executes at build time
    const Razorpay = (await import("razorpay")).default;
    const rzp = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await rzp.orders.create({
      amount, currency:"INR",
      receipt: `rcpt_${Date.now()}`,
      notes:   { planId, cycle, clientId: userId },
    });

    await connectDB();
    const user = await User.findById(userId);

    return NextResponse.json({
      orderId: order.id, amount: order.amount, currency: order.currency,
      planName: plan.name, keyId: process.env.RAZORPAY_KEY_ID,
      prefill: {
        name:    user ? `${user.firstName} ${user.lastName}`.trim() : "",
        email:   user?.email || "",
        contact: user?.phone || "",
      },
    });
  } catch (err) {
    console.error("upgrade error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}