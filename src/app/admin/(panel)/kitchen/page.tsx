import type { Metadata } from "next";
import { Notice } from "@/components/editorial";
import { prisma } from "@/lib/db";
import { businessToday } from "@/lib/dates";
import { kitchenBatchAction } from "@/server/actions";

export const metadata: Metadata = { title: "Kitchen", robots: { index: false, follow: false } };

export default async function KitchenPage({ searchParams }: { searchParams: Promise<{ date?: string; meal?: string; notice?: string; error?: string }> }) {
  const query = await searchParams;
  const date = query.date || businessToday();
  const meal = query.meal || "lunch";
  const orders = await prisma.order.findMany({
    where: { selection: { date, mealType: meal }, status: { in: ["CONFIRMED", "PREPARING", "PACKED"] } },
    include: { selection: { include: { user: { include: { profile: true } } } } },
  });
  const groups = new Map<string, { quantity: number; warnings: string[] }>();
  for (const order of orders) {
    const current = groups.get(order.dishName) || { quantity: 0, warnings: [] };
    current.quantity += 1;
    const allergy = order.allergyWarning || order.selection.user.profile?.allergies;
    if (allergy) current.warnings.push(`${order.selection.user.name}: ${allergy}${order.instructions ? ` · ${order.instructions}` : ""}`);
    groups.set(order.dishName, current);
  }
  return (
    <section>
      <Notice notice={query.notice} error={query.error} />
      <h1 className="font-serif text-5xl text-navy">Kitchen</h1>
      <form method="get" className="mt-6 flex flex-wrap gap-2">
        <input className="field max-w-[12rem]" type="date" name="date" defaultValue={date} aria-label="Date" />
        <select className="field max-w-[12rem]" name="meal" defaultValue={meal} aria-label="Meal"><option>breakfast</option><option>lunch</option><option>dinner</option></select>
        <button className="btn btn-navy" type="submit">Show production</button>
      </form>
      <div className="mt-6 space-y-4">
        {[...groups.entries()].map(([dishName, group]) => (
          <article key={dishName} className="border border-navy/10 p-4">
            <h2 className="font-serif text-3xl text-navy">{dishName}</h2>
            <p className="text-sm">{group.quantity} portions</p>
            {group.warnings.map((warning) => <p key={warning} className="mt-2 text-sm text-red-900">{warning}</p>)}
            <form action={kitchenBatchAction} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="mealType" value={meal} />
              <input type="hidden" name="dishName" value={dishName} />
              <input type="hidden" name="quantity" value={group.quantity} />
              <select className="field max-w-[12rem]" name="status" aria-label="Kitchen status"><option>PLANNED</option><option>IN_PREP</option><option>PACKED</option></select>
              <button className="btn btn-line-dark" type="submit">Save batch</button>
            </form>
          </article>
        ))}
        {!groups.size ? <p>No confirmed meals for this service.</p> : null}
      </div>
    </section>
  );
}
