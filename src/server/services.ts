import { randomBytes, createHash } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { addBusinessDays, businessToday, diffBusinessDays } from "@/lib/dates";
import { parseList } from "@/lib/json";
import { evaluateMealSelection, evaluatePause, evaluateSkip } from "@/lib/domain/meals";
import { nextPaymentTransition, refundableBalance } from "@/lib/domain/payments";
import { notify } from "@/lib/notifications/dispatch";

export class ServiceError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function snapshotAddress(address: {
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  zone: string;
} | null): string {
  if (!address) return "";
  return [address.label, address.line1, address.line2, `${address.city} ${address.postalCode}`, address.state, address.zone]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

export async function syncMembership(db: PrismaClient, userId: string) {
  const today = businessToday();
  await db.subscription.updateMany({
    where: { userId, status: "ACTIVE", endDate: { lt: today } },
    data: { status: "EXPIRED" },
  });
  const active = await db.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { plan: true, address: true },
    orderBy: { createdAt: "desc" },
  });
  if (active?.pausedUntil && active.pausedUntil <= today) {
    await db.subscription.update({
      where: { id: active.id },
      data: { pausedFrom: null, pausedUntil: null },
    });
    active.pausedFrom = null;
    active.pausedUntil = null;
  }
  return active;
}

export async function confirmMeal(
  db: PrismaClient,
  input: {
    userId: string;
    date: string;
    mealType: string;
    dishId: string;
    portion: string;
    spice: string;
    side: string;
    breadOrRice: string;
    instructions: string;
    addonIds: string[];
    acknowledgeAllergens: boolean;
    now?: Date;
  },
) {
  const now = input.now ?? new Date();
  const subscription = await syncMembership(db, input.userId);
  if (!subscription) throw new ServiceError("SUBSCRIPTION", "An active membership is required before a meal can be confirmed.");
  const full = await db.subscription.findUniqueOrThrow({
    where: { id: subscription.id },
    include: { plan: { include: { addons: true } }, address: true, user: { include: { profile: true } } },
  });
  const dish = await db.dish.findUnique({ where: { id: input.dishId } });
  if (!dish) throw new ServiceError("UNAVAILABLE", "This dish is not available for that service.");
  const schedule = await db.menuSchedule.findUnique({
    where: { date_mealType_dishId: { date: input.date, mealType: input.mealType, dishId: input.dishId } },
  });
  const existing = await db.mealSelection.findUnique({
    where: {
      subscriptionId_date_mealType: { subscriptionId: full.id, date: input.date, mealType: input.mealType },
    },
    include: { order: true },
  });
  const otherMealsOnDate = await db.mealSelection.count({
    where: {
      subscriptionId: full.id,
      date: input.date,
      status: "CONFIRMED",
      ...(existing ? { NOT: { id: existing.id } } : {}),
    },
  });
  const catalog = await db.addon.findMany({ where: { id: { in: input.addonIds.length ? input.addonIds : ["__none__"] } } });
  const allowed = new Set(full.plan.addons.map((item) => item.addonId));
  const profileAllergies = (full.user.profile?.allergies || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const decision = evaluateMealSelection({
    now,
    date: input.date,
    mealType: input.mealType,
    subscription: full,
    plan: { ...full.plan, mealTypes: parseList(full.plan.mealTypes) },
    dish: {
      ...dish,
      portionOptions: parseList(dish.portionOptions),
      spiceOptions: parseList(dish.spiceOptions),
      sides: parseList(dish.sides),
      breads: parseList(dish.breads),
      allergens: parseList(dish.allergens),
    },
    schedule,
    choice: input,
    profileAllergies,
    addons: catalog.map((addon) => ({
      id: addon.id,
      pricePaise: addon.pricePaise,
      active: addon.active,
      mealTypes: parseList(addon.mealTypes),
      allowedOnPlan: allowed.has(addon.id),
    })),
    existing: existing ? { status: existing.status, orderStatus: existing.order?.status || null } : null,
    otherMealsOnDate,
  });
  if (!decision.ok) throw new ServiceError(decision.code, decision.message);
  if (!full.address) throw new ServiceError("ADDRESS", "Add a delivery address before confirming a meal.");

  try {
    const selectionId = await db.$transaction(async (tx) => {
      if (decision.needsCredit) {
        const updated = await tx.subscription.updateMany({
          where: { id: full.id, status: "ACTIVE", mealsRemaining: { gte: 1 } },
          data: { mealsRemaining: { decrement: 1 } },
        });
        if (updated.count !== 1) {
          throw new ServiceError("CREDITS", "You have no meal credits remaining on this membership.");
        }
      }
      const data = {
        dishId: dish.id,
        side: input.side.trim(),
        breadOrRice: input.breadOrRice.trim(),
        portion: input.portion,
        spice: input.spice,
        instructions: input.instructions.trim(),
        status: "CONFIRMED",
        extraPaise: decision.extraPaise,
        cutoffAt: decision.cutoffAt,
      };
      const selection = existing
        ? await tx.mealSelection.update({ where: { id: existing.id }, data })
        : await tx.mealSelection.create({
            data: {
              ...data,
              subscriptionId: full.id,
              userId: input.userId,
              date: input.date,
              mealType: input.mealType,
            },
          });
      await tx.mealSelectionAddon.deleteMany({ where: { selectionId: selection.id } });
      for (const addonId of [...new Set(input.addonIds)]) {
        const addon = catalog.find((item) => item.id === addonId);
        if (!addon) continue;
        await tx.mealSelectionAddon.create({
          data: { selectionId: selection.id, addonId: addon.id, pricePaise: addon.pricePaise },
        });
      }
      const orderData = {
        status: "CONFIRMED",
        requestStatus: input.instructions.trim() ? "PENDING" : "NONE",
        dishName: dish.name,
        addressSnapshot: snapshotAddress(full.address),
        zone: full.address?.zone || "",
        allergenSnapshot: dish.allergens,
        allergyWarning: decision.allergenOverlap.length
          ? `Member acknowledged: ${decision.allergenOverlap.join(", ")}`
          : "",
        instructions: input.instructions.trim(),
        totalPaise: decision.extraPaise,
      };
      const order = existing?.order
        ? await tx.order.update({ where: { id: existing.order.id }, data: orderData })
        : await tx.order.create({ data: { ...orderData, userId: input.userId, selectionId: selection.id } });
      await tx.deliveryEvent.create({
        data: {
          orderId: order.id,
          status: "CONFIRMED",
          note: existing ? "Meal updated by member" : "Meal confirmed",
        },
      });
      return selection.id;
    });
    await notify(db, {
      userId: input.userId,
      type: "order",
      title: "Meal confirmed",
      body: `${dish.name} is confirmed for ${input.mealType} on ${input.date}.`,
      email: full.user.email,
      phone: full.user.phone,
      whatsappOptIn: full.user.profile?.whatsappOptIn,
      whatsappTemplate: "order",
    });
    return selectionId;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    if (isUnique(error)) throw new ServiceError("DUPLICATE", "This service already has a selection.");
    throw error;
  }
}

export async function skipMeal(db: PrismaClient, input: { userId: string; selectionId: string; now?: Date }) {
  const now = input.now ?? new Date();
  const selection = await db.mealSelection.findFirst({
    where: { id: input.selectionId, userId: input.userId },
    include: { order: true, user: { include: { profile: true } } },
  });
  if (!selection) throw new ServiceError("MISSING", "Meal not found.");
  const decision = evaluateSkip({
    now,
    status: selection.status,
    orderStatus: selection.order?.status || null,
    cutoffAt: selection.cutoffAt,
  });
  if (!decision.ok) throw new ServiceError(decision.code, decision.message);
  await db.$transaction(async (tx) => {
    const updated = await tx.mealSelection.updateMany({
      where: { id: selection.id, status: "CONFIRMED" },
      data: { status: "SKIPPED" },
    });
    if (updated.count !== 1) throw new ServiceError("SKIP", "This meal can no longer be skipped.");
    await tx.subscription.update({
      where: { id: selection.subscriptionId },
      data: { mealsRemaining: { increment: 1 } },
    });
    if (selection.order) {
      await tx.order.update({ where: { id: selection.order.id }, data: { status: "CANCELLED" } });
      await tx.deliveryEvent.create({
        data: { orderId: selection.order.id, status: "CANCELLED", note: "Skipped by member before cutoff" },
      });
    }
  });
  await notify(db, {
    userId: selection.userId,
    type: "meal",
    title: "Meal skipped",
    body: `The ${selection.mealType} on ${selection.date} has been skipped and the credit returned.`,
    email: selection.user.email,
    phone: selection.user.phone,
    whatsappOptIn: selection.user.profile?.whatsappOptIn,
    whatsappTemplate: "meal",
  });
}

export async function pauseMembership(
  db: PrismaClient,
  input: { userId: string; fromDate: string; untilDate: string },
) {
  const subscription = await syncMembership(db, input.userId);
  if (!subscription) throw new ServiceError("SUBSCRIPTION", "Only an active membership can be paused.");
  const decision = evaluatePause({
    status: subscription.status,
    today: businessToday(),
    endDate: subscription.endDate,
    pausedUntil: subscription.pausedUntil,
    fromDate: input.fromDate,
    untilDate: input.untilDate,
    minDays: subscription.plan.pauseMinDays,
    maxDays: subscription.plan.pauseMaxDays,
  });
  if (!decision.ok) throw new ServiceError(decision.code, decision.message);
  const endDate = addBusinessDays(subscription.endDate || input.untilDate, decision.days);
  await db.subscription.update({
    where: { id: subscription.id },
    data: { pausedFrom: input.fromDate, pausedUntil: input.untilDate, endDate },
  });
}

export async function resumeMembership(db: PrismaClient, userId: string) {
  const subscription = await syncMembership(db, userId);
  if (!subscription?.pausedFrom || !subscription.pausedUntil || !subscription.endDate) {
    throw new ServiceError("PAUSE", "This membership is not paused.");
  }
  const today = businessToday();
  let unused = 0;
  if (today <= subscription.pausedFrom) unused = diffBusinessDays(subscription.pausedFrom, subscription.pausedUntil);
  else if (today < subscription.pausedUntil) unused = diffBusinessDays(today, subscription.pausedUntil);
  await db.subscription.update({
    where: { id: subscription.id },
    data: {
      pausedFrom: null,
      pausedUntil: null,
      endDate: addBusinessDays(subscription.endDate, -unused),
    },
  });
}

export async function cancelMembership(db: PrismaClient, userId: string) {
  const subscription = await syncMembership(db, userId);
  if (!subscription) throw new ServiceError("SUBSCRIPTION", "There is no active membership to cancel.");
  const today = businessToday();
  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.subscription.update({ where: { id: subscription.id }, data: { status: "CANCELLED" } });
    const selections = await tx.mealSelection.findMany({
      where: { subscriptionId: subscription.id, status: "CONFIRMED", date: { gte: today } },
      include: { order: true },
    });
    for (const selection of selections) {
      if (selection.cutoffAt.getTime() <= now.getTime()) continue;
      await tx.mealSelection.update({ where: { id: selection.id }, data: { status: "CANCELLED" } });
      if (selection.order && ["CONFIRMED", "PREPARING"].includes(selection.order.status)) {
        await tx.order.update({ where: { id: selection.order.id }, data: { status: "CANCELLED" } });
        await tx.deliveryEvent.create({
          data: { orderId: selection.order.id, status: "CANCELLED", note: "Membership cancelled before cutoff" },
        });
      }
    }
  });
}

export async function beginCheckout(db: PrismaClient, input: { userId: string; planSlug: string; addressId: string }) {
  const plan = await db.plan.findUnique({ where: { slug: input.planSlug } });
  if (!plan || !plan.active || !plan.purchasable || plan.pricePaise <= 0) {
    throw new ServiceError("PLAN", "This membership is not available for online checkout.");
  }
  const address = await db.address.findFirst({ where: { id: input.addressId, userId: input.userId } });
  if (!address) throw new ServiceError("ADDRESS", "Choose a delivery address before checkout.");
  const reusable = await db.subscription.findFirst({
    where: { userId: input.userId, planId: plan.id, status: "PENDING_PAYMENT" },
    include: { payments: true },
    orderBy: { createdAt: "desc" },
  });
  if (reusable) {
    await db.subscription.update({ where: { id: reusable.id }, data: { addressId: address.id, pricePaise: plan.pricePaise } });
    const openPayment = reusable.payments.find((payment) => payment.status === "CREATED");
    if (openPayment) return { subscriptionId: reusable.id, paymentId: openPayment.id };
    const payment = await db.payment.create({
      data: {
        userId: input.userId,
        subscriptionId: reusable.id,
        provider: "RAZORPAY",
        status: "CREATED",
        amountPaise: plan.pricePaise,
        idempotencyKey: `checkout_${reusable.id}_${randomBytes(6).toString("hex")}`,
      },
    });
    return { subscriptionId: reusable.id, paymentId: payment.id };
  }
  const subscription = await db.subscription.create({
    data: {
      userId: input.userId,
      planId: plan.id,
      addressId: address.id,
      status: "PENDING_PAYMENT",
      pricePaise: plan.pricePaise,
      creditSnapshot: plan.mealCredits,
      durationSnapshot: plan.durationDays,
      mealsRemaining: 0,
    },
  });
  const payment = await db.payment.create({
    data: {
      userId: input.userId,
      subscriptionId: subscription.id,
      provider: "RAZORPAY",
      status: "CREATED",
      amountPaise: plan.pricePaise,
      idempotencyKey: `checkout_${subscription.id}_${randomBytes(6).toString("hex")}`,
    },
  });
  return { subscriptionId: subscription.id, paymentId: payment.id };
}

export async function activatePaidSubscription(
  db: PrismaClient,
  input: { paymentId: string; razorpayPaymentId?: string; note?: string; now?: Date },
) {
  const now = input.now ?? new Date();
  const result = await db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: input.paymentId } });
    if (!payment || !payment.subscriptionId) return { ok: false as const, error: "Payment not found." };
    const transition = nextPaymentTransition(payment.status, "captured");
    if (!transition.apply) return { ok: true as const, already: true, userId: payment.userId };
    const subscription = await tx.subscription.findUnique({
      where: { id: payment.subscriptionId },
      include: { plan: true, user: { include: { profile: true } } },
    });
    if (!subscription) return { ok: false as const, error: "Membership not found." };
    if (subscription.status === "ACTIVE") return { ok: true as const, already: true, userId: payment.userId };
    if (subscription.status !== "PENDING_PAYMENT") {
      return { ok: false as const, error: "This membership can no longer be activated from this payment." };
    }
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: "CREATED" },
      data: {
        status: "PAID",
        razorpayPaymentId: input.razorpayPaymentId || payment.razorpayPaymentId,
        note: input.note || payment.note,
        failureReason: "",
      },
    });
    if (claimed.count !== 1) return { ok: true as const, already: true, userId: payment.userId };
    const start = addBusinessDays(businessToday(now), 1);
    const end = addBusinessDays(start, Math.max(subscription.durationSnapshot, 1) - 1);
    const previous = await tx.subscription.findMany({
      where: { userId: subscription.userId, status: "ACTIVE", NOT: { id: subscription.id } },
    });
    for (const old of previous) {
      await tx.subscription.update({ where: { id: old.id }, data: { status: "SUPERSEDED" } });
      const selections = await tx.mealSelection.findMany({
        where: { subscriptionId: old.id, status: "CONFIRMED", date: { gte: businessToday(now) } },
        include: { order: true },
      });
      for (const selection of selections) {
        if (selection.cutoffAt.getTime() <= now.getTime()) continue;
        await tx.mealSelection.update({ where: { id: selection.id }, data: { status: "CANCELLED" } });
        if (selection.order && selection.order.status === "CONFIRMED") {
          await tx.order.update({ where: { id: selection.order.id }, data: { status: "CANCELLED" } });
        }
      }
    }
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        startDate: start,
        endDate: end,
        mealsRemaining: subscription.creditSnapshot,
        pricePaise: payment.amountPaise,
      },
    });
    return {
      ok: true as const,
      already: false,
      userId: subscription.userId,
      email: subscription.user.email,
      phone: subscription.user.phone,
      whatsappOptIn: subscription.user.profile?.whatsappOptIn || false,
      planName: subscription.plan.name,
      start,
      end,
    };
  });
  if (result.ok && !result.already) {
    await notify(db, {
      userId: result.userId,
      type: "subscription",
      title: "Membership active",
      body: `${result.planName} begins on ${result.start} and runs through ${result.end}. Meal selection opens with the published menu.`,
      email: result.email,
      phone: result.phone,
      whatsappOptIn: result.whatsappOptIn,
      whatsappTemplate: "subscription",
    });
  }
  return result;
}

export async function markPaymentFailed(db: PrismaClient, input: { paymentId: string; reason: string }) {
  const payment = await db.payment.findUnique({
    where: { id: input.paymentId },
    include: { user: { include: { profile: true } } },
  });
  if (!payment) return { ok: false as const, error: "Payment not found." };
  const transition = nextPaymentTransition(payment.status, "failed");
  if (!transition.apply) return { ok: true as const, already: true };
  await db.payment.updateMany({
    where: { id: payment.id, status: "CREATED" },
    data: { status: "FAILED", failureReason: input.reason.slice(0, 300) },
  });
  await notify(db, {
    userId: payment.userId,
    type: "payment",
    title: "Payment not completed",
    body: "The membership remains pending until a verified payment is received.",
    email: payment.user.email,
    phone: payment.user.phone,
    whatsappOptIn: payment.user.profile?.whatsappOptIn,
    whatsappTemplate: "payment",
  });
  return { ok: true as const, already: false };
}

export async function recordOfflinePayment(
  db: PrismaClient,
  input: { adminId: string; subscriptionId: string; note: string },
) {
  const note = input.note.trim();
  if (note.length < 3) throw new ServiceError("NOTE", "Record how this payment was received.");
  const subscription = await db.subscription.findUnique({ where: { id: input.subscriptionId } });
  if (!subscription || subscription.status !== "PENDING_PAYMENT") {
    throw new ServiceError("SUBSCRIPTION", "Offline payment can only activate a pending membership.");
  }
  const payment = await db.payment.create({
    data: {
      userId: subscription.userId,
      subscriptionId: subscription.id,
      provider: "OFFLINE",
      status: "CREATED",
      amountPaise: subscription.pricePaise,
      idempotencyKey: `offline_${subscription.id}_${randomBytes(6).toString("hex")}`,
      note,
    },
  });
  const result = await activatePaidSubscription(db, { paymentId: payment.id, note });
  if (!result.ok) throw new ServiceError("PAYMENT", result.error);
  return payment.id;
}

export async function recordRefund(
  db: PrismaClient,
  input: { adminId: string; paymentId: string; amountPaise: number; reason: string },
) {
  const reason = input.reason.trim();
  if (reason.length < 3) throw new ServiceError("NOTE", "Record the reason for this refund.");
  if (!Number.isInteger(input.amountPaise) || input.amountPaise <= 0) {
    throw new ServiceError("AMOUNT", "Enter a valid refund amount.");
  }
  const payment = await db.payment.findUnique({ where: { id: input.paymentId }, include: { refunds: true } });
  if (!payment || (payment.status !== "PAID" && payment.status !== "REFUNDED")) {
    throw new ServiceError("PAYMENT", "Refunds can only be recorded against a successful payment.");
  }
  const already = payment.refunds.reduce((sum, refund) => sum + refund.amountPaise, 0);
  if (input.amountPaise > refundableBalance(payment.amountPaise, already)) {
    throw new ServiceError("AMOUNT", "The refund is larger than the remaining balance.");
  }
  let providerRef = "";
  if (payment.provider === "RAZORPAY") {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || !payment.razorpayPaymentId) {
      throw new ServiceError(
        "GATEWAY",
        "Razorpay credentials are required before an online payment can be refunded. Nothing was marked as refunded.",
      );
    }
    const Razorpay = (await import("razorpay")).default;
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const refund = (await client.payments.refund(payment.razorpayPaymentId, {
      amount: input.amountPaise,
    })) as { id?: string };
    providerRef = refund.id || "";
  }
  const fullyRefunded = already + input.amountPaise >= payment.amountPaise;
  await db.$transaction(async (tx) => {
    await tx.refund.create({
      data: {
        paymentId: payment.id,
        amountPaise: input.amountPaise,
        reason,
        status: "RECORDED",
        providerRef,
        adminId: input.adminId,
      },
    });
    if (fullyRefunded) {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
    }
  });
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newResetToken(): string {
  return randomBytes(32).toString("hex");
}

function isUnique(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002";
}
