import mongoose from "mongoose";

const InviteCodeSchema = new mongoose.Schema({
  code:      { type: String, required: true, unique: true, uppercase: true, trim: true },
  role:      { type: String, enum: ["employee", "admin"], required: true },
  label:     { type: String, trim: true },
  maxUses:   { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
  createdBy: { type: String },
  expiresAt: { type: Date, default: null },
  usedBy: [{
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email:   { type: String },
    name:    { type: String },
    usedAt:  { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export default mongoose.models.InviteCode || mongoose.model("InviteCode", InviteCodeSchema);