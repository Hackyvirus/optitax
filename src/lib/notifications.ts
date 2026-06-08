import { sendMail } from "./mailer";
import {
  welcomeEmail, paymentInvoiceEmail, projectUpdateEmail,
  newMessageEmail, projectCommentEmail,
} from "./emailTemplates";

// All notifications fail silently — never crash the main flow
async function notify(fn: () => Promise<void>) {
  try { await fn(); } catch (err) { console.error("[Notification error]", err); }
}

export const notifications = {
  async welcome(user: { email: string; firstName: string; role: string }) {
    await notify(() => sendMail({
      to:      user.email,
      subject: "Welcome to OptiTax",
      html:    welcomeEmail(user.firstName, user.role),
    }));
  },

  async paymentSuccess(data: {
    email: string; name: string; plan: string; amount: number;
    cycle: string; paymentId: string; orderId: string; validUntil: string;
  }) {
    await notify(() => sendMail({
      to:      data.email,
      subject: `Payment confirmed — OptiTax ${data.plan} Plan`,
      html:    paymentInvoiceEmail(data),
    }));
  },

  async projectUpdated(data: {
    clientEmail: string; clientName: string; projectTitle: string;
    status: string; progress: number; updatedBy: string; note?: string;
  }) {
    await notify(() => sendMail({
      to:      data.clientEmail,
      subject: `Project update: ${data.projectTitle}`,
      html:    projectUpdateEmail(data),
    }));
  },

  async newMessage(data: {
    recipientEmail: string; recipientName: string;
    senderName: string; preview: string; role: string;
  }) {
    await notify(() => sendMail({
      to:      data.recipientEmail,
      subject: `New message from ${data.senderName} — OptiTax`,
      html:    newMessageEmail(data),
    }));
  },

  async projectComment(data: {
    recipientEmail: string; recipientName: string; commenterName: string;
    projectTitle: string; comment: string; role: string;
  }) {
    await notify(() => sendMail({
      to:      data.recipientEmail,
      subject: `New comment on ${data.projectTitle}`,
      html:    projectCommentEmail(data),
    }));
  },
};