import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reimbursement from "@/models/Reimbursement";
import User from "@/models/User";
import { requireAuth } from "@/lib/apiAuth";
import { sendMail } from "@/lib/mailer";

// ── Permission helpers ────────────────────────────────────────────────────────
// Can review = admin OR finance employee, but NEVER their own request
async function canReview(userId: string, role: string): Promise<boolean> {
  if (role === "admin") return true;
  if (role === "employee") {
    const user = await User.findById(userId).select("isFinance").lean() as { isFinance?: boolean } | null;
    return user?.isFinance === true;
  }
  return false;
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { userId, role, response } = await requireAuth() as { userId:string; role:string; response:NextResponse|null };
  if (response) return response;

  await connectDB();
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const mine   = searchParams.get("mine") === "true";
  const page   = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit  = 20;
  const skip   = (page - 1) * limit;

  const filter: Record<string,unknown> = {};

  // Clients and employees always see only their own
  // Admins see all unless ?mine=true
  // Finance employees: see all (to review) AND their own when ?mine=true
  if (role === "client" || role === "employee") {
    // Finance employees need to see all to review — but for "my requests" filter to self
    const user = role === "employee"
      ? await User.findById(userId).select("isFinance").lean() as { isFinance?: boolean } | null
      : null;
    const isFinance = user?.isFinance === true;
    if (!isFinance || mine) filter.submittedBy = userId;
  } else if (role === "admin" && mine) {
    filter.submittedBy = userId;
  }

  if (status && status !== "all") filter.status = status;

  const [items, total] = await Promise.all([
    Reimbursement.find(filter)
      .populate("submittedBy", "firstName lastName email role isFinance")
      .populate("projectId",   "title")
      .populate("reviewedBy",  "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit).lean(),
    Reimbursement.countDocuments(filter),
  ]);

  return NextResponse.json({ reimbursements: items, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
}

// ── POST — submit ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId, role, response } = await requireAuth() as { userId:string; role:string; response:NextResponse|null };
  if (response) return response;

  await connectDB();
  const { amount, category, description, date, projectId, receiptUrl, receiptName } = await req.json();

  if (!amount || !category || !description || !date) {
    return NextResponse.json({ error: "Amount, category, description and date are required" }, { status: 400 });
  }
  if (parseFloat(amount) <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
  }

  const item = await Reimbursement.create({
    submittedBy:   userId,
    submitterRole: role,
    amount:        Math.round(parseFloat(amount) * 100),
    category, description,
    date:        new Date(date),
    projectId:   projectId || null,
    receiptUrl:  receiptUrl  || "",
    receiptName: receiptName || "",
    status: "pending",
  });

  // Notify all admins + finance employees (except submitter)
  try {
    const notifyUsers = await User.find({
      $or: [
        { role: "admin" },
        { role: "employee", isFinance: true },
      ],
      _id: { $ne: userId }, // never notify yourself
    }).select("email firstName").lean() as unknown as { email:string; firstName:string }[];

    const submitter = await User.findById(userId).select("firstName lastName email").lean() as unknown as { firstName:string; lastName:string; email:string } | null;

    for (const u of notifyUsers) {
      await sendMail({
        to:      u.email,
        subject: `New reimbursement request — ₹${(item.amount/100).toLocaleString("en-IN")}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#0d1f4c">New Reimbursement Request</h2>
            <p>Hi ${u.firstName}, a new reimbursement request needs your review.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Submitted by</td><td style="font-weight:600;font-size:13px">${submitter?.firstName} ${submitter?.lastName} (${role})</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Amount</td><td style="font-weight:600;font-size:13px;color:#0d1f4c">₹${(item.amount/100).toLocaleString("en-IN")}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Category</td><td style="font-size:13px">${category}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Description</td><td style="font-size:13px">${description}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Date</td><td style="font-size:13px">${new Date(date).toLocaleDateString("en-IN")}</td></tr>
            </table>
            <a href="${process.env.NEXT_PUBLIC_URL}/dashboard/${role === "admin" ? "admin" : "employee"}/reimbursements" style="display:inline-block;background:#0d1f4c;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">Review Request →</a>
          </div>`,
      });
    }
  } catch {}

  const populated = await Reimbursement.findById(item._id)
    .populate("submittedBy", "firstName lastName email role")
    .populate("projectId", "title").lean();

  return NextResponse.json({ success: true, reimbursement: populated }, { status: 201 });
}

// ── PATCH — approve / reject / mark paid ─────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { userId, role, response } = await requireAuth() as { userId:string; role:string; response:NextResponse|null };
  if (response) return response;

  await connectDB();
  const { id, action, reviewNote, paymentRef } = await req.json();

  // Check reviewer permission
  const hasPermission = await canReview(userId, role);
  if (!hasPermission) {
    return NextResponse.json({
      error: "Only admins or finance employees can review reimbursements"
    }, { status: 403 });
  }

  const item = await Reimbursement.findById(id).populate("submittedBy", "firstName lastName email");
  if (!item) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  // ── SELF-APPROVAL PREVENTION ──────────────────────────────────────────────
  if (item.submittedBy && String((item.submittedBy as unknown as { _id: mongoose.Types.ObjectId })._id) === String(userId)) {
    return NextResponse.json({
      error: "You cannot approve or reject your own reimbursement request. Another admin or finance member must review it."
    }, { status: 403 });
  }

  if (action === "approve") {
    item.status     = "approved";
    item.reviewedBy = userId as unknown as mongoose.Types.ObjectId;
    item.reviewedAt = new Date();
    item.reviewNote = reviewNote || "";
  } else if (action === "reject") {
    item.status     = "rejected";
    item.reviewedBy = userId as unknown as mongoose.Types.ObjectId;
    item.reviewedAt = new Date();
    item.reviewNote = reviewNote || "";
  } else if (action === "paid") {
    if (item.status !== "approved") {
      return NextResponse.json({ error: "Can only mark approved requests as paid" }, { status: 400 });
    }
    // Paid can be done by same reviewer or different — no self-restriction needed here
    item.status     = "paid";
    item.paidAt     = new Date();
    item.paymentRef = paymentRef || "";
  } else {
    return NextResponse.json({ error: "Invalid action. Use approve, reject, or paid." }, { status: 400 });
  }

  await item.save();

  // Notify submitter
  try {
    const submitter = item.submittedBy as unknown as { email:string; firstName:string };
    const amt        = `₹${(item.amount/100).toLocaleString("en-IN")}`;
    const statusLabel = action === "approve" ? "Approved ✅" : action === "reject" ? "Rejected ❌" : "Payment Processed 💸";

    await sendMail({
      to:      submitter.email,
      subject: `Reimbursement ${statusLabel} — ${amt}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#0d1f4c">Reimbursement ${statusLabel}</h2>
          <p>Hi ${submitter.firstName}, your reimbursement request has been updated.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Amount</td><td style="font-weight:600;font-size:13px">${amt}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Category</td><td style="font-size:13px">${item.category}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Status</td><td style="font-weight:600;font-size:13px;color:${action==="approve"?"#059669":action==="reject"?"#dc2626":"#2563eb"}">${item.status.toUpperCase()}</td></tr>
            ${reviewNote ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Note</td><td style="font-size:13px">${reviewNote}</td></tr>` : ""}
            ${paymentRef ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Payment Ref</td><td style="font-size:13px;font-family:monospace">${paymentRef}</td></tr>` : ""}
          </table>
          ${action==="paid" ? `<p style="background:#d1fae5;padding:12px 16px;border-radius:8px;font-size:13px;color:#065f46">Your reimbursement has been processed. Please check your bank account within 2-3 working days.</p>` : ""}
        </div>`,
    });
  } catch {}

  return NextResponse.json({ success: true, reimbursement: item });
}