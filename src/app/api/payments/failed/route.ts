import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/guard";
import { markPaymentFailed } from "@/server/services";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { paymentId?: string; reason?: string } | null;
  const payment = await prisma.payment.findFirst({ where: { id: body?.paymentId, userId: session.id } });
  if (!payment) return NextResponse.json({ ok: false, error: "Payment not found." }, { status: 404 });
  await markPaymentFailed(prisma, {
    paymentId: payment.id,
    reason: body?.reason || "Payment was not completed.",
  });
  return NextResponse.json({ ok: true });
}
