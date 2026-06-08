import mongoose from "mongoose";

// ₹5000 threshold in paise
export const ADMIN_APPROVAL_THRESHOLD = 500000;

const ReimbursementSchema = new mongoose.Schema({
  submittedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  submitterRole:  { type: String, enum: ["admin","employee","client"], required: true },
  submitterDept:  { type: String, default: "" },

  amount:      { type: Number, required: true }, // stored in paise
  category:    { type: String, required: true },
  description: { type: String, required: true, trim: true },
  date:        { type: Date, required: true },
  projectId:   { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
  receiptUrl:  { type: String, default: "" },
  receiptName: { type: String, default: "" },

  // Stage 1 — Finance Head
  financeStatus:   { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  financeReviewBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  financeReviewAt: { type: Date, default: null },
  financeNote:     { type: String, default: "" },

  // Stage 2 — Admin (only required if amount > threshold)
  requiresAdminApproval: { type: Boolean, default: false },
  adminStatus:    { type: String, enum: ["pending","approved","rejected","not_required"], default: "not_required" },
  adminReviewBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  adminReviewAt:  { type: Date, default: null },
  adminNote:      { type: String, default: "" },

  // Final status (computed from both stages)
  // pending → finance_approved → admin_approved → paid
  // OR pending → finance_rejected / admin_rejected
  status: {
    type: String,
    enum: ["pending","finance_approved","admin_pending","approved","rejected","paid"],
    default: "pending",
  },

  // Payment
  paidAt:     { type: Date, default: null },
  paymentRef: { type: String, default: "" },
  paidBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

}, { timestamps: true });

ReimbursementSchema.index({ submittedBy: 1, status: 1 });
ReimbursementSchema.index({ status: 1, createdAt: -1 });
ReimbursementSchema.index({ financeStatus: 1 });

export default mongoose.models.Reimbursement || mongoose.model("Reimbursement", ReimbursementSchema);