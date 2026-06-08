import mongoose from "mongoose";

const ReimbursementSchema = new mongoose.Schema({
  submittedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  submitterRole: { type: String, enum: ["admin","employee","client"], required: true },
  amount:        { type: Number, required: true }, // in paise
  category:      { type: String, required: true, enum: ["Travel","Food","Office Supplies","Software","Training","Client Entertainment","Medical","Utilities","Other"] },
  description:   { type: String, required: true, trim: true },
  date:          { type: Date, required: true },
  projectId:     { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
  receiptUrl:    { type: String, default: "" },
  receiptName:   { type: String, default: "" },
  status:        { type: String, enum: ["pending","approved","rejected","paid"], default: "pending" },
  reviewedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt:    { type: Date, default: null },
  reviewNote:    { type: String, default: "" },
  paidAt:        { type: Date, default: null },
  paymentRef:    { type: String, default: "" },
}, { timestamps: true });

ReimbursementSchema.index({ submittedBy: 1, status: 1 });
ReimbursementSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Reimbursement || mongoose.model("Reimbursement", ReimbursementSchema);