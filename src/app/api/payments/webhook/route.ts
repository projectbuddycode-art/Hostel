import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { verifyWebhookSignature } from "@/lib/domain/payments";
import { activatePaidSubscription, markPaymentFailed } from "@/server/services";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Webhook secret is not configured." }, { status: 500 });
  }
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, signature, secret)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook signature." }, { status: 400 });
  }
  const event = JSON.parse(raw) as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; error_description?: string } } };
  };
  const entity = event.payload?.payment?.entity;
  if (!entity?.order_id) return NextResponse.json({ ok: true });
  const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: entity.order_id } });
  if (!payment) return NextResponse.json({ ok: true });
  if (event.event === "payment.captured") {
    const result = await activatePaidSubscription(prisma, {
      paymentId: payment.id,
      razorpayPaymentId: entity.id,
    });
    if (result.ok && !result.already) await audit(null, "payment.webhook", "Payment", payment.id, { event: event.event });
  } else if (event.event === "payment.failed") {
    await markPaymentFailed(prisma, {
      paymentId: payment.id,
      reason: entity.error_description || "Payment failed",
    });
  }
  return NextResponse.json({ ok: true });
}
