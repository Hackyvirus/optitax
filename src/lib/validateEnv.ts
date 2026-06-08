const REQUIRED = [
  "MONGODB_URI",
  "JWT_SECRET",
];

const RECOMMENDED = [
  "ADMIN_SECRET",
  "NEXT_PUBLIC_URL",
  "EMAIL_PROVIDER",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "CLOUDINARY_API_KEY",
];

export function validateEnv() {
  // Skip validation during build
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  const missing = REQUIRED.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `\n\n❌ Missing required environment variables:\n${missing
        .map(k => `  - ${k}`)
        .join("\n")}\n`
    );
  }

  const missingRecommended = RECOMMENDED.filter(
    key => !process.env[key]
  );

  if (missingRecommended.length > 0) {
    console.warn(
      `\n⚠ Missing recommended environment variables:\n${missingRecommended
        .map(k => `  - ${k}`)
        .join("\n")}\n`
    );
  }
}