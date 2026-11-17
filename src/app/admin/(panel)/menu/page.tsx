import type { Metadata } from "next";
import { Notice } from "@/components/editorial";
import { prisma } from "@/lib/db";
import { businessToday } from "@/lib/dates";
import { parseList } from "@/lib/json";
import { saveDishAction, scheduleDishAction } from "@/server/actions";

export const metadata: Metadata = { title: "Menu", robots: { index: false, follow: false } };

export default async function MenuAdmin({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const dishes = await prisma.dish.findMany({ orderBy: [{ mealType: "asc" }, { name: "asc" }] });
  const upcoming = await prisma.menuSchedule.findMany({
    where: { date: { gte: businessToday() } },
    include: { dish: true },
    orderBy: [{ date: "asc" }, { mealType: "asc" }],
    take: 40,
  });
  return (
    <section>
      <Notice notice={query.notice} error={query.error} />
      <h1 className="font-serif text-5xl text-navy">Menu</h1>
      <form action={saveDishAction} className="mt-6 grid gap-3 md:grid-cols-2">
        <h2 className="font-serif text-3xl md:col-span-2">New dish</h2>
        <input className="field" name="name" placeholder="Name" required aria-label="Dish name" />
        <select className="field" name="mealType" aria-label="Service"><option>breakfast</option><option>lunch</option><option>dinner</option></select>
        <textarea className="field md:col-span-2" name="description" placeholder="Description" aria-label="Description" />
        <input className="field" name="allergens" placeholder="Allergens, comma separated" aria-label="Allergens" />
        <input className="field" name="dietaryTags" placeholder="Dietary tags" aria-label="Dietary tags" />
        <input className="field" name="sides" placeholder="Sides" aria-label="Sides" />
        <input className="field" name="breads" placeholder="Breads or rice" aria-label="Breads" />
        <input className="field" name="extraRupees" type="number" min="0" defaultValue={0} aria-label="Extra rupees" />
        <input className="field" name="image" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Dish image" />
        <input type="hidden" name="portionOptions" value="regular, hearty" />
        <input type="hidden" name="spiceOptions" value="mild, medium, hot" />
        <label className="text-sm"><input type="checkbox" name="active" defaultChecked /> Available to schedule</label>
        <button className="btn btn-navy" type="submit">Save dish</button>
      </form>
      <form action={scheduleDishAction} className="mt-10 grid gap-3 md:grid-cols-4">
        <h2 className="font-serif text-3xl md:col-span-4">Schedule a service</h2>
        <input className="field" type="date" name="date" required aria-label="Date" />
        <select className="field" name="mealType" aria-label="Service"><option>breakfast</option><option>lunch</option><option>dinner</option></select>
        <select className="field" name="dishId" aria-label="Dish">{dishes.map((dish) => <option key={dish.id} value={dish.id}>{dish.mealType}: {dish.name}</option>)}</select>
        <input className="field" name="serviceTime" defaultValue="13:00" aria-label="Service time" />
        <input className="field" name="cutoffHours" type="number" defaultValue={12} aria-label="Cutoff hours" />
        <label className="text-sm"><input type="checkbox" name="available" defaultChecked /> Available</label>
        <button className="btn btn-navy" type="submit">Publish</button>
      </form>
      <div className="mt-8 overflow-x-auto border border-navy/10">
        <table className="ledger">
          <thead><tr><th>Dish</th><th>Service</th><th>Allergens</th><th>Active</th></tr></thead>
          <tbody>{dishes.map((dish) => <tr key={dish.id}><td>{dish.name}</td><td>{dish.mealType}</td><td>{parseList(dish.allergens).join(", ") || "—"}</td><td>{dish.active ? "Yes" : "No"}</td></tr>)}</tbody>
        </table>
      </div>
      <h2 className="mt-8 font-serif text-3xl">Upcoming schedule</h2>
      <div className="mt-3 overflow-x-auto border border-navy/10">
        <table className="ledger">
          <thead><tr><th>Date</th><th>Service</th><th>Dish</th><th>Cutoff</th></tr></thead>
          <tbody>{upcoming.map((row) => <tr key={row.id}><td>{row.date}</td><td>{row.mealType}</td><td>{row.dish.name}</td><td>{row.cutoffHours}h before {row.serviceTime}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
