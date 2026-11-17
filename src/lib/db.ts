import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function vercelDatabaseUrl() {
  if (process.env.VERCEL !== "1") return undefined;
  const source = path.join(process.cwd(), "prisma", "build.db");
  const target = "/tmp/hostel.db";
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(source) && !fs.existsSync(target)) fs.copyFileSync(source, target);
  if (!fs.existsSync(target)) return undefined;
  return `file:${target}`;
}

const databaseUrl = vercelDatabaseUrl();
if (databaseUrl) process.env.DATABASE_URL = databaseUrl;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
