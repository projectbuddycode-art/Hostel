import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "th_session";

export type Role = "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

const roles: Role[] = ["CUSTOMER", "ADMIN", "KITCHEN", "DELIVERY"];

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secretKey());
}

export async function readSessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const role = payload.role;
    if (!payload.sub || typeof payload.email !== "string") return null;
    if (typeof role !== "string" || !roles.includes(role as Role)) return null;
    return {
      id: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "",
      role: role as Role,
    };
  } catch {
    return null;
  }
}

export function safeNext(value: string | null | undefined, fallback = "/account"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/admin")) {
    return fallback;
  }
  return value;
}
