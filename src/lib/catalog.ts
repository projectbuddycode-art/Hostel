import { prisma } from "@/lib/db";
import { parseList } from "@/lib/json";
import type { PlanView } from "@/components/editorial";

export async function publishedPlans(): Promise<PlanView[]> {
  const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return plans.map((plan) => ({
    slug: plan.slug,
    name: plan.name,
    tagline: plan.tagline,
    description: plan.description,
    pricePaise: plan.pricePaise,
    priceNote: plan.priceNote,
    mealsPerDay: plan.mealsPerDay,
    mealTypes: parseList(plan.mealTypes),
    durationDays: plan.durationDays,
    mealCredits: plan.mealCredits,
    maxAddons: plan.maxAddons,
    purchasable: plan.purchasable,
    deliveryConditions: plan.deliveryConditions,
  }));
}
