import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reimbursement, { ADMIN_APPROVAL_THRESHOLD } from "@/models/Reimbursement";
import User from "@/models/User";
import { requireAuth } from "@/lib/apiAuth";
import { sendMail } from "@/lib/mailer";

async function getReviewer(userId: string, role: string) {
  if (role === "admin") return { isAdmin: true, isFinance: true };
  if (role === "employee") {
    const u = await User.findById(userId).select("isFinance jobRole department").lean() as { isFinance?: boolean; jobRole?: string; department?: string } | null;
    return { isAdmin: false, isFinance: u?.isFinance === true || u?.jobRole === "dept_head", department: u?.department || "" };
  }
  return { isAdmin: false, isFinance: false };
}

export async function GET(req: NextRequest) {
  const { userId, role, response } = await requireAuth() as { userId:string; role:string; response:NextResponse|null };
  if (response) return response;
  await connectDB();
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const mine   = searchParams.get("mine") === "true";
  const page   = Math.max(1, parseInt(searchParams.get("page")||"1"));
  const skip   = (page-1)*20;

  const filter: Record<string,unknown> = {};
  if (role === "client") { filter.submittedBy = userId; }
  else if (role === "employee") {
    const rev = await getReviewer(userId, role);
    if (!rev.isFinance || mine) filter.submittedBy = userId;
  } else if (role === "admin" && mine) { filter.submittedBy = userId; }

  if (status && status !== "all") filter.status = status;

  const [items, total] = await Promise.all([
    Reimbursement.find(filter)
      .populate("submittedBy",    "firstName lastName email role department jobRole")
      .populate("projectId",      "title")
      .populate("financeReviewBy","firstName lastName")
      .populate("adminReviewBy",  "firstName lastName")
      .populate("paidBy",         "firstName lastName")
      .sort({ createdAt:-1 }).skip(skip).limit(20).lean(),
    Reimbursement.countDocuments(filter),
  ]);

  return NextResponse.json({ reimbursements: items, pagination:{ page, limit:20, total, pages:Math.ceil(total/20) } });
}

export async function POST(req: NextRequest) {
  const { userId, role, response } = await requireAuth() as { userId:string; role:string; response:NextResponse|null };
  if (response) return response;
  await connectDB();
  const { amount, category, description, date, projectId, receiptUrl, receiptName } = await req.json();
  if (!amount||!category||!description||!date) return NextResponse.json({ error:"Amount, category, description and date are required" }, { status:400 });

  const amountPaise = Math.round(parseFloat(amount)*100);
  if (amountPaise<=0) return NextResponse.json({ error:"Amount must be greater than 0" }, { status:400 });

  const submitter = await User.findById(userId).select("firstName lastName email department").lean() as unknown as { firstName:string; lastName:string; email:string; department:string }|null;
  const requiresAdmin = amountPaise > ADMIN_APPROVAL_THRESHOLD;

  const item = await Reimbursement.create({
    submittedBy:userId, submitterRole:role, submitterDept:submitter?.department||"",
    amount:amountPaise, category, description, date:new Date(date),
    projectId:projectId||null, receiptUrl:receiptUrl||"", receiptName:receiptName||"",
    status:"pending", financeStatus:"pending",
    requiresAdminApproval:requiresAdmin,
    adminStatus:requiresAdmin?"pending":"not_required",
  });

  try {
    const financeHeads = await User.find({
      $or:[{ role:"admin" },{ role:"employee", isFinance:true },{ role:"employee", jobRole:"dept_head", department:"Finance" }],
      _id:{ $ne:userId },
    }).select("email firstName").lean() as unknown as { email:string; firstName:string }[];

    for (const head of financeHeads) {
      await sendMail({ to:head.email, subject:`Reimbursement request — ₹${(amountPaise/100).toLocaleString("en-IN")} from ${submitter?.firstName}`,
        html:`<div style="font-family:sans-serif;max-width:500px"><h2 style="color:#0d1f4c">New Reimbursement Request</h2>
        <p>Hi ${head.firstName}, a new reimbursement needs your review.</p>
        <p style="font-size:15px;font-weight:700;color:#0d1f4c">₹${(amountPaise/100).toLocaleString("en-IN")}${requiresAdmin?" · ⚠ Needs admin approval too":""}</p>
        <p style="font-size:13px;color:#6b7280">From: ${submitter?.firstName} ${submitter?.lastName} (${role}${submitter?.department?` · ${submitter.department}`:""})<br>Category: ${category}<br>Description: ${description}</p>
        <br><a href="${process.env.NEXT_PUBLIC_URL}/dashboard/admin/reimbursements" style="display:inline-block;background:#0d1f4c;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">Review →</a></div>` });
    }
  } catch {}

  const populated = await Reimbursement.findById(item._id).populate("submittedBy","firstName lastName email role department").populate("projectId","title").lean();
  return NextResponse.json({ success:true, reimbursement:populated }, { status:201 });
}

export async function PATCH(req: NextRequest) {
  const { userId, role, response } = await requireAuth() as { userId:string; role:string; response:NextResponse|null };
  if (response) return response;
  await connectDB();
  const { id, action, note, paymentRef } = await req.json();

  const reviewer = await getReviewer(userId, role);
  const item = await Reimbursement.findById(id).populate("submittedBy","firstName lastName email role");
  if (!item) return NextResponse.json({ error:"Request not found" }, { status:404 });

  const submitter = item.submittedBy as unknown as { _id:mongoose.Types.ObjectId; email:string; firstName:string };
  if (String(submitter._id)===String(userId)) {
    return NextResponse.json({ error:"You cannot approve your own reimbursement request." }, { status:403 });
  }

  if (action==="finance_approve"||action==="finance_reject") {
    if (!reviewer.isFinance) return NextResponse.json({ error:"Only Finance dept heads or admins can do finance review." }, { status:403 });
    if (item.financeStatus!=="pending") return NextResponse.json({ error:"Already reviewed by finance." }, { status:400 });

    item.financeReviewBy = userId as unknown as mongoose.Types.ObjectId;
    item.financeReviewAt = new Date();
    item.financeNote     = note||"";

    if (action==="finance_approve") {
      item.financeStatus = "approved";
      if (item.requiresAdminApproval) {
        item.status = "admin_pending"; item.adminStatus = "pending";
        try {
          const admins = await User.find({ role:"admin", _id:{ $ne:userId } }).select("email firstName").lean() as unknown as { email:string; firstName:string }[];
          for (const a of admins) {
            await sendMail({ to:a.email, subject:`Final approval needed — ₹${(item.amount/100).toLocaleString("en-IN")}`,
              html:`<div style="font-family:sans-serif;max-width:500px"><h2 style="color:#0d1f4c">Admin Approval Required</h2>
              <p>Hi ${a.firstName}, Finance has approved a reimbursement above ₹5,000. Please give final approval.</p>
              <p style="font-size:16px;font-weight:700;color:#0d1f4c">₹${(item.amount/100).toLocaleString("en-IN")}</p>
              <p style="font-size:13px;color:#6b7280">From: ${submitter.firstName} · ${item.category}</p>
              <br><a href="${process.env.NEXT_PUBLIC_URL}/dashboard/admin/reimbursements" style="display:inline-block;background:#0d1f4c;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">Review →</a></div>` });
          }
        } catch {}
      } else {
        item.status = "approved";
      }
    } else {
      item.financeStatus = "rejected"; item.status = "rejected";
    }
  }

  else if (action==="admin_approve"||action==="admin_reject") {
    if (!reviewer.isAdmin) return NextResponse.json({ error:"Only admins can give final approval." }, { status:403 });
    if (item.status!=="admin_pending") return NextResponse.json({ error:"Not awaiting admin approval." }, { status:400 });
    item.adminReviewBy = userId as unknown as mongoose.Types.ObjectId;
    item.adminReviewAt = new Date();
    item.adminNote     = note||"";
    if (action==="admin_approve") { item.adminStatus="approved"; item.status="approved"; }
    else { item.adminStatus="rejected"; item.status="rejected"; }
  }

  else if (action==="paid") {
    if (!reviewer.isAdmin&&!reviewer.isFinance) return NextResponse.json({ error:"Only Finance heads or admins can mark as paid." }, { status:403 });
    if (item.status!=="approved") return NextResponse.json({ error:"Only approved requests can be marked as paid." }, { status:400 });
    if (!paymentRef?.trim()) return NextResponse.json({ error:"Payment reference is required." }, { status:400 });
    item.status="paid"; item.paidAt=new Date(); item.paymentRef=paymentRef.trim();
    item.paidBy=userId as unknown as mongoose.Types.ObjectId;
  }
  else { return NextResponse.json({ error:"Invalid action." }, { status:400 }); }

  await item.save();

  // Notify submitter
  try {
    const labels: Record<string,string> = { finance_approve:"Finance Approved ✅", finance_reject:"Finance Rejected ❌", admin_approve:"Management Approved ✅", admin_reject:"Management Rejected ❌", paid:"Payment Processed 💸" };
    await sendMail({ to:submitter.email, subject:`Reimbursement ${labels[action]||"Updated"} — ₹${(item.amount/100).toLocaleString("en-IN")}`,
      html:`<div style="font-family:sans-serif;max-width:500px"><h2 style="color:#0d1f4c">Reimbursement ${labels[action]||"Updated"}</h2>
      <p>Hi ${submitter.firstName}, your ₹${(item.amount/100).toLocaleString("en-IN")} reimbursement has been updated.</p>
      <p style="font-size:14px;font-weight:600;color:${action.includes("approve")||action==="paid"?"#059669":"#dc2626"}">${item.status.replace(/_/g," ").toUpperCase()}</p>
      ${note?`<p style="font-size:13px;color:#6b7280">Note: ${note}</p>`:""}
      ${paymentRef?`<p style="font-size:13px">Payment ref: <code>${paymentRef}</code></p>`:""}
      ${item.status==="admin_pending"?`<p style="background:#fef3c7;padding:12px;border-radius:8px;font-size:13px;color:#92400e">Finance approved. Awaiting final management approval (amount exceeds ₹5,000).</p>`:""}
      ${item.status==="paid"?`<p style="background:#d1fae5;padding:12px;border-radius:8px;font-size:13px;color:#065f46">Processed. Please check your bank account in 2–3 working days.</p>`:""}
      </div>` });
  } catch {}

  return NextResponse.json({ success:true, reimbursement:item });
}