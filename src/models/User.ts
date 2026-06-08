import mongoose from "mongoose";

const DEPARTMENTS = [
  "Finance",
  "GST & Indirect Tax",
  "Customs & Trade",
  "Legal & Compliance",
  "Direct Tax & ITR",
  "Audit & Accounts",
  "MOOWR & SEZ",
  "IT & Operations",
  "Brand Rate / DBK",
  "Management",
];

const UserSchema = new mongoose.Schema({
  // Core
  role:       { type: String, enum: ["admin","employee","client"], required: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String },

  // Personal
  firstName:  { type: String, trim: true, default: "" },
  lastName:   { type: String, trim: true, default: "" },
  phone:      { type: String, trim: true },
  photo:      { type: String, trim: true },

  // Client-specific
  businessName:      { type: String, trim: true },
  gstin:             { type: String, trim: true },
  pan:               { type: String, trim: true },
  registeredAddress: { type: String, trim: true },
  servicesNeeded:    [{ type: String }],

  // Employee hierarchy
  department:  { type: String, enum: DEPARTMENTS, trim: true },
  designation: { type: String, trim: true },
  jobRole:     {
    type: String,
    enum: ["intern", "employee", "dept_head", "manager"],
    default: "employee",
  },
  // Finance permission — dept_head of Finance OR admin can approve reimbursements
  isFinance:   { type: Boolean, default: false },

  // Specializations (employee)
  specializations: [{ type: String }],

  // Admin
  adminLevel: { type: String, trim: true, default: "regular" },

  // 2FA
  twoFactorSecret:  { type: String },
  twoFactorEnabled: { type: Boolean, default: false },

  // Subscription
  subscription:          { type: String, default: "free" },
  subscriptionPaymentId: { type: String, trim: true },
  subscriptionOrderId:   { type: String, trim: true },
  subscriptionPaidAt:    { type: Date },
}, { timestamps: true });

export const DEPARTMENTS_LIST = DEPARTMENTS;

export default mongoose.models.User || mongoose.model("User", UserSchema);