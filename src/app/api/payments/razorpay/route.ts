import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/guard";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { paymentId?: string } | null;
  const payment = await prisma.payment.findFirst({
    where: { id: body?.paymentId, userId: session.id },
    include: { subscription: { include: { plan: true } }, user: true },
  });
  if (!payment || payment.status !== "CREATED" || !payment.subscription) {
    return NextResponse.json({ ok: false, error: "This payment is no longer open." }, { status: 400 });
  }
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({
      ok: false,
      mode: "unconfigured",
      error:
        "Online payment is not configured. The membership stays pending until Razorpay is connected or the dining desk records a payment received outside the gateway. Nothing has been marked as paid.",
    });
  }
  let orderId = payment.razorpayOrderId;
  if (!orderId) {
    const Razorpay = (await import("razorpay")).default;
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await client.orders.create({
      amount: payment.amountPaise,
      currency: "INR",
      receipt: payment.id.slice(0, 40),
      notes: {
        paymentId: payment.id,
        subscriptionId: payment.subscriptionId || "",
      },
    });
    const saved = await prisma.payment.updateMany({
      where: { id: payment.id, razorpayOrderId: "" },
      data: { razorpayOrderId: order.id },
    });
    if (saved.count === 1) orderId = order.id;
    else {
      const fresh = await prisma.payment.findUnique({ where: { id: payment.id } });
      orderId = fresh?.razorpayOrderId || order.id;
    }
  }
  return NextResponse.json({
    ok: true,
    mode: "razorpay",
    keyId,
    orderId,
    amount: payment.amountPaise,
    currency: "INR",
    name: payment.user.name,
    email: payment.user.email,
    phone: payment.user.phone,
    description: payment.subscription.plan.name,
  });
}
