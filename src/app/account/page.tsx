import type { Metadata } from "next";
import Link from "next/link";
import { Film } from "@/components/film";
import { Notice } from "@/components/editorial";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { businessToday, formatDisplayDate } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { syncMembership } from "@/server/services";

export const metadata: Metadata = { title: "Your table", robots: { index: false } };

export default async function AccountHome({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  const subscription = await syncMembership(prisma, user.id);
  const today = businessToday();
  const upcoming = await prisma.order.findMany({
    where: { userId: user.id, status: { notIn: ["CANCELLED", "FAILED"] }, selection: { date: { gte: today } } },
    include: { selection: true },
    orderBy: { selection: { date: "asc" } },
    take: 4,
  });
  return (
    <section>
      <Notice notice={query.notice} error={query.error} />
      <div className="relative mb-8 h-48 overflow-hidden">
        <Film name="hero" start={8.4} fill label="The dining table" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/75 to-transparent" />
        <p className="relative z-10 flex h-full items-end p-6 font-serif text-4xl text-ivory">Your table</p>
      </div>
      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-golddeep">Overview</p>
      <h1 className="mt-2 font-serif text-5xl text-navy">Good day, {user.name.split(" ")[0]}.</h1>
      {subscription ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="border border-navy/10 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-golddeep">Membership</p>
            <p className="mt-2 font-serif text-3xl text-navy">{subscription.plan.name}</p>
            <p className="mt-2 text-sm">{subscription.startDate ? formatDisplayDate(subscription.startDate) : ""} – {subscription.endDate ? formatDisplayDate(subscription.endDate) : ""}</p>
          </article>
          <article className="border border-navy/10 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-golddeep">Credits left</p>
            <p className="mt-2 font-serif text-3xl text-navy">{subscription.mealsRemaining}</p>
          </article>
          <article className="border border-navy/10 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-golddeep">Next meal</p>
            <p className="mt-2 font-serif text-3xl text-navy">{upcoming[0] ? upcoming[0].dishName : "Unset"}</p>
            <p className="mt-2 text-sm">{upcoming[0] ? `${upcoming[0].selection.mealType} · ${formatDisplayDate(upcoming[0].selection.date)}` : "Choose from the calendar."}</p>
          </article>
        </div>
      ) : (
        <div className="mt-8 border border-navy/10 p-6">
          <p>You do not have an active membership.</p>
          <Link href="/memberships" className="btn btn-navy mt-4">Explore Memberships</Link>
        </div>
      )}
      <div className="mt-8 flex gap-3">
        <Link href="/account/meals" className="btn btn-navy">Customise meals</Link>
        <Link href="/account/membership" className="btn btn-line-dark">Membership</Link>
      </div>
      {subscription ? <p className="mt-6 text-sm text-ink/60">Term value on record: {formatINR(subscription.pricePaise)}.</p> : null}
    </section>
  );
}
