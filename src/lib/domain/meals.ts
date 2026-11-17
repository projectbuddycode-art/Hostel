import { cutoffDate, isDateKey } from "@/lib/dates";

export type MealDecision =
  | {
      ok: true;
      extraPaise: number;
      cutoffAt: Date;
      needsCredit: boolean;
      allergenOverlap: string[];
    }
  | { ok: false; code: string; message: string };

export type CatalogAddon = {
  id: string;
  pricePaise: number;
  active: boolean;
  mealTypes: string[];
  allowedOnPlan: boolean;
};

export type MealEvaluation = {
  now: Date;
  date: string;
  mealType: string;
  subscription: {
    status: string;
    startDate: string | null;
    endDate: string | null;
    pausedFrom: string | null;
    pausedUntil: string | null;
    mealsRemaining: number;
  };
  plan: {
    mealTypes: string[];
    mealsPerDay: number;
    maxAddons: number;
    allowSides: boolean;
    allowBread: boolean;
    allowInstructions: boolean;
    maxInstructionLength: number;
  };
  dish: {
    mealType: string;
    active: boolean;
    portionOptions: string[];
    spiceOptions: string[];
    sides: string[];
    breads: string[];
    allergens: string[];
    extraPaise: number;
  };
  schedule: { available: boolean; cutoffHours: number; serviceTime: string } | null;
  choice: {
    portion: string;
    spice: string;
    side: string;
    breadOrRice: string;
    instructions: string;
    addonIds: string[];
    acknowledgeAllergens: boolean;
  };
  profileAllergies: string[];
  addons: CatalogAddon[];
  existing: { status: string; orderStatus: string | null } | null;
  otherMealsOnDate: number;
};

const lockedOrderStatuses = ["PREPARING", "PACKED", "DISPATCHED", "DELIVERED", "FAILED"];

function deny(code: string, message: string): { ok: false; code: string; message: string } {
  return { ok: false, code, message };
}

function overlap(profile: string[], allergens: string[]): string[] {
  const needles = profile.map((item) => item.trim().toLowerCase()).filter(Boolean);
  return allergens
    .map((item) => item.trim())
    .filter((allergen) => {
      const value = allergen.toLowerCase();
      return needles.some((needle) => needle.includes(value) || value.includes(needle));
    });
}

export function evaluateMealSelection(input: MealEvaluation): MealDecision {
  if (!isDateKey(input.date)) return deny("DATE", "Choose a valid service date.");
  if (input.subscription.status !== "ACTIVE") {
    return deny("SUBSCRIPTION", "An active membership is required before a meal can be confirmed.");
  }
  if (!input.subscription.startDate || !input.subscription.endDate) {
    return deny("SUBSCRIPTION", "This membership does not have a service window yet.");
  }
  if (input.date < input.subscription.startDate || input.date > input.subscription.endDate) {
    return deny("WINDOW", "That date sits outside the current membership term.");
  }
  if (
    input.subscription.pausedFrom &&
    input.subscription.pausedUntil &&
    input.date >= input.subscription.pausedFrom &&
    input.date < input.subscription.pausedUntil
  ) {
    return deny("PAUSED", "The membership is paused on that date.");
  }
  if (!input.plan.mealTypes.includes(input.mealType)) {
    return deny("ENTITLEMENT", "This membership does not include that meal service.");
  }
  if (!input.schedule || !input.schedule.available || !input.dish.active) {
    return deny("UNAVAILABLE", "This dish is not available for that service.");
  }
  if (input.dish.mealType !== input.mealType) {
    return deny("MEAL_TYPE", "That dish belongs to a different service.");
  }
  const cutoffAt = cutoffDate(input.date, input.schedule.serviceTime, input.schedule.cutoffHours);
  if (input.now.getTime() >= cutoffAt.getTime()) {
    return deny("CUTOFF", "The customisation cutoff for this service has passed.");
  }
  if (input.existing && input.existing.orderStatus && lockedOrderStatuses.includes(input.existing.orderStatus)) {
    return deny("LOCKED", "This meal is already with the kitchen and can no longer be changed.");
  }
  if (!input.dish.portionOptions.includes(input.choice.portion)) {
    return deny("PORTION", "Choose one of the portions offered for this dish.");
  }
  if (!input.dish.spiceOptions.includes(input.choice.spice)) {
    return deny("SPICE", "Choose one of the spice levels offered for this dish.");
  }
  if (!input.plan.allowSides && input.choice.side.trim()) {
    return deny("SIDE", "This membership does not include a side selection.");
  }
  if (input.choice.side.trim() && !input.dish.sides.includes(input.choice.side)) {
    return deny("SIDE", "That side is not offered with this dish.");
  }
  if (!input.plan.allowBread && input.choice.breadOrRice.trim()) {
    return deny("BREAD", "This membership does not include a bread or rice selection.");
  }
  if (input.choice.breadOrRice.trim() && !input.dish.breads.includes(input.choice.breadOrRice)) {
    return deny("BREAD", "That bread or rice is not offered with this dish.");
  }
  const instructions = input.choice.instructions.trim();
  if (!input.plan.allowInstructions && instructions) {
    return deny("INSTRUCTIONS", "This membership does not include special instructions.");
  }
  if (instructions.length > input.plan.maxInstructionLength) {
    return deny("INSTRUCTIONS", `Instructions must stay within ${input.plan.maxInstructionLength} characters.`);
  }
  const addonIds = [...new Set(input.choice.addonIds)];
  if (addonIds.length > input.plan.maxAddons) {
    return deny("ADDONS", `This membership allows ${input.plan.maxAddons} paid extra${input.plan.maxAddons === 1 ? "" : "s"} per meal.`);
  }
  let extraPaise = input.dish.extraPaise;
  for (const id of addonIds) {
    const addon = input.addons.find((item) => item.id === id);
    if (!addon || !addon.active || !addon.allowedOnPlan || !addon.mealTypes.includes(input.mealType)) {
      return deny("ADDON", "One of the selected extras is not available on this membership.");
    }
    extraPaise += addon.pricePaise;
  }
  const allergenOverlap = overlap(input.profileAllergies, input.dish.allergens);
  if (allergenOverlap.length > 0 && !input.choice.acknowledgeAllergens) {
    return deny(
      "ALLERGEN",
      `Your profile lists an overlap with ${allergenOverlap.join(", ")}. Confirm that you still want this dish.`,
    );
  }
  const needsCredit = !input.existing || input.existing.status === "SKIPPED" || input.existing.status === "CANCELLED";
  if (needsCredit && input.subscription.mealsRemaining < 1) {
    return deny("CREDITS", "You have no meal credits remaining on this membership.");
  }
  if (needsCredit && input.otherMealsOnDate >= input.plan.mealsPerDay) {
    return deny("DAILY_CAP", "You have already used the meals allowed on this date.");
  }
  return { ok: true, extraPaise, cutoffAt, needsCredit, allergenOverlap };
}

export function evaluateSkip(input: {
  now: Date;
  status: string;
  orderStatus: string | null;
  cutoffAt: Date;
}): MealDecision | { ok: true; extraPaise: number; cutoffAt: Date; needsCredit: boolean; allergenOverlap: string[] } {
  if (input.status !== "CONFIRMED") {
    return deny("SKIP", "Only a confirmed meal can be skipped.");
  }
  if (input.orderStatus && lockedOrderStatuses.includes(input.orderStatus)) {
    return deny("LOCKED", "This meal is already with the kitchen and can no longer be skipped.");
  }
  if (input.now.getTime() >= input.cutoffAt.getTime()) {
    return deny("CUTOFF", "The cutoff for this service has passed.");
  }
  return { ok: true, extraPaise: 0, cutoffAt: input.cutoffAt, needsCredit: false, allergenOverlap: [] };
}

export function evaluatePause(input: {
  status: string;
  today: string;
  endDate: string | null;
  pausedUntil: string | null;
  fromDate: string;
  untilDate: string;
  minDays: number;
  maxDays: number;
}): { ok: true; days: number } | { ok: false; code: string; message: string } {
  if (input.status !== "ACTIVE" || !input.endDate) {
    return deny("SUBSCRIPTION", "Only an active membership can be paused.");
  }
  if (input.pausedUntil && input.pausedUntil > input.today) {
    return deny("PAUSE", "A pause is already scheduled. Resume it before choosing another.");
  }
  if (!isDateKey(input.fromDate) || !isDateKey(input.untilDate)) {
    return deny("DATE", "Choose valid pause dates.");
  }
  const tomorrow = nextDay(input.today);
  if (input.fromDate < tomorrow) {
    return deny("PAUSE", "A pause can begin tomorrow at the earliest, so today's kitchen is undisturbed.");
  }
  if (input.fromDate > input.endDate) {
    return deny("PAUSE", "The pause must begin during the current term.");
  }
  if (input.untilDate <= input.fromDate) {
    return deny("PAUSE", "The resume date must fall after the pause begins.");
  }
  const days = daysBetween(input.fromDate, input.untilDate);
  if (days < input.minDays || days > input.maxDays) {
    return deny("PAUSE", `This membership can be paused for ${input.minDays} to ${input.maxDays} days.`);
  }
  return { ok: true, days };
}

function nextDay(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + 1);
  return utc.toISOString().slice(0, 10);
}

function daysBetween(from: string, until: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [uy, um, ud] = until.split("-").map(Number);
  return Math.round((Date.UTC(uy, um - 1, ud) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}
