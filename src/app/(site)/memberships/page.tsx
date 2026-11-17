import type { Metadata } from "next";
import { PageIntro, PlanGrid } from "@/components/editorial";
import { publishedPlans } from "@/lib/catalog";
import { titleCase } from "@/lib/format";

export const metadata: Metadata = {
  title: "Memberships",
  description: "Essential, Complete, Signature and Family Table memberships for daily dining.",
  alternates: { canonical: "/memberships" },
};

export default async function MembershipsPage() {
  const plans = await publishedPlans();
  return (
    <>
      <PageIntro
        kicker="Memberships"
        title="A term, a credit, a table."
        lede="Every plan states what it includes. Nothing here is unlimited unless a future configuration says so in plain numbers."
        film="hero"
        start={8}
        position="center 45%"
      />
      <section className="px-5 py-16 md:px-14">
        <PlanGrid plans={plans} />
        <div className="mt-16 overflow-x-auto border border-navy/10">
          <table className="ledger min-w-[720px]">
            <thead>
              <tr>
                <th>Entitlement</th>
                {plans.map((plan) => <th key={plan.slug}>{plan.name}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Services</td>
                {plans.map((plan) => <td key={plan.slug}>{plan.mealTypes.map(titleCase).join(", ")}</td>)}
              </tr>
              <tr>
                <td>Meals on a day, at most</td>
                {plans.map((plan) => <td key={plan.slug}>{plan.mealsPerDay}</td>)}
              </tr>
              <tr>
                <td>Credits in the term</td>
                {plans.map((plan) => <td key={plan.slug}>{plan.purchasable ? plan.mealCredits : "Agreed privately"}</td>)}
              </tr>
              <tr>
                <td>Term</td>
                {plans.map((plan) => <td key={plan.slug}>{plan.durationDays} days</td>)}
              </tr>
              <tr>
                <td>Paid extras per meal</td>
                {plans.map((plan) => <td key={plan.slug}>{plan.maxAddons}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
