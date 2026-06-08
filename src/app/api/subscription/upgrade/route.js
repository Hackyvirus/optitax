import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/apiAuth";
import User from "@/models/User";
import { getRazorpayCredentials, getRazorpayInstance } from "@/lib/razorpay";

export async function POST(req) {
  try {
    const { userId, response } = await requireAuth();
    if (response) {
      return response;
    }

    const body = await req.json().catch(() => ({}));
    const razorpayOrderId = String(body?.razorpay_order_id || "").trim();
    const razorpayPaymentId = String(body?.razorpay_payment_id || "").trim();
    const razorpaySignature = String(body?.razorpay_signature || "").trim();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Payment verification details are required." },
        { status: 400 },
      );
    }

    const { keySecret } = getRazorpayCredentials();
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json(
        { error: "Payment signature verification failed." },
        { status: 400 },
      );
    }

    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    if (!payment || String(payment.order_id || "") !== razorpayOrderId) {
      return NextResponse.json(
        { error: "Payment order mismatch." },
        { status: 400 },
      );
    }

    if (!["authorized", "captured"].includes(String(payment.status || ""))) {
      return NextResponse.json(
        { error: "Payment not completed yet." },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.subscription = "pro";
    user.subscriptionPaymentId = razorpayPaymentId;
    user.subscriptionOrderId = razorpayOrderId;
    user.subscriptionPaidAt = new Date();
    await user.save();

    return NextResponse.json({ success: true, plan: user.subscription });
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    const errorMessage =
      error instanceof Error && error.message.includes("Razorpay keys are not configured")
        ? error.message
        : "Couldn't upgrade subscription.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
