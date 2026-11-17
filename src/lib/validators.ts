import { z } from "zod";

const dietaryIds = ["no-preference", "vegetarian", "vegan", "jain", "eggetarian"] as const;
const zones = ["North", "South", "East", "West", "Central"] as const;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(120),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,15}$/, "Enter a valid phone number."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72)
    .regex(/[A-Za-z]/, "Include a letter.")
    .regex(/[0-9]/, "Include a number."),
  line1: z.string().trim().min(4, "Enter the delivery address.").max(160),
  line2: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().min(2, "Enter the city.").max(80),
  state: z.string().trim().max(80).optional().default(""),
  postalCode: z.string().trim().regex(/^[0-9]{6}$/, "Enter a 6-digit postal code."),
  zone: z.enum(zones),
  dietary: z.array(z.enum(dietaryIds)).max(5).default([]),
  allergies: z.string().trim().max(240).optional().default(""),
  whatsappOptIn: z.boolean().optional().default(false),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter the email on the account."),
  password: z.string().min(1, "Enter your password."),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(20).optional().default(""),
  topic: z.enum(["general", "corporate", "support"]),
  subject: z.string().trim().min(3).max(140),
  message: z.string().trim().min(10).max(2000),
});

export const addressSchema = z.object({
  label: z.string().trim().min(2).max(40),
  line1: z.string().trim().min(4).max(160),
  line2: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().max(80).optional().default(""),
  postalCode: z.string().trim().regex(/^[0-9]{6}$/, "Enter a 6-digit postal code."),
  zone: z.enum(zones),
});

export const preferencesSchema = z.object({
  dietary: z.array(z.enum(dietaryIds)).max(5).default([]),
  allergies: z.string().trim().max(240).optional().default(""),
  spicePreference: z.enum(["mild", "medium", "hot"]),
  whatsappOptIn: z.boolean().optional().default(false),
});

export function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function formList(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

export function formFlag(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}
