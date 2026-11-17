import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { addBusinessDays, businessToday } from "@/lib/dates";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Reports", robots: { index: false, follow: false } };

export default async function ReportsPage() {
  const today = businessToday();
  const monthStart = addBusinessDays(today, -29);
  const weekStart = addBusinessDays(today, -6);
  const [paid, active, cancelled, expired, meals, plans] = await Promise.all([
    prisma.payment.findMany({ where: { status: "PAID", createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "CANCELLED" } }),
    prisma.subscription.count({ where: { status: "EXPIRED" } }),
    prisma.mealSelection.groupBy({
      by: ["dishId"],
      where: { status: "CONFIRMED", date: { gte: monthStart, lte: today } },
      _count: { _all: true },
    }),
    prisma.subscription.groupBy({ by: ["planId"], where: { status: "ACTIVE" }, _count: { _all: true } }),
  ]);
  const dishes = await prisma.dish.findMany({ where: { id: { in: meals.map((meal) => meal.dishId) } } });
  const planRows = await prisma.plan.findMany({ where: { id: { in: plans.map((plan) => plan.planId) } } });
  const weekOrders = await prisma.mealSelection.count({ where: { status: "CONFIRMED", date: { gte: weekStart, lte: today } } });
  const monthOrders = meals.reduce((sum, meal) => sum + meal._count._all, 0);
  const revenue = paid.reduce((sum, payment) => sum + payment.amountPaise, 0);
  const retentionBase = active + cancelled + expired;
  return (
    <section>
      <h1 className="font-serif text-5xl text-navy">Reports</h1>
      <p className="mt-3 text-sm text-ink/70">Counts from the ledger for the trailing periods. Retention is a snapshot of active terms against cancelled and expired terms, not a cohort study.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          ["30-day revenue", formatINR(revenue)],
          ["Active terms", String(active)],
          ["Meals, 7 days", String(weekOrders)],
          ["Meals, 30 days", String(monthOrders)],
        ].map(([label, value]) => (
          <article key={label} className="border border-navy/10 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-golddeep">{label}</p>
            <p className="mt-2 font-serif text-3xl text-navy">{value}</p>
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm">Snapshot retention: {retentionBase ? `${Math.round((active / retentionBase) * 100)}% of recorded terms are active.` : "Not enough closed terms to describe retention."}</p>
      <h2 className="mt-8 font-serif text-3xl">Plan performance</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {plans.map((plan) => <li key={plan.planId}>{planRows.find((row) => row.id === plan.planId)?.name || "Plan"} · {plan._count._all} active</li>)}
        {!plans.length ? <li>No active memberships.</li> : null}
      </ul>
      <h2 className="mt-8 font-serif text-3xl">Meal demand, 30 days</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {meals.map((meal) => <li key={meal.dishId}>{dishes.find((dish) => dish.id === meal.dishId)?.name || "Dish"} · {meal._count._all}</li>)}
        {!meals.length ? <li>No confirmed meals in this window.</li> : null}
      </ul>
      <p className="mt-6 text-sm">Cancellations on record: {cancelled}. Expired terms: {expired}.</p>
    </section>
  );
}
