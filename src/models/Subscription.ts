import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
  clientId:             { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  plan:                 { type: String, enum: ["starter","professional","enterprise"], default: "starter" },
  status:               { type: String, enum: ["active","inactive","cancelled","expired"], default: "inactive" },
  razorpayOrderId:      { type: String },
  razorpayPaymentId:    { type: String },
  amount:               { type: Number },
  currency:             { type: String, default: "INR" },
  billingCycle:         { type: String, enum: ["monthly","yearly"], default: "monthly" },
  currentPeriodStart:   { type: Date },
  currentPeriodEnd:     { type: Date },
  cancelledAt:          { type: Date },
}, { timestamps: true });

export default mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);