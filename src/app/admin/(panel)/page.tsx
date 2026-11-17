import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { businessToday } from "@/lib/dates";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Desk", robots: { index: false, follow: false } };

export default async function AdminHome() {
  const today = businessToday();
  const [customers, active, orders, revenue] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.order.count({ where: { selection: { date: today }, status: { not: "CANCELLED" } } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amountPaise: true } }),
  ]);
  return (
    <section>
      <h1 className="font-serif text-5xl text-navy">Today’s house</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          ["Members", String(customers), "/admin/customers"],
          ["Active terms", String(active), "/admin/plans"],
          ["Meals today", String(orders), "/admin/kitchen"],
          ["Recorded revenue", formatINR(revenue._sum.amountPaise || 0), "/admin/payments"],
        ].map(([label, value, href]) => (
          <Link key={label} href={href} className="border border-navy/10 bg-white/60 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-golddeep">{label}</p>
            <p className="mt-2 font-serif text-3xl text-navy">{value}</p>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-sm text-ink/60">Figures come from the ledger. An empty kitchen means no confirmed meals, not a missing chart.</p>
    </section>
  );
}
