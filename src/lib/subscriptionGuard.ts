import connectDB from "./mongodb";

export async function checkSubscriptionExpiry(userId: string): Promise<void> {
  try {
    await connectDB();
    const Subscription = (await import("@/models/Subscription")).default;
    const sub = await Subscription.findOne({ clientId: userId, status: "active" });
    if (!sub) return;

    if (sub.currentPeriodEnd && new Date() > new Date(sub.currentPeriodEnd)) {
      await Subscription.findByIdAndUpdate(sub._id, { status: "expired" });
      const User = (await import("@/models/User")).default;
      await User.findByIdAndUpdate(userId, { subscription: "free" });
      console.log(`[Subscription] Expired for user ${userId}`);
    }
  } catch (err) {
    console.error("[subscriptionGuard]", err);
  }
}