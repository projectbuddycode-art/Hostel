import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { addBusinessDays, businessToday } from "../src/lib/dates";

const prisma = new PrismaClient();

const plans = [
  {
    slug: "essential",
    name: "Essential",
    tagline: "One considered lunch, most days of the term.",
    description:
      "A single lunch credit on the days you choose, within the published menu. This is a measured membership, not an open kitchen.",
    pricePaise: 800000,
    priceNote: "Opening tariff of ₹8,000 for the term. The amount charged is this configured price.",
    mealsPerDay: 1,
    mealTypes: ["lunch"],
    durationDays: 30,
    mealCredits: 26,
    maxAddons: 1,
    allowSides: false,
    allowBread: false,
    allowInstructions: true,
    maxInstructionLength: 80,
    sortOrder: 1,
    purchasable: true,
  },
  {
    slug: "complete",
    name: "Complete",
    tagline: "Lunch and dinner, chosen from the daily menu.",
    description:
      "Two services a day at most, drawn from 48 credits across the term. Sides, bread or rice, and a short note are included where the dish allows.",
    pricePaise: 1550000,
    priceNote: "Indicative band ₹14,000–₹17,000. The amount charged is the configured price of ₹15,500.",
    mealsPerDay: 2,
    mealTypes: ["lunch", "dinner"],
    durationDays: 30,
    mealCredits: 48,
    maxAddons: 2,
    allowSides: true,
    allowBread: true,
    allowInstructions: true,
    maxInstructionLength: 160,
    sortOrder: 2,
    purchasable: true,
  },
  {
    slug: "signature",
    name: "Signature",
    tagline: "Breakfast, lunch and dinner, still within a clear credit.",
    description:
      "Up to three services on a day and 66 credits in the term. The kitchen does not promise every service on every date.",
    pricePaise: 2200000,
    priceNote: "Indicative band ₹20,000–₹25,000. The amount charged is the configured price of ₹22,000.",
    mealsPerDay: 3,
    mealTypes: ["breakfast", "lunch", "dinner"],
    durationDays: 30,
    mealCredits: 66,
    maxAddons: 3,
    allowSides: true,
    allowBread: true,
    allowInstructions: true,
    maxInstructionLength: 240,
    sortOrder: 3,
    purchasable: true,
  },
  {
    slug: "family-table",
    name: "Family Table",
    tagline: "A private table for a household.",
    description:
      "Portioning, address and cadence are agreed with the dining desk. This membership is not sold through online checkout.",
    pricePaise: 0,
    priceNote: "Custom pricing. No online charge is taken for this membership.",
    mealsPerDay: 3,
    mealTypes: ["breakfast", "lunch", "dinner"],
    durationDays: 30,
    mealCredits: 0,
    maxAddons: 3,
    allowSides: true,
    allowBread: true,
    allowInstructions: true,
    maxInstructionLength: 240,
    sortOrder: 4,
    purchasable: false,
  },
];

const sharedRules = {
  deliveryConditions:
    "Delivered to the saved address on confirmed service days. Arrival depends on zone and dispatch. A precise minute is not guaranteed.",
  cancellationRules:
    "Cancellation withdraws future meals that are still before cutoff. It does not refund a payment by itself.",
  upgradeNotes:
    "A verified payment for another membership starts a new term the next day and closes the current term. Unused credits are not carried over.",
};

const dishes = [
  {
    name: "Layered paratha, cultured butter",
    mealType: "breakfast",
    description: "A flaky morning bread finished with cultured butter, as in the breakfast film.",
    imageUrl: "/images/breakfast-detail.jpg",
    allergens: ["gluten", "dairy"],
    dietaryTags: ["vegetarian"],
    sides: ["seasonal fruit"],
    breads: [],
    spiceOptions: ["mild", "medium"],
  },
  {
    name: "Ghee roast dosa",
    mealType: "breakfast",
    description: "A crisp dosa with coconut chutney and a small bowl of sambar.",
    imageUrl: "/images/breakfast-service.jpg",
    allergens: [],
    dietaryTags: ["vegetarian"],
    sides: ["coconut chutney", "sambar"],
    breads: [],
    spiceOptions: ["mild", "medium"],
  },
  {
    name: "Steamed idli",
    mealType: "breakfast",
    description: "Soft idli with chutney. A quiet plate for the start of the day.",
    imageUrl: "/images/breakfast-table.jpg",
    allergens: [],
    dietaryTags: ["vegetarian"],
    sides: ["coconut chutney", "sambar"],
    breads: [],
    spiceOptions: ["mild"],
  },
  {
    name: "Poha with pomegranate",
    mealType: "breakfast",
    description: "Flattened rice with pomegranate, herbs and peanut.",
    imageUrl: "/images/breakfast-table.jpg",
    allergens: ["peanut"],
    dietaryTags: ["vegetarian"],
    sides: ["seasonal fruit"],
    breads: [],
    spiceOptions: ["mild", "medium"],
  },
  {
    name: "Paneer makhani",
    mealType: "lunch",
    description: "A slow tomato and butter gravy with paneer, finished in the kadai.",
    imageUrl: "/images/lunch-kadai.jpg",
    allergens: ["dairy"],
    dietaryTags: ["vegetarian"],
    sides: ["kachumber"],
    breads: ["tandoor roti", "jeera rice"],
    spiceOptions: ["mild", "medium", "hot"],
  },
  {
    name: "Tempered yellow dal",
    mealType: "lunch",
    description: "Lentils with a restrained tadka, meant to sit beside bread or rice.",
    imageUrl: "/images/lunch-plating.jpg",
    allergens: [],
    dietaryTags: ["vegetarian"],
    sides: ["kachumber"],
    breads: ["tandoor roti", "jeera rice"],
    spiceOptions: ["mild", "medium", "hot"],
  },
  {
    name: "Charred vegetable pizza",
    mealType: "lunch",
    description: "A wood-fired vegetable pizza from the same table as the Indian dishes.",
    imageUrl: "/images/service.jpg",
    allergens: ["gluten", "dairy"],
    dietaryTags: ["vegetarian"],
    sides: ["green salad"],
    breads: [],
    spiceOptions: ["mild", "medium"],
  },
  {
    name: "Kachumber and greens",
    mealType: "lunch",
    description: "A bright salad of cucumber, onion, tomato and herbs.",
    imageUrl: "/images/lunch-thali.jpg",
    allergens: [],
    dietaryTags: ["vegan"],
    sides: [],
    breads: [],
    spiceOptions: ["mild", "medium"],
  },
  {
    name: "Saffron vegetable biryani",
    mealType: "dinner",
    description: "Rice, vegetables and saffron, finished with fried onion.",
    imageUrl: "/images/dinner-biryani.jpg",
    allergens: ["nuts"],
    dietaryTags: ["vegetarian"],
    sides: ["raita", "green chutney"],
    breads: [],
    spiceOptions: ["mild", "medium", "hot"],
  },
  {
    name: "Creamed tomato curry",
    mealType: "dinner",
    description: "The copper-pot curry from the dinner film, finished with cream and coriander.",
    imageUrl: "/images/dinner-garnish.jpg",
    allergens: ["dairy"],
    dietaryTags: ["vegetarian"],
    sides: ["raita"],
    breads: ["garlic naan", "steamed rice"],
    spiceOptions: ["mild", "medium", "hot"],
  },
  {
    name: "Chicken biryani",
    mealType: "dinner",
    description: "A spiced chicken biryani. Clearly marked, and never substituted without notice.",
    imageUrl: "/images/dinner-table.jpg",
    allergens: ["nuts"],
    dietaryTags: ["chicken"],
    sides: ["raita"],
    breads: [],
    spiceOptions: ["mild", "medium", "hot"],
  },
  {
    name: "Garlic naan supper",
    mealType: "dinner",
    description: "Naan, raita and a small curry for a lighter evening.",
    imageUrl: "/images/dinner-table.jpg",
    allergens: ["gluten", "dairy"],
    dietaryTags: ["vegetarian"],
    sides: ["raita", "green chutney"],
    breads: ["garlic naan"],
    spiceOptions: ["mild", "medium"],
  },
];

const addons = [
  { name: "Cold-pressed citrus", description: "A small juice, as seen on the grand table.", pricePaise: 12000, mealTypes: ["breakfast", "lunch", "dinner"] },
  { name: "Filter coffee", description: "A single filter coffee with breakfast or after lunch.", pricePaise: 8000, mealTypes: ["breakfast", "lunch"] },
  { name: "Additional bread", description: "One extra bread with a service that already includes bread.", pricePaise: 6000, mealTypes: ["lunch", "dinner"] },
  { name: "Pistachio cream", description: "The plated pistachio dessert from the opening of the dining film.", pricePaise: 18000, mealTypes: ["dinner"] },
  { name: "Extra raita", description: "A second bowl of raita.", pricePaise: 5000, mealTypes: ["lunch", "dinner"] },
];

async function main() {
  for (const plan of plans) {
    const existing = await prisma.plan.findUnique({ where: { slug: plan.slug } });
    if (existing) continue;
    await prisma.plan.create({
      data: {
        ...plan,
        mealTypes: JSON.stringify(plan.mealTypes),
        ...sharedRules,
        active: true,
      },
    });
  }

  for (const addon of addons) {
    const existing = await prisma.addon.findFirst({ where: { name: addon.name } });
    if (existing) continue;
    await prisma.addon.create({
      data: { ...addon, mealTypes: JSON.stringify(addon.mealTypes), active: true },
    });
  }

  const savedPlans = await prisma.plan.findMany();
  const savedAddons = await prisma.addon.findMany();
  for (const plan of savedPlans) {
    for (const addon of savedAddons) {
      await prisma.planAddon.upsert({
        where: { planId_addonId: { planId: plan.id, addonId: addon.id } },
        update: {},
        create: { planId: plan.id, addonId: addon.id },
      });
    }
  }

  for (const dish of dishes) {
    await prisma.dish.upsert({
      where: { name_mealType: { name: dish.name, mealType: dish.mealType } },
      update: {},
      create: {
        ...dish,
        allergens: JSON.stringify(dish.allergens),
        dietaryTags: JSON.stringify(dish.dietaryTags),
        sides: JSON.stringify(dish.sides),
        breads: JSON.stringify(dish.breads),
        portionOptions: JSON.stringify(["regular", "hearty"]),
        spiceOptions: JSON.stringify(dish.spiceOptions),
        active: true,
      },
    });
  }

  const menu = await prisma.dish.findMany({ where: { active: true } });
  const services = ["breakfast", "lunch", "dinner"] as const;
  const serviceTimes: Record<string, string> = { breakfast: "08:30", lunch: "13:00", dinner: "20:00" };
  const today = businessToday();
  for (let day = 0; day < 21; day += 1) {
    const date = addBusinessDays(today, day);
    for (const mealType of services) {
      const options = menu.filter((dish) => dish.mealType === mealType);
      const published = options.filter((_, index) => index === day % options.length || index === (day + 1) % options.length || index === (day + 2) % options.length);
      for (const dish of published) {
        await prisma.menuSchedule.upsert({
          where: { date_mealType_dishId: { date, mealType, dishId: dish.id } },
          update: {},
          create: {
            date,
            mealType,
            dishId: dish.id,
            available: true,
            cutoffHours: 12,
            serviceTime: serviceTimes[mealType],
          },
        });
      }
    }
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          name: "Dining desk",
          role: "ADMIN",
          status: "ACTIVE",
          passwordHash: await hashPassword(password),
        },
      });
      console.log(`Administrator created for ${email}`);
    } else if (existing.role !== "ADMIN") {
      await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN", status: "ACTIVE" } });
      console.log(`Existing account ${email} promoted to administrator. Password was left unchanged.`);
    } else {
      console.log(`Administrator ${email} already exists.`);
    }
  } else {
    console.log("ADMIN_EMAIL or ADMIN_PASSWORD missing. No staff account was created.");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
