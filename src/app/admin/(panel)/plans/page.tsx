import type { Metadata } from "next";
import type { Addon, Plan } from "@prisma/client";
import { Notice } from "@/components/editorial";
import { prisma } from "@/lib/db";
import { parseList } from "@/lib/json";
import { formatINR } from "@/lib/format";
import { saveAddonAction, savePlanAction } from "@/server/actions";

export const metadata: Metadata = { title: "Membership plans", robots: { index: false, follow: false } };

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const plans = await prisma.plan.findMany({ include: { addons: true }, orderBy: { sortOrder: "asc" } });
  const addons = await prisma.addon.findMany({ orderBy: { name: "asc" } });
  return (
    <section>
      <Notice notice={query.notice} error={query.error} />
      <h1 className="font-serif text-5xl text-navy">Memberships</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">The public site shows these configured prices and entitlements. Do not describe a plan as unlimited unless the numbers say so.</p>
      <div className="mt-8 space-y-4">
        {plans.map((plan) => (
          <details key={plan.id} className="border border-navy/10 bg-white/50 p-4">
            <summary className="cursor-pointer font-serif text-2xl text-navy">{plan.name} · {plan.purchasable ? formatINR(plan.pricePaise) : "By arrangement"}</summary>
            <PlanFields plan={plan} addons={addons} />
          </details>
        ))}
        <details className="border border-navy/10 p-4">
          <summary className="cursor-pointer font-serif text-2xl">New membership</summary>
          <PlanFields addons={addons} />
        </details>
      </div>
      <form action={saveAddonAction} className="mt-10 grid max-w-xl gap-3">
        <h2 className="font-serif text-3xl text-navy">New paid extra</h2>
        <input className="field" name="name" placeholder="Name" required aria-label="Extra name" />
        <input className="field" name="description" placeholder="Description" aria-label="Description" />
        <input className="field" name="priceRupees" type="number" min="0" step="1" placeholder="Price in rupees" required aria-label="Price" />
        <div className="flex gap-4 text-sm">{["breakfast", "lunch", "dinner"].map((meal) => <label key={meal}><input type="checkbox" name="mealType" value={meal} defaultChecked /> {meal}</label>)}</div>
        <button className="btn btn-navy" type="submit">Save extra</button>
      </form>
    </section>
  );
}

function PlanFields({ plan, addons }: { plan?: Plan & { addons: { addonId: string }[] }; addons: Addon[] }) {
  const meals = new Set(plan ? parseList(plan.mealTypes) : ["lunch"]);
  const linked = new Set(plan?.addons.map((item) => item.addonId) || []);
  return (
    <form action={savePlanAction} className="mt-4 grid gap-3 md:grid-cols-2">
      {plan ? <input type="hidden" name="id" value={plan.id} /> : null}
      <label className="text-sm">Name<input className="field mt-1" name="name" defaultValue={plan?.name} required /></label>
      <label className="text-sm">Slug<input className="field mt-1" name="slug" defaultValue={plan?.slug} /></label>
      <label className="text-sm md:col-span-2">Tagline<input className="field mt-1" name="tagline" defaultValue={plan?.tagline} /></label>
      <label className="text-sm md:col-span-2">Description<textarea className="field mt-1" name="description" defaultValue={plan?.description} /></label>
      <label className="text-sm">Price in rupees<input className="field mt-1" name="priceRupees" type="number" min="0" defaultValue={plan ? plan.pricePaise / 100 : 0} /></label>
      <label className="text-sm">Sort<input className="field mt-1" name="sortOrder" type="number" defaultValue={plan?.sortOrder ?? 0} /></label>
      <label className="text-sm md:col-span-2">Price note<textarea className="field mt-1" name="priceNote" defaultValue={plan?.priceNote} /></label>
      <label className="text-sm">Meals per day<input className="field mt-1" name="mealsPerDay" type="number" defaultValue={plan?.mealsPerDay ?? 1} /></label>
      <label className="text-sm">Credits<input className="field mt-1" name="mealCredits" type="number" defaultValue={plan?.mealCredits ?? 0} /></label>
      <label className="text-sm">Term days<input className="field mt-1" name="durationDays" type="number" defaultValue={plan?.durationDays ?? 30} /></label>
      <label className="text-sm">Max extras<input className="field mt-1" name="maxAddons" type="number" defaultValue={plan?.maxAddons ?? 1} /></label>
      <label className="text-sm">Note length<input className="field mt-1" name="maxInstructionLength" type="number" defaultValue={plan?.maxInstructionLength ?? 80} /></label>
      <label className="text-sm">Pause min<input className="field mt-1" name="pauseMinDays" type="number" defaultValue={plan?.pauseMinDays ?? 3} /></label>
      <label className="text-sm">Pause max<input className="field mt-1" name="pauseMaxDays" type="number" defaultValue={plan?.pauseMaxDays ?? 14} /></label>
      <fieldset className="text-sm md:col-span-2">
        <legend>Services</legend>
        <div className="mt-2 flex gap-4">{["breakfast", "lunch", "dinner"].map((meal) => <label key={meal}><input type="checkbox" name="mealType" value={meal} defaultChecked={meals.has(meal)} /> {meal}</label>)}</div>
      </fieldset>
      <div className="flex flex-wrap gap-4 text-sm md:col-span-2">
        <label><input type="checkbox" name="allowSides" defaultChecked={plan?.allowSides ?? false} /> Sides</label>
        <label><input type="checkbox" name="allowBread" defaultChecked={plan?.allowBread ?? false} /> Bread or rice</label>
        <label><input type="checkbox" name="allowInstructions" defaultChecked={plan?.allowInstructions ?? true} /> Instructions</label>
        <label><input type="checkbox" name="purchasable" defaultChecked={plan?.purchasable ?? true} /> Online checkout</label>
        <label><input type="checkbox" name="active" defaultChecked={plan?.active ?? true} /> Visible</label>
      </div>
      <label className="text-sm md:col-span-2">Delivery<textarea className="field mt-1" name="deliveryConditions" defaultValue={plan?.deliveryConditions} /></label>
      <label className="text-sm md:col-span-2">Cancellation<textarea className="field mt-1" name="cancellationRules" defaultValue={plan?.cancellationRules} /></label>
      <label className="text-sm md:col-span-2">Upgrade<textarea className="field mt-1" name="upgradeNotes" defaultValue={plan?.upgradeNotes} /></label>
      <fieldset className="text-sm md:col-span-2">
        <legend>Extras allowed on this plan</legend>
        <div className="mt-2 space-y-1">{addons.map((addon) => <label key={addon.id} className="block"><input type="checkbox" name="addonId" value={addon.id} defaultChecked={linked.has(addon.id)} /> {addon.name}</label>)}</div>
      </fieldset>
      <button className="btn btn-navy" type="submit">Save membership</button>
    </form>
  );
}
