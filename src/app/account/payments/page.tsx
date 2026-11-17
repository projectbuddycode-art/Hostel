import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { formatWhen } from "@/lib/dates";
import { formatINRExact } from "@/lib/format";

export const metadata: Metadata = { title: "Payments", robots: { index: false } };

export default async function PaymentsPage() {
  const user = await requireUser();
  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    include: { refunds: true, subscription: { include: { plan: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <section>
      <h1 className="font-serif text-5xl text-navy">Payments</h1>
      <div className="mt-6 overflow-x-auto border border-navy/10">
        <table className="ledger">
          <thead><tr><th>When</th><th>Membership</th><th>Provider</th><th>Status</th><th>Amount</th><th>Refunded</th></tr></thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{formatWhen(payment.createdAt)}</td>
                <td>{payment.subscription?.plan.name || "—"}</td>
                <td>{payment.provider}</td>
                <td>{payment.status}{payment.failureReason ? <p className="text-xs">{payment.failureReason}</p> : null}</td>
                <td>{formatINRExact(payment.amountPaise)}</td>
                <td>{formatINRExact(payment.refunds.reduce((sum, refund) => sum + refund.amountPaise, 0))}</td>
              </tr>
            ))}
            {!payments.length ? <tr><td colSpan={6}>No payments yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
