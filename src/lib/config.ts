export const site = {
  name: "THE HOSTELS",
  line: "Everyday dining. Elevated.",
  description:
    "A thoughtfully curated daily dining experience, prepared with care and delivered to your doorstep.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  timezone: "Asia/Kolkata",
};

export const mealServices = [
  { id: "breakfast", label: "Breakfast", serviceTime: "08:30" },
  { id: "lunch", label: "Lunch", serviceTime: "13:00" },
  { id: "dinner", label: "Dinner", serviceTime: "20:00" },
] as const;

export type MealType = (typeof mealServices)[number]["id"];

export const zones = ["North", "South", "East", "West", "Central"] as const;

export const dietaryOptions = [
  { id: "no-preference", label: "No stated preference" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "jain", label: "Jain" },
  { id: "eggetarian", label: "Eggetarian" },
] as const;
