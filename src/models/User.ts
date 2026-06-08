import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // ── Core identity ──────────────────────────────────────────────
    firstName:  { type: String, trim: true },
    lastName:   { type: String, trim: true },
    email:      { type: String, trim: true, required: true, unique: true, lowercase: true },
    phone:      { type: String, trim: true },
    password:   { type: String },
    role:       { type: String, enum: ["admin","employee","client"], required: true },

    // ── Verification ───────────────────────────────────────────────
    isVerified:      { type: Boolean, default: false },
    mobileVerified:  { type: Boolean, default: false },
    emailOtp:        { type: String, default: null },
    emailOtpExp:     { type: Date,   default: null },
    mobileOtp:       { type: String, default: null },
    mobileOtpExp:    { type: Date,   default: null },

    // ── Client: Business profile ───────────────────────────────────
    businessName:    { type: String, trim: true },
    businessType:    { type: String, trim: true }, // Pvt Ltd, LLP, Proprietorship, Partnership, etc.
    industry:        { type: String, trim: true },
    registeredAddress: { type: String, trim: true },
    operationalAddress:{ type: String, trim: true },

    // ── Client: Tax registrations ──────────────────────────────────
    gstin:           { type: String, trim: true, uppercase: true },
    pan:             { type: String, trim: true, uppercase: true },
    tan:             { type: String, trim: true, uppercase: true },
    iec:             { type: String, trim: true, uppercase: true }, // Import Export Code
    cin:             { type: String, trim: true, uppercase: true }, // Company Identification Number
    udyamReg:        { type: String, trim: true },                  // MSME Udyam Registration

    // ── Client: GST details ────────────────────────────────────────
    gstRegDate:          { type: String, trim: true },
    gstReturnFrequency:  { type: String, trim: true }, // Monthly / Quarterly
    gstFilingType:       { type: String, trim: true }, // Regular / Composition

    // ── Client: Customs & trade ────────────────────────────────────
    hasImportExport: { type: Boolean, default: false },
    hasCustomsDuty:  { type: Boolean, default: false },
    hasSEZ:          { type: Boolean, default: false },
    hasMOOWR:        { type: Boolean, default: false },
    hasBrandRate:    { type: Boolean, default: false },

    // ── Client: Services needed ────────────────────────────────────
    servicesNeeded: [{ type: String }],
    // e.g. ["GST Filing","Brand Rate / DBK","ITR Filing","MOOWR","SEZ","Customs Duty","Company Incorporation","Trademark"]

    // ── Client: Financial info ─────────────────────────────────────
    annualTurnover:  { type: String, trim: true }, // range bucket
    financialYear:   { type: String, trim: true },

    // ── Client: Contact persons ────────────────────────────────────
    contactPersons: [{
      name:       { type: String, trim: true },
      designation:{ type: String, trim: true },
      phone:      { type: String, trim: true },
      email:      { type: String, trim: true },
    }],

    // ── Employee fields ────────────────────────────────────────────
    employeeId:      { type: String, trim: true },
    department:      { type: String, trim: true },
    isFinance:       { type: Boolean, default: false }, // can approve reimbursements
    designation:     { type: String, trim: true },
    specializations: [{ type: String }],
    joiningDate:     { type: String, trim: true },
    inviteCode:      { type: String, trim: true }, // required for employee self-register

    // ── Admin fields ───────────────────────────────────────────────
    adminLevel:      { type: String, trim: true }, // super / regular

    // ── Onboarding state ───────────────────────────────────────────
    onboardingStep:      { type: Number, default: 0 },
    onboardingCompleted: { type: Boolean, default: false },

    // ── Subscription ───────────────────────────────────────────────
    subscription:          { type: String, default: "free" },
    subscriptionPaymentId: { type: String, trim: true },
    subscriptionOrderId:   { type: String, trim: true },
    subscriptionPaidAt:    { type: Date },

    // ── Assigned team (for clients) ────────────────────────────────
    assignedTo:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);