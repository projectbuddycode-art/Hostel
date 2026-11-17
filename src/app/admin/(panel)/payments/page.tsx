import type { Metadata } from "next";
import { Notice } from "@/components/editorial";
import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/dates";
import { formatINRExact } from "@/lib/format";
import { refundAction } from "@/server/actions";

export const metadata: Metadata = { title: "Payments", robots: { index: false, follow: false } };

export default async function PaymentsAdmin({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const payments = await prisma.payment.findMany({
    include: { user: true, refunds: true, subscription: { include: { plan: true } } },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return (
    <section>
      <Notice notice={query.notice} error={query.error} />
      <h1 className="font-serif text-5xl text-navy">Payments</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6">Online refunds are sent to Razorpay and recorded only if that call succeeds. Offline refunds are a record of money returned outside the gateway.</p>
      <div className="mt-6 space-y-4">
        {payments.map((payment) => {
          const refunded = payment.refunds.reduce((sum, refund) => sum + refund.amountPaise, 0);
          return (
            <article key={payment.id} className="border border-navy/10 p-4 text-sm">
              <p className="font-medium">{payment.user.name} · {payment.subscription?.plan.name || "Membership"} · {payment.status}</p>
              <p>{formatWhen(payment.createdAt)} · {payment.provider} · {formatINRExact(payment.amountPaise)} · refunded {formatINRExact(refunded)}</p>
              {payment.failureReason ? <p>{payment.failureReason}</p> : null}
              {payment.note ? <p>{payment.note}</p> : null}
              {payment.status === "PAID" || (payment.status === "REFUNDED" && refunded < payment.amountPaise) ? (
                <form action={refundAction} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="paymentId" value={payment.id} />
                  <input className="field max-w-[10rem]" name="amountRupees" type="number" min="1" step="1" placeholder="Rupees" aria-label="Refund rupees" required />
                  <input className="field max-w-sm" name="reason" placeholder="Reason" aria-label="Refund reason" required />
                  <button className="btn btn-line-dark" type="submit">Record refund</button>
                </form>
              ) : null}
            </article>
          );
        })}
        {!payments.length ? <p>No payments recorded.</p> : null}
      </div>
    </section>
  );
}
