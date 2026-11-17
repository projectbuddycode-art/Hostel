import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/editorial";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { addBusinessDays, businessToday, cutoffDate, formatDisplayDate, formatWeekday, formatWhen } from "@/lib/dates";
import { parseList } from "@/lib/json";
import { formatINRExact } from "@/lib/format";
import { confirmMealAction, skipMealAction } from "@/server/actions";
import { syncMembership } from "@/server/services";

export const metadata: Metadata = { title: "Meals", robots: { index: false } };

export default async function MealsPage({ searchParams }: { searchParams: Promise<{ date?: string; notice?: string; error?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  const subscription = await syncMembership(prisma, user.id);
  if (!subscription?.startDate || !subscription.endDate) {
    return (
      <section>
        <h1 className="font-serif text-5xl text-navy">Meals</h1>
        <p className="mt-4">An active membership opens the calendar.</p>
        <Link href="/memberships" className="btn btn-navy mt-6">Explore Memberships</Link>
      </section>
    );
  }
  const plan = await prisma.plan.findUniqueOrThrow({
    where: { id: subscription.planId },
    include: { addons: { include: { addon: true } } },
  });
  const mealTypes = parseList(plan.mealTypes);
  const today = businessToday();
  const start = subscription.startDate > today ? subscription.startDate : today;
  const dates: string[] = [];
  for (let index = 0; index < 21; index += 1) {
    const date = addBusinessDays(start, index);
    if (date > subscription.endDate) break;
    dates.push(date);
  }
  const date = query.date && dates.includes(query.date) ? query.date : dates[0];
  const schedules = date
    ? await prisma.menuSchedule.findMany({
        where: { date, mealType: { in: mealTypes }, available: true, dish: { active: true } },
        include: { dish: true },
      })
    : [];
  const selections = date
    ? await prisma.mealSelection.findMany({
        where: { subscriptionId: subscription.id, date },
        include: { order: true, addons: true },
      })
    : [];
  const allergies = (user.profile?.allergies || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const paused = Boolean(subscription.pausedFrom && subscription.pausedUntil && date && date >= subscription.pausedFrom && date < subscription.pausedUntil);

  return (
    <section>
      <Notice notice={query.notice} error={query.error} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-golddeep">Calendar</p>
          <h1 className="mt-2 font-serif text-5xl text-navy">Choose the day.</h1>
        </div>
        <p className="text-sm">{subscription.mealsRemaining} credits remaining</p>
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {dates.map((item) => (
          <Link key={item} href={`/account/meals?date=${item}`} className={`min-w-24 border px-3 py-2 text-center text-sm ${item === date ? "border-navy bg-navy text-ivory" : "border-navy/15"}`}>
            <span className="block text-[0.65rem] uppercase tracking-[0.14em]">{formatWeekday(item)}</span>
            {formatDisplayDate(item).split(" ").slice(0, 2).join(" ")}
          </Link>
        ))}
      </div>
      {paused ? <p className="mt-6 border border-gold/50 px-4 py-3 text-sm">This date is inside a pause. Meals cannot be confirmed.</p> : null}
      {!dates.length ? <p className="mt-8">This term has no remaining dates.</p> : null}
      <div className="mt-8 space-y-10">
        {mealTypes.map((meal) => {
          const rows = schedules.filter((row) => row.mealType === meal);
          const selection = selections.find((item) => item.mealType === meal);
          const cutoff = rows[0] ? rows[0] : null;
          return (
            <section key={meal}>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-serif text-4xl capitalize text-navy">{meal}</h2>
                {cutoff && date ? <p className="text-xs uppercase tracking-[0.14em] text-golddeep">Cutoff {formatWhen(cutoffDate(date, cutoff.serviceTime, cutoff.cutoffHours))}</p> : null}
              </div>
              {selection?.status === "CONFIRMED" ? (
                <form action={skipMealAction} className="mt-3">
                  <input type="hidden" name="date" value={date} />
                  <input type="hidden" name="selectionId" value={selection.id} />
                  <button className="text-sm underline" type="submit">Skip this service and return the credit</button>
                </form>
              ) : null}
              {!rows.length ? <p className="mt-3 text-sm">The kitchen has not published this service.</p> : null}
              <div className="mt-4 grid gap-4">
                {rows.map((row) => {
                  const dishAllergens = parseList(row.dish.allergens);
                  const overlap = dishAllergens.filter((allergen) => allergies.some((item) => item.includes(allergen.toLowerCase()) || allergen.toLowerCase().includes(item)));
                  const selected = selection?.dishId === row.dish.id && selection.status === "CONFIRMED";
                  return (
                    <form key={row.id} action={confirmMealAction} className={`border p-4 ${selected ? "border-gold" : "border-navy/10"}`}>
                      <input type="hidden" name="date" value={date} />
                      <input type="hidden" name="mealType" value={meal} />
                      <input type="hidden" name="dishId" value={row.dish.id} />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-serif text-2xl text-navy">{row.dish.name}</h3>
                          <p className="mt-1 text-sm text-ink/70">{row.dish.description}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-golddeep">
                            {dishAllergens.length ? `Allergens: ${dishAllergens.join(", ")}` : "No listed allergens"}
                            {row.dish.extraPaise ? ` · ${formatINRExact(row.dish.extraPaise)}` : ""}
                          </p>
                        </div>
                        {selected ? <span className="text-xs uppercase tracking-[0.16em] text-sage">Confirmed</span> : null}
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="text-sm">Portion
                          <select className="field mt-1" name="portion" defaultValue={selected ? selection?.portion : parseList(row.dish.portionOptions)[0]}>
                            {parseList(row.dish.portionOptions).map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="text-sm">Spice
                          <select className="field mt-1" name="spice" defaultValue={selected ? selection?.spice : user.profile?.spicePreference || parseList(row.dish.spiceOptions)[0]}>
                            {parseList(row.dish.spiceOptions).map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </label>
                        {plan.allowSides && parseList(row.dish.sides).length ? (
                          <label className="text-sm">Side
                            <select className="field mt-1" name="side" defaultValue={selected ? selection?.side : ""}>
                              <option value="">No side</option>
                              {parseList(row.dish.sides).map((option) => <option key={option}>{option}</option>)}
                            </select>
                          </label>
                        ) : null}
                        {plan.allowBread && parseList(row.dish.breads).length ? (
                          <label className="text-sm">Bread or rice
                            <select className="field mt-1" name="breadOrRice" defaultValue={selected ? selection?.breadOrRice : ""}>
                              <option value="">No bread or rice</option>
                              {parseList(row.dish.breads).map((option) => <option key={option}>{option}</option>)}
                            </select>
                          </label>
                        ) : null}
                      </div>
                      {plan.maxAddons > 0 ? (
                        <fieldset className="mt-4">
                          <legend className="text-sm">Paid extras, up to {plan.maxAddons}</legend>
                          <div className="mt-2 space-y-2">
                            {plan.addons.filter((item) => item.addon.active && parseList(item.addon.mealTypes).includes(meal)).map((item) => (
                              <label key={item.addonId} className="flex items-center gap-2 text-sm">
                                <input type="checkbox" name="addonId" value={item.addonId} defaultChecked={selection?.addons.some((addon) => addon.addonId === item.addonId)} />
                                {item.addon.name} · {formatINRExact(item.addon.pricePaise)}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      ) : null}
                      {plan.allowInstructions ? (
                        <label className="mt-4 block text-sm">Note for the kitchen, up to {plan.maxInstructionLength} characters
                          <textarea className="field mt-1" name="instructions" maxLength={plan.maxInstructionLength} defaultValue={selected ? selection?.instructions : ""} />
                        </label>
                      ) : null}
                      {overlap.length ? (
                        <label className="mt-4 flex items-start gap-2 text-sm">
                          <input type="checkbox" name="acknowledgeAllergens" />
                          <span>Your profile overlaps with {overlap.join(", ")}. Confirm that you still want this dish. This is not a promise of an allergen-free kitchen.</span>
                        </label>
                      ) : null}
                      <button className="btn btn-navy mt-4" type="submit" disabled={paused}>{selected ? "Update meal" : "Confirm meal"}</button>
                    </form>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
