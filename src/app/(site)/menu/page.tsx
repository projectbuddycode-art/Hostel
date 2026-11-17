import type { Metadata } from "next";
import { PageIntro } from "@/components/editorial";
import { prisma } from "@/lib/db";
import { addBusinessDays, businessToday, formatDisplayDate } from "@/lib/dates";
import { parseList } from "@/lib/json";

export const metadata: Metadata = {
  title: "Menu",
  description: "The published breakfast, lunch and dinner menu at THE HOSTELS.",
  alternates: { canonical: "/menu" },
};

export default async function MenuPage() {
  const dishes = await prisma.dish.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const today = businessToday();
  const horizon = addBusinessDays(today, 6);
  const schedule = await prisma.menuSchedule.findMany({
    where: { date: { gte: today, lte: horizon }, available: true },
    include: { dish: true },
    orderBy: [{ date: "asc" }, { mealType: "asc" }],
  });
  const groups = ["breakfast", "lunch", "dinner"] as const;
  return (
    <>
      <PageIntro kicker="Menu" title="What the kitchen is cooking." lede="A dish appears on a day only when it has been scheduled. The list below is the standing repertoire." film="lunch" start={7.5} layout="split" />
      <section className="mx-auto max-w-page px-5 py-16 md:px-10">
        {groups.map((meal) => (
          <div key={meal} className="mt-12">
            <h2 className="font-serif text-4xl capitalize text-navy">{meal}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {dishes.filter((dish) => dish.mealType === meal).map((dish) => (
                <article key={dish.id} className="border border-navy/10 p-5">
                  <div>
                    <h3 className="font-serif text-2xl text-navy">{dish.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/75">{dish.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-golddeep">
                      {parseList(dish.allergens).length ? `Allergens: ${parseList(dish.allergens).join(", ")}` : "No listed allergens"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
        <h2 className="mt-16 font-serif text-4xl text-navy">The next seven days</h2>
        <div className="mt-6 overflow-x-auto border border-navy/10">
          <table className="ledger">
            <thead>
              <tr><th>Date</th><th>Service</th><th>Dish</th></tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.id}>
                  <td>{formatDisplayDate(row.date)}</td>
                  <td className="capitalize">{row.mealType}</td>
                  <td>{row.dish.name}</td>
                </tr>
              ))}
              {!schedule.length ? <tr><td colSpan={3}>No services have been scheduled yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
