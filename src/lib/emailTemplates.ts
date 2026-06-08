const base = (content: string) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#f1f5f9; font-family:'Segoe UI',Arial,sans-serif; }
  .wrap { max-width:560px; margin:0 auto; padding:32px 16px; }
  .card { background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
  .header { background:#0f1f4a; padding:28px 32px; }
  .header h1 { margin:0; color:#fff; font-size:20px; font-weight:700; letter-spacing:-.3px; }
  .header p { margin:4px 0 0; color:rgba(255,255,255,0.5); font-size:12px; }
  .body { padding:32px; }
  .body p { color:#475569; font-size:14px; line-height:1.7; margin:0 0 16px; }
  .btn { display:inline-block; background:#0f1f4a; color:#fff!important; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600; font-size:14px; }
  .footer { text-align:center; padding:20px; color:#94a3b8; font-size:11px; }
  .divider { border:none; border-top:1px solid #f1f5f9; margin:20px 0; }
  .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; }
  .table { width:100%; border-collapse:collapse; }
  .table td { padding:10px 0; font-size:13px; border-bottom:1px solid #f1f5f9; color:#475569; }
  .table td:last-child { text-align:right; font-weight:600; color:#0f172a; }
  .otp-box { background:#f8fafc; border-radius:10px; padding:24px; text-align:center; margin:20px 0; }
  .otp-code { font-size:36px; font-weight:800; letter-spacing:10px; color:#0f1f4a; font-family:monospace; }
</style>
</head><body>
<div class="wrap">
  <div class="card">
    <div class="header">
      <h1>OptiTax</h1>
      <p>Compliance Management Platform</p>
    </div>
    <div class="body">${content}</div>
  </div>
  <div class="footer">© 2026 OptiTax · All rights reserved<br>This email was sent to you because you have an account with OptiTax.</div>
</div>
</body></html>`;

export const welcomeEmail = (name: string, role: string) => base(`
  <p>Hi <strong>${name}</strong>,</p>
  <p>Welcome to OptiTax! Your ${role} account has been created successfully.</p>
  <p>You can now log in and start managing your compliance work.</p>
  <a href="${process.env.NEXT_PUBLIC_URL}/${role}/login" class="btn">Log In to OptiTax →</a>
  <hr class="divider">
  <p style="font-size:12px;color:#94a3b8">If you did not create this account, please ignore this email.</p>
`);

export const otpEmail = (otp: string, portal: string) => base(`
  <p>Use the OTP below to verify your email address for the <strong>${portal}</strong>.</p>
  <p>This code expires in <strong>10 minutes</strong>.</p>
  <div class="otp-box">
    <div class="otp-code">${otp}</div>
  </div>
  <p style="font-size:12px;color:#94a3b8">If you did not request this, ignore this email.</p>
`);

export const paymentInvoiceEmail = (data: {
  name: string; email: string; plan: string; amount: number;
  cycle: string; paymentId: string; validUntil: string; orderId: string;
}) => base(`
  <p>Hi <strong>${data.name}</strong>,</p>
  <p>Thank you for your payment! Your subscription has been activated.</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
    <div style="font-size:13px;color:#166534;font-weight:600;margin-bottom:4px">Payment Successful</div>
    <div style="font-size:28px;font-weight:800;color:#0f172a">₹${(data.amount/100).toLocaleString("en-IN")}</div>
  </div>
  <table class="table">
    <tr><td>Plan</td><td style="text-transform:capitalize">${data.plan}</td></tr>
    <tr><td>Billing Cycle</td><td style="text-transform:capitalize">${data.cycle}</td></tr>
    <tr><td>Amount Paid</td><td>₹${(data.amount/100).toLocaleString("en-IN")}</td></tr>
    <tr><td>Payment ID</td><td style="font-size:11px;font-family:monospace">${data.paymentId}</td></tr>
    <tr><td>Order ID</td><td style="font-size:11px;font-family:monospace">${data.orderId}</td></tr>
    <tr><td>Valid Until</td><td>${data.validUntil}</td></tr>
  </table>
  <br>
  <a href="${process.env.NEXT_PUBLIC_URL}/dashboard/client/subscription" class="btn">View Subscription →</a>
  <hr class="divider">
  <p style="font-size:12px;color:#94a3b8">Please save this email as your payment receipt. For support, contact support@optitax.in</p>
`);

export const projectUpdateEmail = (data: {
  clientName: string; projectTitle: string; status: string;
  progress: number; updatedBy: string; note?: string;
}) => base(`
  <p>Hi <strong>${data.clientName}</strong>,</p>
  <p>Your project has been updated.</p>
  <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0">
    <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:12px">${data.projectTitle}</div>
    <table class="table">
      <tr><td>Status</td><td><span class="badge" style="background:#dbeafe;color:#1e40af">${data.status}</span></td></tr>
      <tr><td>Progress</td><td>${data.progress}%</td></tr>
      <tr><td>Updated by</td><td>${data.updatedBy}</td></tr>
      ${data.note ? `<tr><td>Note</td><td>${data.note}</td></tr>` : ""}
    </table>
  </div>
  <a href="${process.env.NEXT_PUBLIC_URL}/dashboard/client/project" class="btn">View Project →</a>
`);

export const newMessageEmail = (data: {
  recipientName: string; senderName: string; preview: string; role: string;
}) => base(`
  <p>Hi <strong>${data.recipientName}</strong>,</p>
  <p>You have a new message from <strong>${data.senderName}</strong>.</p>
  <div style="background:#f8fafc;border-left:3px solid #0f1f4a;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0">
    <p style="margin:0;font-size:14px;color:#0f172a;font-style:italic">"${data.preview.slice(0,150)}${data.preview.length>150?"…":""}"</p>
  </div>
  <a href="${process.env.NEXT_PUBLIC_URL}/dashboard/${data.role}/msg" class="btn">Reply Now →</a>
`);

export const forgotPasswordEmail = (data: { name: string; role: string; resetUrl: string }) => base(`
  <p>Hi <strong>${data.name}</strong>,</p>
  <p>We received a request to reset your OptiTax password. Click the button below — this link expires in <strong>30 minutes</strong>.</p>
  <a href="${data.resetUrl}" class="btn">Reset Password →</a>
  <hr class="divider">
  <p style="font-size:12px;color:#94a3b8">If you did not request this, ignore this email. Your password will not change.</p>
`);

export const projectCommentEmail = (data: {
  recipientName: string; commenterName: string; projectTitle: string;
  comment: string; role: string;
}) => base(`
  <p>Hi <strong>${data.recipientName}</strong>,</p>
  <p><strong>${data.commenterName}</strong> left a comment on <strong>${data.projectTitle}</strong>.</p>
  <div style="background:#f8fafc;border-left:3px solid #0f1f4a;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0">
    <p style="margin:0;font-size:14px;color:#0f172a">"${data.comment}"</p>
  </div>
  <a href="${process.env.NEXT_PUBLIC_URL}/dashboard/${data.role}/project" class="btn">View Project →</a>
`);