import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/editorial";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { businessToday, formatDisplayDate } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { cancelMembershipAction, pauseAction, resumeAction } from "@/server/actions";
import { syncMembership } from "@/server/services";

export const metadata: Metadata = { title: "Membership", robots: { index: false } };

export default async function MembershipPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  const subscription = await syncMembership(prisma, user.id);
  const history = await prisma.subscription.findMany({
    where: { userId: user.id },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <section>
      <Notice notice={query.notice} error={query.error} />
      <h1 className="font-serif text-5xl text-navy">Membership</h1>
      {subscription ? (
        <div className="mt-6 space-y-3 text-sm leading-7">
          <p className="font-serif text-3xl text-navy">{subscription.plan.name}</p>
          <p>{subscription.mealsRemaining} credits remaining · {formatINR(subscription.pricePaise)}</p>
          <p>{subscription.startDate ? formatDisplayDate(subscription.startDate) : ""} to {subscription.endDate ? formatDisplayDate(subscription.endDate) : ""}</p>
          {subscription.pausedFrom ? <p>Paused from {formatDisplayDate(subscription.pausedFrom)} until {subscription.pausedUntil ? formatDisplayDate(subscription.pausedUntil) : ""}.</p> : null}
          <p>{subscription.plan.upgradeNotes}</p>
          <Link href={`/checkout/${subscription.plan.slug}`} className="btn btn-navy mt-2">Renew or change</Link>
        </div>
      ) : <p className="mt-4">No active membership. <Link className="underline" href="/memberships">See the plans</Link>.</p>}
      {subscription ? (
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {subscription.pausedUntil && subscription.pausedUntil > businessToday() ? (
            <form action={resumeAction} className="border border-navy/10 p-5">
              <h2 className="font-serif text-2xl text-navy">Resume</h2>
              <p className="mt-2 text-sm">Unused pause days are removed from the extended term.</p>
              <button className="btn btn-line-dark mt-4" type="submit">Resume now</button>
            </form>
          ) : (
            <form action={pauseAction} className="border border-navy/10 p-5">
              <h2 className="font-serif text-2xl text-navy">Pause</h2>
              <p className="mt-2 text-sm">{subscription.plan.pauseMinDays} to {subscription.plan.pauseMaxDays} days, beginning tomorrow or later.</p>
              <label className="mt-3 block text-sm">From<input className="field mt-1" type="date" name="fromDate" required /></label>
              <label className="mt-3 block text-sm">Until<input className="field mt-1" type="date" name="untilDate" required /></label>
              <button className="btn btn-line-dark mt-4" type="submit">Pause membership</button>
            </form>
          )}
          <form action={cancelMembershipAction} className="border border-navy/10 p-5">
            <h2 className="font-serif text-2xl text-navy">Cancel</h2>
            <p className="mt-2 text-sm">Future meals still before cutoff are withdrawn. A refund is not created automatically.</p>
            <label className="mt-3 block text-sm">Type CANCEL<input className="field mt-1" name="confirm" /></label>
            <button className="btn btn-line-dark mt-4" type="submit">Cancel membership</button>
          </form>
        </div>
      ) : null}
      <h2 className="mt-12 font-serif text-3xl text-navy">History</h2>
      <div className="mt-4 overflow-x-auto border border-navy/10">
        <table className="ledger">
          <thead><tr><th>Plan</th><th>Status</th><th>Term</th></tr></thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id}>
                <td>{item.plan.name}</td>
                <td>{item.status.replaceAll("_", " ")}</td>
                <td>{item.startDate || "—"} to {item.endDate || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
