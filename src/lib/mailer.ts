type MailOptions = { to: string; subject: string; html: string; attachments?: { filename: string; content: string; encoding: string; contentType: string }[] };

export async function sendMail(opts: MailOptions): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER || "console";

  if (provider === "resend") {
    await sendWithResend(opts);
  } else if (provider === "nodemailer" || provider === "gmail") {
    await sendWithNodemailer(opts);
  } else {
    logToConsole(opts);
  }
}

async function sendWithResend({ to, subject, html }: MailOptions) {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from   = process.env.FROM_EMAIL || "onboarding@resend.dev";
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw new Error(error.message);
}

async function sendWithNodemailer({ to, subject, html, attachments }: MailOptions) {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS, // App password from Google Account settings
    },
  });
  await transporter.sendMail({
    from: `"OptiTax" <${process.env.GMAIL_USER}>`,
    to, subject, html, attachments,
  });
}

function logToConsole({ to, subject, html }: MailOptions) {
  console.log("\n📧 ── EMAIL ──────────────────────────────────");
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:    ${html.replace(/<[^>]+>/g,"").trim().slice(0,300)}`);
  console.log("─────────────────────────────────────────────\n");
}