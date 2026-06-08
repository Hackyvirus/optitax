import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("⚠ Razorpay keys not set in environment variables");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// Default export
export default razorpay;

// Helper: return Razorpay instance
export function getRazorpayInstance() {
  return razorpay;
}

// Helper: return credentials
export function getRazorpayCredentials() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  };
}

// Subscription plans
export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "For small businesses",
    monthlyAmount: 99900,
    yearlyAmount: 999900,
    features: [
      "Up to 3 active projects",
      "GST Filing support",
      "Document storage 1GB",
      "Email support",
      "Chat with OptiTax team",
    ],
  },

  professional: {
    id: "professional",
    name: "Professional",
    description: "For growing businesses",
    monthlyAmount: 249900,
    yearlyAmount: 2499900,
    features: [
      "Up to 10 active projects",
      "GST + ITR Filing",
      "Brand Rate / DBK",
      "MOOWR & SEZ support",
      "Document storage 10GB",
      "Priority support",
      "Dedicated manager",
    ],
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    monthlyAmount: 499900,
    yearlyAmount: 4999900,
    features: [
      "Unlimited projects",
      "All compliance services",
      "Unlimited storage",
      "24/7 priority support",
      "Dedicated team",
      "Custom reports",
      "On-site visits",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function formatAmount(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}