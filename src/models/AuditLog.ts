import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userEmail:  { type: String },
  userRole:   { type: String },
  action:     { type: String, required: true }, // e.g. "project.status_changed"
  entity:     { type: String }, // "project" | "user" | "subscription"
  entityId:   { type: String },
  details:    { type: mongoose.Schema.Types.Mixed }, // { from, to, field, etc }
  ip:         { type: String },
}, { timestamps: true });

// Auto-expire logs after 1 year
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);