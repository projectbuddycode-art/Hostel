import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/auth/guard";
import { verifyCheckoutSignature } from "@/lib/domain/payments";
import { activatePaidSubscription } from "@/server/services";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Online payment is not configured. No payment was accepted." }, { status: 400 });
  }
  const body = (await request.json().catch(() => null)) as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  } | null;
  if (!body?.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
    return NextResponse.json({ ok: false, error: "Payment confirmation was incomplete." }, { status: 400 });
  }
  const valid = verifyCheckoutSignature({
    orderId: body.razorpay_order_id,
    paymentId: body.razorpay_payment_id,
    signature: body.razorpay_signature,
    secret,
  });
  if (!valid) return NextResponse.json({ ok: false, error: "Payment signature could not be verified." }, { status: 400 });
  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId: body.razorpay_order_id, userId: session.id },
  });
  if (!payment) return NextResponse.json({ ok: false, error: "Payment not found." }, { status: 404 });
  const result = await activatePaidSubscription(prisma, {
    paymentId: payment.id,
    razorpayPaymentId: body.razorpay_payment_id,
  });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  if (!result.already) await audit(session.id, "payment.verified", "Payment", payment.id, { provider: "RAZORPAY" });
  return NextResponse.json({ ok: true, already: result.already });
}
