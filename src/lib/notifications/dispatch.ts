import type { PrismaClient } from "@prisma/client";

type Notice = {
  userId?: string | null;
  type: string;
  title: string;
  body: string;
  emailBody?: string;
  email?: string;
  phone?: string;
  whatsappOptIn?: boolean;
  whatsappTemplate?: string;
};

const templateEnv: Record<string, string> = {
  registration: "WHATSAPP_TEMPLATE_REGISTRATION",
  subscription: "WHATSAPP_TEMPLATE_SUBSCRIPTION",
  meal: "WHATSAPP_TEMPLATE_MEAL",
  order: "WHATSAPP_TEMPLATE_ORDER",
  delivery: "WHATSAPP_TEMPLATE_DELIVERY",
  payment: "WHATSAPP_TEMPLATE_PAYMENT",
  renewal: "WHATSAPP_TEMPLATE_RENEWAL",
};

export async function notify(db: PrismaClient, notice: Notice) {
  await db.notification.create({
    data: {
      userId: notice.userId || null,
      type: notice.type,
      channel: "IN_APP",
      title: notice.title,
      body: notice.body,
      status: "RECORDED",
    },
  });

  const emailStatus = await sendEmail({ ...notice, body: notice.emailBody || notice.body });
  if (notice.email) {
    await db.notification.create({
      data: {
        userId: notice.userId || null,
        type: notice.type,
        channel: "EMAIL",
        title: notice.title,
        body: notice.body,
        status: emailStatus,
      },
    });
  }

  const whatsappStatus = await sendWhatsApp(notice);
  if (notice.phone) {
    await db.notification.create({
      data: {
        userId: notice.userId || null,
        type: notice.type,
        channel: "WHATSAPP",
        title: notice.title,
        body: notice.body,
        status: whatsappStatus,
      },
    });
  }
}

async function sendEmail(notice: Notice): Promise<string> {
  if (!notice.email) return "SKIPPED";
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;
  if (!host || !user || !pass || !from) return "SKIPPED_NO_CONFIG";
  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === "465",
      auth: { user, pass },
    });
    await transport.sendMail({
      from,
      to: notice.email,
      subject: notice.title,
      text: notice.body,
    });
    return "SENT";
  } catch {
    return "FAILED";
  }
}

async function sendWhatsApp(notice: Notice): Promise<string> {
  if (!notice.phone) return "SKIPPED";
  if (!notice.whatsappOptIn) return "SKIPPED_NO_PERMISSION";
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const envKey = notice.whatsappTemplate ? templateEnv[notice.whatsappTemplate] : "";
  const template = envKey ? process.env[envKey] : "";
  if (!token || !phoneId || !template) return "SKIPPED_NO_CONFIG";
  const to = notice.phone.replace(/[^\d]/g, "");
  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: "en" },
        },
      }),
    });
    return response.ok ? "SENT" : "FAILED";
  } catch {
    return "FAILED";
  }
}
