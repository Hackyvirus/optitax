import mongoose from "mongoose";

const FilingSchema = new mongoose.Schema({
  clientId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type:       { type: String, required: true }, // GSTR-1, GSTR-3B, ITR, TDS
  period:     { type: String, required: true }, // "Apr 2026", "FY 2025-26"
  status:     { type: String, enum: ["Filed","Pending","Due","N/A"], default: "Pending" },
  dueDate:    { type: String },
  filedDate:  { type: String },
  filedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  notes:      { type: String },
}, { timestamps: true });

export default mongoose.models.Filing || mongoose.model("Filing", FilingSchema);