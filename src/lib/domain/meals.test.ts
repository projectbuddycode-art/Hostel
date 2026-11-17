import { describe, expect, it } from "vitest";
import { evaluateMealSelection, evaluatePause, evaluateSkip, type MealEvaluation } from "@/lib/domain/meals";

function base(overrides: Partial<MealEvaluation> = {}): MealEvaluation {
  return {
    now: new Date("2026-11-20T08:00:00+05:30"),
    date: "2026-11-21",
    mealType: "lunch",
    subscription: {
      status: "ACTIVE",
      startDate: "2026-11-20",
      endDate: "2026-12-19",
      pausedFrom: null,
      pausedUntil: null,
      mealsRemaining: 2,
    },
    plan: {
      mealTypes: ["lunch", "dinner"],
      mealsPerDay: 2,
      maxAddons: 1,
      allowSides: true,
      allowBread: true,
      allowInstructions: true,
      maxInstructionLength: 80,
    },
    dish: {
      mealType: "lunch",
      active: true,
      portionOptions: ["regular", "hearty"],
      spiceOptions: ["mild", "medium", "hot"],
      sides: ["salad"],
      breads: ["rice"],
      allergens: ["dairy"],
      extraPaise: 0,
    },
    schedule: { available: true, cutoffHours: 12, serviceTime: "13:00" },
    choice: {
      portion: "regular",
      spice: "medium",
      side: "salad",
      breadOrRice: "rice",
      instructions: "",
      addonIds: [],
      acknowledgeAllergens: false,
    },
    profileAllergies: [],
    addons: [
      { id: "juice", pricePaise: 12000, active: true, mealTypes: ["lunch"], allowedOnPlan: true },
      { id: "cake", pricePaise: 9000, active: true, mealTypes: ["dinner"], allowedOnPlan: false },
    ],
    existing: null,
    otherMealsOnDate: 0,
    ...overrides,
  };
}

describe("meal entitlements", () => {
  it("accepts a valid lunch and prices add-ons from the catalogue", () => {
    const decision = evaluateMealSelection(
      base({ choice: { ...base().choice, addonIds: ["juice"], acknowledgeAllergens: true }, profileAllergies: ["dairy"] }),
    );
    expect(decision.ok).toBe(true);
    if (decision.ok) expect(decision.extraPaise).toBe(12000);
  });

  it("rejects a meal the plan does not include", () => {
    const decision = evaluateMealSelection(base({ mealType: "breakfast" }));
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.code).toBe("ENTITLEMENT");
  });

  it("rejects an unavailable dish and a mismatched service", () => {
    expect(evaluateMealSelection(base({ schedule: null })).ok).toBe(false);
    expect(evaluateMealSelection(base({ dish: { ...base().dish, mealType: "dinner" } })).ok).toBe(false);
  });

  it("blocks changes after the cutoff", () => {
    const decision = evaluateMealSelection(base({ now: new Date("2026-11-21T02:00:00+05:30") }));
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.code).toBe("CUTOFF");
  });

  it("blocks a new meal without credits but allows an edit", () => {
    const empty = base({ subscription: { ...base().subscription, mealsRemaining: 0 } });
    expect(evaluateMealSelection(empty).ok).toBe(false);
    const edit = base({
      subscription: { ...base().subscription, mealsRemaining: 0 },
      existing: { status: "CONFIRMED", orderStatus: "CONFIRMED" },
    });
    expect(evaluateMealSelection(edit).ok).toBe(true);
  });

  it("enforces the daily cap, pause window and add-on limit", () => {
    expect(evaluateMealSelection(base({ otherMealsOnDate: 2 })).ok).toBe(false);
    expect(
      evaluateMealSelection(
        base({
          subscription: { ...base().subscription, pausedFrom: "2026-11-21", pausedUntil: "2026-11-24" },
        }),
      ).ok,
    ).toBe(false);
    const tooMany = base({
      plan: { ...base().plan, maxAddons: 1 },
      choice: { ...base().choice, addonIds: ["juice", "juice"] },
    });
    expect(evaluateMealSelection(tooMany).ok).toBe(true);
    const foreign = base({ choice: { ...base().choice, addonIds: ["cake"] } });
    const foreignDecision = evaluateMealSelection(foreign);
    expect(foreignDecision.ok).toBe(false);
  });

  it("requires allergen acknowledgement and rejects locked kitchen orders", () => {
    const allergen = evaluateMealSelection(base({ profileAllergies: ["dairy"] }));
    expect(allergen.ok).toBe(false);
    if (!allergen.ok) expect(allergen.code).toBe("ALLERGEN");
    const locked = evaluateMealSelection(base({ existing: { status: "CONFIRMED", orderStatus: "PREPARING" } }));
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.code).toBe("LOCKED");
  });

  it("rejects instructions and sides the plan does not allow", () => {
    const notes = evaluateMealSelection(
      base({
        plan: { ...base().plan, allowInstructions: false },
        choice: { ...base().choice, instructions: "No onion" },
      }),
    );
    expect(notes.ok).toBe(false);
    const side = evaluateMealSelection(
      base({
        plan: { ...base().plan, allowSides: false },
        choice: { ...base().choice, side: "salad" },
      }),
    );
    expect(side.ok).toBe(false);
  });
});

describe("skip and pause", () => {
  it("allows a skip only before cutoff", () => {
    const cutoff = new Date("2026-11-21T01:00:00+05:30");
    expect(evaluateSkip({ now: new Date("2026-11-20T08:00:00+05:30"), status: "CONFIRMED", orderStatus: "CONFIRMED", cutoffAt: cutoff }).ok).toBe(true);
    expect(evaluateSkip({ now: new Date("2026-11-21T02:00:00+05:30"), status: "CONFIRMED", orderStatus: "CONFIRMED", cutoffAt: cutoff }).ok).toBe(false);
    expect(evaluateSkip({ now: new Date("2026-11-20T08:00:00+05:30"), status: "CONFIRMED", orderStatus: "PACKED", cutoffAt: cutoff }).ok).toBe(false);
  });

  it("limits pause length and start date", () => {
    expect(
      evaluatePause({
        status: "ACTIVE",
        today: "2026-11-20",
        endDate: "2026-12-19",
        pausedUntil: null,
        fromDate: "2026-11-21",
        untilDate: "2026-11-25",
        minDays: 3,
        maxDays: 14,
      }).ok,
    ).toBe(true);
    expect(
      evaluatePause({
        status: "ACTIVE",
        today: "2026-11-20",
        endDate: "2026-12-19",
        pausedUntil: null,
        fromDate: "2026-11-20",
        untilDate: "2026-11-24",
        minDays: 3,
        maxDays: 14,
      }).ok,
    ).toBe(false);
  });
});
