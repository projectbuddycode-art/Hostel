"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, requirePermission, requireUser, setSessionCookie } from "@/lib/auth/guard";
import { safeNext } from "@/lib/auth/session";
import { roleHas } from "@/lib/auth/access";
import { site } from "@/lib/config";
import { notify } from "@/lib/notifications/dispatch";
import { rateLimit } from "@/lib/rate-limit";
import { toJsonList } from "@/lib/json";
import {
  addressSchema,
  contactSchema,
  formFlag,
  formList,
  formText,
  loginSchema,
  preferencesSchema,
  registerSchema,
} from "@/lib/validators";
import {
  ServiceError,
  beginCheckout,
  cancelMembership,
  confirmMeal,
  hashResetToken,
  markPaymentFailed,
  newResetToken,
  pauseMembership,
  recordOfflinePayment,
  recordRefund,
  resumeMembership,
  skipMeal,
} from "@/server/services";

function bounce(target: string, error: unknown): never {
  const message = error instanceof ServiceError ? error.message : "Something went wrong. Please try again.";
  redirect(`${target}${target.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

export async function registerAction(formData: FormData) {
  const next = safeNext(formText(formData, "next"));
  const parsed = registerSchema.safeParse({
    name: formText(formData, "name"),
    email: formText(formData, "email").toLowerCase(),
    phone: formText(formData, "phone"),
    password: formText(formData, "password"),
    line1: formText(formData, "line1"),
    line2: formText(formData, "line2"),
    city: formText(formData, "city"),
    state: formText(formData, "state"),
    postalCode: formText(formData, "postalCode"),
    zone: formText(formData, "zone"),
    dietary: formList(formData, "dietary"),
    allergies: formText(formData, "allergies"),
    whatsappOptIn: formFlag(formData, "whatsappOptIn"),
  });
  if (!parsed.success) bounce(`/register?next=${encodeURIComponent(next)}`, new ServiceError("FORM", parsed.error.issues[0]?.message || "Check the form."));
  if (formText(formData, "confirmPassword") !== parsed.data.password) {
    bounce(`/register?next=${encodeURIComponent(next)}`, new ServiceError("FORM", "The passwords do not match."));
  }
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) bounce("/register", new ServiceError("EMAIL", "An account with this email already exists. Sign in instead."));
  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash,
      role: "CUSTOMER",
      profile: {
        create: {
          dietaryPreferences: toJsonList(parsed.data.dietary),
          allergies: parsed.data.allergies,
          whatsappOptIn: parsed.data.whatsappOptIn,
        },
      },
      addresses: {
        create: {
          label: "Home",
          line1: parsed.data.line1,
          line2: parsed.data.line2,
          city: parsed.data.city,
          state: parsed.data.state,
          postalCode: parsed.data.postalCode,
          zone: parsed.data.zone,
          isDefault: true,
        },
      },
    },
  });
  await notify(prisma, {
    userId: user.id,
    type: "registration",
    title: "Welcome to THE HOSTELS",
    body: "Your table is open. Memberships and the daily menu are ready when you are.",
    email: user.email,
    phone: user.phone,
    whatsappOptIn: parsed.data.whatsappOptIn,
    whatsappTemplate: "registration",
  });
  await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: "CUSTOMER" });
  redirect(next);
}

export async function loginAction(formData: FormData) {
  const next = safeNext(formText(formData, "next"));
  const parsed = loginSchema.safeParse({
    email: formText(formData, "email").toLowerCase(),
    password: formText(formData, "password"),
  });
  if (!parsed.success) bounce(`/login?next=${encodeURIComponent(next)}`, new ServiceError("FORM", parsed.error.issues[0]?.message || "Check the form."));
  if (!rateLimit(`login:${parsed.data.email}`, 5, 15 * 60 * 1000).ok) {
    bounce(`/login?next=${encodeURIComponent(next)}`, new ServiceError("RATE", "Too many attempts. Wait a few minutes and try again."));
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    bounce(`/login?next=${encodeURIComponent(next)}`, new ServiceError("AUTH", "Email or password is incorrect."));
  }
  if (user.status !== "ACTIVE") bounce("/login", new ServiceError("STATUS", "This account is not active. Write to the dining desk."));
  if (user.role !== "CUSTOMER") bounce("/login", new ServiceError("ROLE", "Use the staff entrance for this account."));
  await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: "CUSTOMER" });
  redirect(next);
}

export async function adminLoginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formText(formData, "email").toLowerCase(),
    password: formText(formData, "password"),
  });
  if (!parsed.success) bounce("/admin/login", new ServiceError("FORM", parsed.error.issues[0]?.message || "Check the form."));
  if (!rateLimit(`admin:${parsed.data.email}`, 5, 15 * 60 * 1000).ok) {
    bounce("/admin/login", new ServiceError("RATE", "Too many attempts. Wait a few minutes and try again."));
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const allowed = user && ["ADMIN", "KITCHEN", "DELIVERY"].includes(user.role);
  if (!user || !allowed || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    bounce("/admin/login", new ServiceError("AUTH", "Email or password is incorrect."));
  }
  if (user.status !== "ACTIVE") bounce("/admin/login", new ServiceError("STATUS", "This staff account is not active."));
  await audit(user.id, "staff.login", "User", user.id, { role: user.role });
  await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: user.role as "ADMIN" | "KITCHEN" | "DELIVERY" });
  redirect("/admin");
}

export async function logoutAction(formData: FormData) {
  await clearSessionCookie();
  redirect(formText(formData, "next") === "admin" ? "/admin/login" : "/");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = formText(formData, "email").toLowerCase();
  if (!rateLimit(`reset:${email}`, 3, 30 * 60 * 1000).ok) {
    redirect("/forgot-password?notice=If an account exists for that email, reset instructions have been prepared.");
  }
  const user = await prisma.user.findUnique({ where: { email } });
  let devLink = "";
  if (user && user.role === "CUSTOMER" && user.status === "ACTIVE") {
    const token = newResetToken();
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const link = `${site.url}/reset-password?token=${token}`;
    await notify(prisma, {
      userId: user.id,
      type: "password-reset",
      title: "Reset your password",
      body: "A password reset was requested. If email delivery is configured, the message contains a one-hour link.",
      emailBody: `Reset your THE HOSTELS password within one hour: ${link}`,
      email: user.email,
    });
    if (process.env.NODE_ENV !== "production" && process.env.DEV_EXPOSE_RESET_LINKS === "true") devLink = link;
  }
  const notice = "If an account exists for that email, reset instructions have been prepared.";
  redirect(`/forgot-password?notice=${encodeURIComponent(notice)}${devLink ? `&dev=${encodeURIComponent(devLink)}` : ""}`);
}

export async function resetPasswordAction(formData: FormData) {
  const token = formText(formData, "token");
  const password = formText(formData, "password");
  const parsed = registerSchema.shape.password.safeParse(password);
  if (!parsed.success) bounce(`/reset-password?token=${encodeURIComponent(token)}`, new ServiceError("FORM", parsed.error.issues[0]?.message || "Choose a stronger password."));
  if (password !== formText(formData, "confirmPassword")) {
    bounce(`/reset-password?token=${encodeURIComponent(token)}`, new ServiceError("FORM", "The passwords do not match."));
  }
  const row = await prisma.passwordReset.findUnique({ where: { tokenHash: hashResetToken(token) }, include: { user: true } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now() || row.user.role !== "CUSTOMER") {
    bounce("/forgot-password", new ServiceError("TOKEN", "This reset link is no longer valid."));
  }
  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  await setSessionCookie({ id: row.user.id, email: row.user.email, name: row.user.name, role: "CUSTOMER" });
  redirect("/account?notice=Password updated");
}

export async function contactAction(formData: FormData) {
  const topic = formText(formData, "topic") || "general";
  const parsed = contactSchema.safeParse({
    name: formText(formData, "name"),
    email: formText(formData, "email"),
    phone: formText(formData, "phone"),
    topic,
    subject: formText(formData, "subject"),
    message: formText(formData, "message"),
  });
  const back = topic === "corporate" ? "/corporate" : topic === "support" ? "/account/support" : "/contact";
  if (!parsed.success) bounce(back, new ServiceError("FORM", parsed.error.issues[0]?.message || "Check the form."));
  const sessionUser = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  await prisma.supportTicket.create({
    data: {
      userId: sessionUser?.id,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      topic: parsed.data.topic,
      subject: parsed.data.subject,
      message: parsed.data.message,
    },
  });
  redirect(`${back}?notice=${encodeURIComponent("Message received. The dining desk will reply by email.")}`);
}

export async function saveAddressAction(formData: FormData) {
  const user = await requireUser();
  const parsed = addressSchema.safeParse({
    label: formText(formData, "label"),
    line1: formText(formData, "line1"),
    line2: formText(formData, "line2"),
    city: formText(formData, "city"),
    state: formText(formData, "state"),
    postalCode: formText(formData, "postalCode"),
    zone: formText(formData, "zone"),
  });
  if (!parsed.success) bounce("/account/addresses", new ServiceError("FORM", parsed.error.issues[0]?.message || "Check the address."));
  const count = await prisma.address.count({ where: { userId: user.id } });
  await prisma.address.create({
    data: { ...parsed.data, userId: user.id, isDefault: count === 0 },
  });
  revalidatePath("/account/addresses");
  redirect("/account/addresses?notice=Address saved");
}

export async function defaultAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = formText(formData, "addressId");
  const address = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!address) bounce("/account/addresses", new ServiceError("ADDRESS", "Address not found."));
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  redirect("/account/addresses?notice=Default address updated");
}

export async function savePreferencesAction(formData: FormData) {
  const user = await requireUser();
  const parsed = preferencesSchema.safeParse({
    dietary: formList(formData, "dietary"),
    allergies: formText(formData, "allergies"),
    spicePreference: formText(formData, "spicePreference"),
    whatsappOptIn: formFlag(formData, "whatsappOptIn"),
  });
  if (!parsed.success) bounce("/account/preferences", new ServiceError("FORM", parsed.error.issues[0]?.message || "Check the form."));
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      dietaryPreferences: toJsonList(parsed.data.dietary),
      allergies: parsed.data.allergies,
      spicePreference: parsed.data.spicePreference,
      whatsappOptIn: parsed.data.whatsappOptIn,
    },
    create: {
      userId: user.id,
      dietaryPreferences: toJsonList(parsed.data.dietary),
      allergies: parsed.data.allergies,
      spicePreference: parsed.data.spicePreference,
      whatsappOptIn: parsed.data.whatsappOptIn,
    },
  });
  redirect("/account/preferences?notice=Preferences saved");
}

export async function confirmMealAction(formData: FormData) {
  const user = await requireUser();
  const date = formText(formData, "date");
  const mealType = formText(formData, "mealType");
  const back = `/account/meals?date=${encodeURIComponent(date)}`;
  try {
    await confirmMeal(prisma, {
      userId: user.id,
      date,
      mealType,
      dishId: formText(formData, "dishId"),
      portion: formText(formData, "portion") || "regular",
      spice: formText(formData, "spice") || "medium",
      side: formText(formData, "side"),
      breadOrRice: formText(formData, "breadOrRice"),
      instructions: formText(formData, "instructions"),
      addonIds: formList(formData, "addonId"),
      acknowledgeAllergens: formFlag(formData, "acknowledgeAllergens"),
    });
  } catch (error) {
    if (error instanceof ServiceError) bounce(back, error);
    throw error;
  }
  redirect(`${back}&notice=${encodeURIComponent("Meal confirmed")}`);
}

export async function skipMealAction(formData: FormData) {
  const user = await requireUser();
  const date = formText(formData, "date");
  const back = `/account/meals?date=${encodeURIComponent(date)}`;
  try {
    await skipMeal(prisma, { userId: user.id, selectionId: formText(formData, "selectionId") });
  } catch (error) {
    if (error instanceof ServiceError) bounce(back, error);
    throw error;
  }
  redirect(`${back}&notice=${encodeURIComponent("Meal skipped. The credit has been returned.")}`);
}

export async function pauseAction(formData: FormData) {
  const user = await requireUser();
  try {
    await pauseMembership(prisma, {
      userId: user.id,
      fromDate: formText(formData, "fromDate"),
      untilDate: formText(formData, "untilDate"),
    });
  } catch (error) {
    if (error instanceof ServiceError) bounce("/account/membership", error);
    throw error;
  }
  redirect("/account/membership?notice=Membership paused");
}

export async function resumeAction() {
  const user = await requireUser();
  try {
    await resumeMembership(prisma, user.id);
  } catch (error) {
    if (error instanceof ServiceError) bounce("/account/membership", error);
    throw error;
  }
  redirect("/account/membership?notice=Membership resumed");
}

export async function cancelMembershipAction(formData: FormData) {
  const user = await requireUser();
  if (formText(formData, "confirm") !== "CANCEL") {
    bounce("/account/membership", new ServiceError("CONFIRM", "Type CANCEL to confirm. No change was made."));
  }
  try {
    await cancelMembership(prisma, user.id);
  } catch (error) {
    if (error instanceof ServiceError) bounce("/account/membership", error);
    throw error;
  }
  await audit(user.id, "subscription.cancel", "Subscription", user.id, {});
  redirect("/account/membership?notice=Membership cancelled. Meals still before cutoff were withdrawn. Refunds are not automatic.");
}

export async function checkoutAction(formData: FormData) {
  const user = await requireUser();
  const slug = formText(formData, "planSlug");
  try {
    const result = await beginCheckout(prisma, {
      userId: user.id,
      planSlug: slug,
      addressId: formText(formData, "addressId"),
    });
    redirect(`/checkout/${slug}/pay?payment=${result.paymentId}`);
  } catch (error) {
    if (error instanceof ServiceError) bounce(`/checkout/${slug}`, error);
    throw error;
  }
}

export async function updateCustomerStatusAction(formData: FormData) {
  const admin = await requirePermission("customers.manage");
  const userId = formText(formData, "userId");
  const status = formText(formData, "status");
  if (status !== "ACTIVE" && status !== "SUSPENDED") bounce(`/admin/customers/${userId}`, new ServiceError("FORM", "Unknown status."));
  const customer = await prisma.user.findFirst({ where: { id: userId, role: "CUSTOMER" } });
  if (!customer) bounce("/admin/customers", new ServiceError("MISSING", "Customer not found."));
  await prisma.user.update({ where: { id: userId }, data: { status } });
  await audit(admin.id, "customer.status", "User", userId, { status });
  redirect(`/admin/customers/${userId}?notice=Status updated`);
}

export async function adjustCreditsAction(formData: FormData) {
  const admin = await requirePermission("customers.manage");
  const subscriptionId = formText(formData, "subscriptionId");
  const credits = Number(formText(formData, "credits"));
  const note = formText(formData, "note").trim();
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) bounce("/admin/customers", new ServiceError("MISSING", "Membership not found."));
  if (!Number.isInteger(credits) || credits < 0 || credits > 500 || note.length < 3) {
    bounce(`/admin/customers/${subscription.userId}`, new ServiceError("FORM", "Enter a credit balance and a short reason."));
  }
  await prisma.subscription.update({ where: { id: subscription.id }, data: { mealsRemaining: credits } });
  await audit(admin.id, "subscription.credits", "Subscription", subscription.id, { credits, note });
  redirect(`/admin/customers/${subscription.userId}?notice=Credits updated`);
}

export async function offlinePaymentAction(formData: FormData) {
  const admin = await requirePermission("payments.manage");
  const subscriptionId = formText(formData, "subscriptionId");
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) bounce("/admin/payments", new ServiceError("MISSING", "Membership not found."));
  try {
    const paymentId = await recordOfflinePayment(prisma, {
      adminId: admin.id,
      subscriptionId,
      note: formText(formData, "note"),
    });
    await audit(admin.id, "payment.offline", "Payment", paymentId, { subscriptionId });
  } catch (error) {
    if (error instanceof ServiceError) bounce(`/admin/customers/${subscription.userId}`, error);
    throw error;
  }
  redirect(`/admin/customers/${subscription.userId}?notice=Offline payment recorded and membership activated`);
}

export async function refundAction(formData: FormData) {
  const admin = await requirePermission("payments.manage");
  const paymentId = formText(formData, "paymentId");
  const amount = Math.round(Number(formText(formData, "amountRupees")) * 100);
  try {
    await recordRefund(prisma, { adminId: admin.id, paymentId, amountPaise: amount, reason: formText(formData, "reason") });
    await audit(admin.id, "payment.refund", "Payment", paymentId, { amountPaise: amount });
  } catch (error) {
    if (error instanceof ServiceError) bounce("/admin/payments", error);
    throw error;
  }
  redirect("/admin/payments?notice=Refund recorded");
}

export async function savePlanAction(formData: FormData) {
  const admin = await requirePermission("plans.manage");
  const id = formText(formData, "id");
  const name = formText(formData, "name").trim();
  const slug = (formText(formData, "slug").trim() || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const pricePaise = Math.round(Number(formText(formData, "priceRupees")) * 100);
  const mealTypes = formList(formData, "mealType").filter((meal) => ["breakfast", "lunch", "dinner"].includes(meal));
  if (!name || !slug || !Number.isInteger(pricePaise) || pricePaise < 0 || mealTypes.length === 0) {
    bounce("/admin/plans", new ServiceError("FORM", "Name, price and at least one meal service are required."));
  }
  const data = {
    name,
    slug,
    tagline: formText(formData, "tagline").slice(0, 160),
    description: formText(formData, "description").slice(0, 1200),
    pricePaise,
    priceNote: formText(formData, "priceNote").slice(0, 400),
    mealsPerDay: clampInt(formText(formData, "mealsPerDay"), 1, 3),
    mealTypes: toJsonList(mealTypes),
    durationDays: clampInt(formText(formData, "durationDays"), 7, 365),
    mealCredits: clampInt(formText(formData, "mealCredits"), 0, 500),
    maxAddons: clampInt(formText(formData, "maxAddons"), 0, 6),
    allowSides: formFlag(formData, "allowSides"),
    allowBread: formFlag(formData, "allowBread"),
    allowInstructions: formFlag(formData, "allowInstructions"),
    maxInstructionLength: clampInt(formText(formData, "maxInstructionLength"), 0, 400),
    deliveryConditions: formText(formData, "deliveryConditions").slice(0, 600),
    pauseMinDays: clampInt(formText(formData, "pauseMinDays"), 1, 30),
    pauseMaxDays: clampInt(formText(formData, "pauseMaxDays"), 1, 60),
    cancellationRules: formText(formData, "cancellationRules").slice(0, 600),
    upgradeNotes: formText(formData, "upgradeNotes").slice(0, 600),
    purchasable: formFlag(formData, "purchasable"),
    active: formFlag(formData, "active"),
    sortOrder: clampInt(formText(formData, "sortOrder"), 0, 50),
  };
  const plan = id
    ? await prisma.plan.update({ where: { id }, data })
    : await prisma.plan.create({ data });
  const addonIds = formList(formData, "addonId");
  await prisma.planAddon.deleteMany({ where: { planId: plan.id } });
  if (addonIds.length) {
    await prisma.planAddon.createMany({ data: addonIds.map((addonId) => ({ planId: plan.id, addonId })) });
  }
  await audit(admin.id, id ? "plan.update" : "plan.create", "Plan", plan.id, { slug });
  redirect("/admin/plans?notice=Membership saved");
}

export async function saveAddonAction(formData: FormData) {
  const admin = await requirePermission("plans.manage");
  const name = formText(formData, "name").trim();
  const pricePaise = Math.round(Number(formText(formData, "priceRupees")) * 100);
  const mealTypes = formList(formData, "mealType");
  if (!name || !Number.isInteger(pricePaise) || pricePaise < 0 || mealTypes.length === 0) {
    bounce("/admin/plans", new ServiceError("FORM", "An extra needs a name, price and meal service."));
  }
  const addon = await prisma.addon.create({
    data: {
      name,
      description: formText(formData, "description").slice(0, 300),
      pricePaise,
      mealTypes: toJsonList(mealTypes),
    },
  });
  await audit(admin.id, "addon.create", "Addon", addon.id, { name });
  redirect("/admin/plans?notice=Extra saved");
}

export async function saveDishAction(formData: FormData) {
  const admin = await requirePermission("menu.manage");
  const name = formText(formData, "name").trim();
  const mealType = formText(formData, "mealType");
  if (!name || !["breakfast", "lunch", "dinner"].includes(mealType)) {
    bounce("/admin/menu", new ServiceError("FORM", "A dish needs a name and a service."));
  }
  const image = await storeImage(formData.get("image"));
  const data = {
    name,
    description: formText(formData, "description").slice(0, 800),
    mealType,
    imageUrl: image || formText(formData, "imageUrl"),
    allergens: toJsonList(splitCsv(formText(formData, "allergens"))),
    dietaryTags: toJsonList(splitCsv(formText(formData, "dietaryTags"))),
    portionOptions: toJsonList(splitCsv(formText(formData, "portionOptions"), ["regular", "hearty"])),
    spiceOptions: toJsonList(splitCsv(formText(formData, "spiceOptions"), ["mild", "medium", "hot"])),
    sides: toJsonList(splitCsv(formText(formData, "sides"))),
    breads: toJsonList(splitCsv(formText(formData, "breads"))),
    extraPaise: Math.max(0, Math.round(Number(formText(formData, "extraRupees") || 0) * 100)),
    active: formFlag(formData, "active"),
  };
  const id = formText(formData, "id");
  const dish = id ? await prisma.dish.update({ where: { id }, data }) : await prisma.dish.create({ data });
  await audit(admin.id, id ? "dish.update" : "dish.create", "Dish", dish.id, { name });
  redirect("/admin/menu?notice=Dish saved");
}

export async function scheduleDishAction(formData: FormData) {
  const admin = await requirePermission("menu.manage");
  const date = formText(formData, "date");
  const mealType = formText(formData, "mealType");
  const dishId = formText(formData, "dishId");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !dishId) bounce("/admin/menu", new ServiceError("FORM", "Choose a date and a dish."));
  await prisma.menuSchedule.upsert({
    where: { date_mealType_dishId: { date, mealType, dishId } },
    update: {
      available: formFlag(formData, "available"),
      cutoffHours: clampInt(formText(formData, "cutoffHours"), 1, 72),
      serviceTime: formText(formData, "serviceTime") || "13:00",
    },
    create: {
      date,
      mealType,
      dishId,
      available: formFlag(formData, "available"),
      cutoffHours: clampInt(formText(formData, "cutoffHours"), 1, 72),
      serviceTime: formText(formData, "serviceTime") || "13:00",
    },
  });
  await audit(admin.id, "menu.schedule", "MenuSchedule", dishId, { date, mealType });
  redirect("/admin/menu?notice=Menu updated");
}

export async function orderStatusAction(formData: FormData) {
  const user = await requireUser();
  const orderId = formText(formData, "orderId");
  const status = formText(formData, "status");
  const allowed: Record<string, string[]> = {
    ADMIN: ["CONFIRMED", "PREPARING", "PACKED", "DISPATCHED", "DELIVERED", "FAILED", "CANCELLED"],
    KITCHEN: ["PREPARING", "PACKED"],
    DELIVERY: ["DISPATCHED", "DELIVERED", "FAILED"],
  };
  if (!allowed[user.role]?.includes(status)) bounce("/admin/orders", new ServiceError("FORBIDDEN", "You cannot set that status."));
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: { include: { profile: true } }, selection: true } });
  if (!order) bounce("/admin/orders", new ServiceError("MISSING", "Order not found."));
  await prisma.order.update({ where: { id: orderId }, data: { status } });
  await prisma.deliveryEvent.create({ data: { orderId, status, note: `Status set to ${status}` } });
  if (["DISPATCHED", "DELIVERED", "FAILED"].includes(status)) {
    await notify(prisma, {
      userId: order.userId,
      type: "delivery",
      title: status === "DELIVERED" ? "Meal delivered" : status === "FAILED" ? "Delivery needs attention" : "Meal dispatched",
      body: `${order.dishName} for ${order.selection.date} is now ${status.toLowerCase().replaceAll("_", " ")}.`,
      email: order.user.email,
      phone: order.user.phone,
      whatsappOptIn: order.user.profile?.whatsappOptIn,
      whatsappTemplate: "delivery",
    });
  }
  await audit(user.id, "order.status", "Order", orderId, { status });
  const back = formText(formData, "back") || "/admin/orders";
  redirect(`${back}?notice=Order updated`);
}

export async function approveRequestAction(formData: FormData) {
  const admin = await requirePermission("orders.approve");
  const orderId = formText(formData, "orderId");
  const requestStatus = formText(formData, "requestStatus");
  if (requestStatus !== "APPROVED" && requestStatus !== "DECLINED") {
    bounce("/admin/orders", new ServiceError("FORM", "Choose a decision."));
  }
  await prisma.order.update({ where: { id: orderId }, data: { requestStatus } });
  await audit(admin.id, "order.request", "Order", orderId, { requestStatus });
  redirect("/admin/orders?notice=Special request updated");
}

export async function assignDeliveryAction(formData: FormData) {
  const user = await requireUser();
  if (!roleHas(user.role, "delivery.manage")) bounce("/admin", new ServiceError("FORBIDDEN", "Delivery access is required."));
  const orderId = formText(formData, "orderId");
  const personnelName = formText(formData, "personnelName").trim();
  if (!personnelName) bounce("/admin/delivery", new ServiceError("FORM", "Enter the delivery name."));
  await prisma.deliveryAssignment.upsert({
    where: { orderId },
    update: { personnelName, personnelPhone: formText(formData, "personnelPhone"), notes: formText(formData, "notes"), status: "ASSIGNED" },
    create: { orderId, personnelName, personnelPhone: formText(formData, "personnelPhone"), notes: formText(formData, "notes") },
  });
  await audit(user.id, "delivery.assign", "Order", orderId, { personnelName });
  redirect("/admin/delivery?notice=Delivery assigned");
}

export async function kitchenBatchAction(formData: FormData) {
  const user = await requireUser();
  if (!roleHas(user.role, "kitchen.manage")) bounce("/admin", new ServiceError("FORBIDDEN", "Kitchen access is required."));
  const date = formText(formData, "date");
  const mealType = formText(formData, "mealType");
  const dishName = formText(formData, "dishName");
  const status = formText(formData, "status");
  if (!["PLANNED", "IN_PREP", "PACKED"].includes(status)) bounce("/admin/kitchen", new ServiceError("FORM", "Unknown kitchen status."));
  await prisma.kitchenBatch.upsert({
    where: { date_mealType_dishName: { date, mealType, dishName } },
    update: { status },
    create: { date, mealType, dishName, quantity: clampInt(formText(formData, "quantity"), 0, 5000), status },
  });
  redirect(`/admin/kitchen?date=${date}&meal=${mealType}&notice=Kitchen status saved`);
}

export async function supportStatusAction(formData: FormData) {
  const admin = await requirePermission("support.manage");
  const id = formText(formData, "id");
  const status = formText(formData, "status");
  if (!["OPEN", "ANSWERED", "CLOSED"].includes(status)) bounce("/admin/support", new ServiceError("FORM", "Unknown status."));
  await prisma.supportTicket.update({ where: { id }, data: { status } });
  await audit(admin.id, "support.status", "SupportTicket", id, { status });
  redirect("/admin/support?notice=Desk updated");
}

export async function createStaffAction(formData: FormData) {
  const admin = await requirePermission("staff.manage");
  const name = formText(formData, "name").trim();
  const email = formText(formData, "email").trim().toLowerCase();
  const role = formText(formData, "role");
  const password = formText(formData, "password");
  if (!name || !email.includes("@") || !["KITCHEN", "DELIVERY"].includes(role)) {
    bounce("/admin/staff", new ServiceError("FORM", "Name, email and a kitchen or delivery role are required."));
  }
  const parsed = registerSchema.shape.password.safeParse(password);
  if (!parsed.success) bounce("/admin/staff", new ServiceError("FORM", parsed.error.issues[0]?.message || "Choose a stronger password."));
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) bounce("/admin/staff", new ServiceError("EMAIL", "That email is already in use."));
  const user = await prisma.user.create({
    data: { name, email, role, passwordHash: await hashPassword(password), phone: formText(formData, "phone") },
  });
  await audit(admin.id, "staff.create", "User", user.id, { role });
  redirect(`/admin/staff?notice=${encodeURIComponent("Staff account created. Share the password through a private channel, then ask them to change it.")}`);
}

export async function failedPaymentAction(formData: FormData) {
  const user = await requireUser();
  const paymentId = formText(formData, "paymentId");
  const payment = await prisma.payment.findFirst({ where: { id: paymentId, userId: user.id } });
  if (!payment) redirect("/account/payments?error=Payment not found");
  await markPaymentFailed(prisma, { paymentId, reason: formText(formData, "reason") || "Checkout closed before payment." });
  redirect(`/checkout/retry?payment=${paymentId}`);
}

function clampInt(value: string, min: number, max: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function splitCsv(value: string, fallback: string[] = []) {
  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  return items.length ? items : fallback;
}

async function storeImage(entry: FormDataEntryValue | null) {
  if (!(entry instanceof File) || entry.size === 0) return "";
  if (entry.size > 4_000_000) throw new ServiceError("IMAGE", "Use an image under 4MB.");
  const types: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const ext = types[entry.type];
  if (!ext) throw new ServiceError("IMAGE", "Use a JPG, PNG or WebP image.");
  const filename = `${randomBytes(16).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), Buffer.from(await entry.arrayBuffer()));
  return `/uploads/${filename}`;
}
