// Razorpay is initialized lazily — never at module load time
// This prevents build failures when env vars aren't set during `npm run build`

let _instance: import("razorpay") | null = null;

export function getRazorpayInstance() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables.");
  }
  if (!_instance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Razorpay = require("razorpay");
    _instance = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _instance;
}

export function getRazorpayCredentials() {
  return {
    keyId:     process.env.RAZORPAY_KEY_ID    || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  };
}

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "For small businesses",
    monthlyAmount: 99900,
    yearlyAmount:  999900,
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
    yearlyAmount:  2499900,
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
    yearlyAmount:  4999900,
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

export default { getRazorpayInstance, getRazorpayCredentials, PLANS, formatAmount };