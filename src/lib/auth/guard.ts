import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { roleHas, type Permission } from "@/lib/auth/access";
import { PREVIEW_COOKIE, readSessionToken, SESSION_COOKIE, type SessionUser } from "@/lib/auth/session";

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

export async function setSessionCookie(user: SessionUser) {
  const { signSession } = await import("@/lib/auth/session");
  const token = await signSession(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

const previewCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
};

export async function hasAdminPreview() {
  const jar = await cookies();
  return jar.get(PREVIEW_COOKIE)?.value === "1";
}

export async function setAdminPreview() {
  const jar = await cookies();
  jar.set(PREVIEW_COOKIE, "1", previewCookie);
}

export async function clearAdminPreview() {
  const jar = await cookies();
  jar.delete(PREVIEW_COOKIE);
}

export async function requireUser() {
  const session = await getSession();
  if (!session) {
    if (await hasAdminPreview()) redirect("/admin");
    redirect("/login");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { profile: true },
  });
  if (!user || user.status !== "ACTIVE") {
    await clearSessionCookie();
    redirect("/login");
  }
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!roleHas(user.role, permission)) redirect("/admin");
  return user;
}
