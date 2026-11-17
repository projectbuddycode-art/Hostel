import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { ServiceError, activatePaidSubscription, confirmMeal, markPaymentFailed, skipMeal } from "@/server/services";

let db: PrismaClient;
const databaseUrl = "file:" + path.join(process.cwd(), "prisma", "services-test.db").replace(/\\/g, "/");

beforeAll(async () => {
  for (const suffix of ["", "-journal"]) {
    const file = path.join(process.cwd(), "prisma", `services-test.db${suffix}`);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });
  process.env.DATABASE_URL = databaseUrl;
  const prismaModule = await import("@prisma/client");
  db = new prismaModule.PrismaClient();
});

afterAll(async () => {
  await db?.$disconnect();
});

async function world(credits = 1) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const user = await db.user.create({
    data: {
      email: `${stamp}@test.dev`,
      passwordHash: "hashed",
      name: "Member",
      phone: "9999999999",
      profile: { create: { allergies: "", dietaryPreferences: "[]" } },
      addresses: {
        create: { line1: "12 Residency Road", city: "Bengaluru", postalCode: "560001", zone: "Central", isDefault: true },
      },
    },
    include: { addresses: true },
  });
  const plan = await db.plan.create({
    data: {
      slug: `plan-${stamp}`,
      name: "Test",
      tagline: "Test",
      description: "Test",
      pricePaise: 800000,
      mealsPerDay: 1,
      mealTypes: '["lunch"]',
      mealCredits: credits,
      maxAddons: 1,
      allowSides: true,
      allowBread: true,
      allowInstructions: true,
      maxInstructionLength: 80,
      deliveryConditions: "",
      cancellationRules: "",
      upgradeNotes: "",
    },
  });
  const dish = await db.dish.create({
    data: {
      name: `Dal ${stamp}`,
      description: "Dal",
      mealType: "lunch",
      allergens: "[]",
      dietaryTags: '["vegetarian"]',
      sides: '["salad"]',
      breads: '["rice"]',
    },
  });
  const subscription = await db.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      addressId: user.addresses[0].id,
      status: "ACTIVE",
      startDate: "2026-11-20",
      endDate: "2026-12-19",
      pricePaise: 800000,
      creditSnapshot: credits,
      durationSnapshot: 30,
      mealsRemaining: credits,
    },
  });
  await db.menuSchedule.create({
    data: { date: "2026-11-21", mealType: "lunch", dishId: dish.id, cutoffHours: 12, serviceTime: "13:00" },
  });
  return { user, dish, subscription };
}

describe("meal ledger", () => {
  it("spends one credit, blocks a second parallel order, and returns the credit on skip", async () => {
    const { user, dish, subscription } = await world(1);
    const input = {
      userId: user.id,
      date: "2026-11-21",
      mealType: "lunch",
      dishId: dish.id,
      portion: "regular",
      spice: "medium",
      side: "",
      breadOrRice: "",
      instructions: "",
      addonIds: [] as string[],
      acknowledgeAllergens: false,
      now: new Date("2026-11-20T09:00:00+05:30"),
    };
    const results = await Promise.allSettled([confirmMeal(db, input), confirmMeal(db, input)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const after = await db.subscription.findUniqueOrThrow({ where: { id: subscription.id } });
    expect(after.mealsRemaining).toBe(0);
    expect(await db.mealSelection.count({ where: { subscriptionId: subscription.id, status: "CONFIRMED" } })).toBe(1);
    const selection = await db.mealSelection.findFirstOrThrow({ where: { subscriptionId: subscription.id } });
    await skipMeal(db, { userId: user.id, selectionId: selection.id, now: input.now });
    const restored = await db.subscription.findUniqueOrThrow({ where: { id: subscription.id } });
    expect(restored.mealsRemaining).toBe(1);
    await expect(confirmMeal(db, { ...input, now: new Date("2026-11-21T06:00:00+05:30") })).rejects.toBeInstanceOf(ServiceError);
  });
});

describe("subscription activation", () => {
  it("activates only after a verified transition and ignores a duplicate capture", async () => {
    const { user } = await world(0);
    const plan = await db.plan.findFirstOrThrow();
    const pending = await db.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: "PENDING_PAYMENT",
        pricePaise: 800000,
        creditSnapshot: 26,
        durationSnapshot: 30,
      },
    });
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        subscriptionId: pending.id,
        provider: "RAZORPAY",
        status: "CREATED",
        amountPaise: 800000,
        idempotencyKey: `pay-${pending.id}`,
      },
    });
    const first = await activatePaidSubscription(db, { paymentId: payment.id, razorpayPaymentId: "pay_test" });
    const second = await activatePaidSubscription(db, { paymentId: payment.id, razorpayPaymentId: "pay_test" });
    expect(first.ok && first.already).toBe(false);
    expect(second.ok && second.already).toBe(true);
    const active = await db.subscription.findUniqueOrThrow({ where: { id: pending.id } });
    expect(active.status).toBe("ACTIVE");
    expect(active.mealsRemaining).toBe(26);
    const again = await db.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(again.status).toBe("PAID");
  });

  it("leaves a membership pending when payment fails", async () => {
    const { user } = await world(0);
    const plan = await db.plan.findFirstOrThrow();
    const pending = await db.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: "PENDING_PAYMENT",
        pricePaise: 800000,
        creditSnapshot: 26,
        durationSnapshot: 30,
      },
    });
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        subscriptionId: pending.id,
        provider: "RAZORPAY",
        status: "CREATED",
        amountPaise: 800000,
        idempotencyKey: `fail-${pending.id}`,
      },
    });
    await markPaymentFailed(db, { paymentId: payment.id, reason: "Card declined" });
    await markPaymentFailed(db, { paymentId: payment.id, reason: "Card declined" });
    const stored = await db.payment.findUniqueOrThrow({ where: { id: payment.id } });
    const membership = await db.subscription.findUniqueOrThrow({ where: { id: pending.id } });
    expect(stored.status).toBe("FAILED");
    expect(membership.status).toBe("PENDING_PAYMENT");
  });
});
