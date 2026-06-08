import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const PLANS = {
  starter:      { name:"Starter",      monthlyAmount:99900,   yearlyAmount:999900  },
  professional: { name:"Professional", monthlyAmount:249900,  yearlyAmount:2499900 },
  enterprise:   { name:"Enterprise",   monthlyAmount:499900,  yearlyAmount:4999900 },
};

export async function POST(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Payment gateway not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local" }, { status: 503 });
  }

  try {
    const { planId, cycle } = await req.json();

    await connectDB();
    const user = await User.findById(userId);
    if (!user || user.role !== "client") {
      return NextResponse.json({ error: "Only clients can subscribe" }, { status: 403 });
    }

    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const amount = cycle === "yearly" ? plan.yearlyAmount : plan.monthlyAmount;

    let Razorpay;
    try {
      Razorpay = (await import("razorpay")).default;
    } catch {
      return NextResponse.json({ error: "Razorpay not installed. Run: npm install razorpay" }, { status: 503 });
    }

    const rzp   = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await rzp.orders.create({ amount, currency:"INR", receipt:`rcpt_${Date.now()}` });

    return NextResponse.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      planName: plan.name,
      keyId:    process.env.RAZORPAY_KEY_ID,
      prefill:  { name:`${user.firstName} ${user.lastName}`, email:user.email, contact:user.phone||"" },
    });

  } catch (err: unknown) {
    console.error("create-order error:", err);
    return NextResponse.json({ error: `Payment order failed: ${err instanceof Error ? err.message : "Unknown error"}` }, { status: 500 });
  }
}