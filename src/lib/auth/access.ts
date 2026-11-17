import type { Role } from "@/lib/auth/session";

export type Permission =
  | "customers.manage"
  | "plans.manage"
  | "menu.manage"
  | "orders.read"
  | "orders.prep"
  | "orders.approve"
  | "kitchen.manage"
  | "delivery.manage"
  | "payments.manage"
  | "reports.read"
  | "staff.manage"
  | "audit.read"
  | "support.manage";

const grants: Record<Role, Permission[]> = {
  ADMIN: [
    "customers.manage",
    "plans.manage",
    "menu.manage",
    "orders.read",
    "orders.prep",
    "orders.approve",
    "kitchen.manage",
    "delivery.manage",
    "payments.manage",
    "reports.read",
    "staff.manage",
    "audit.read",
    "support.manage",
  ],
  KITCHEN: ["orders.read", "orders.prep", "kitchen.manage"],
  DELIVERY: ["delivery.manage"],
  CUSTOMER: [],
};

const pathRules: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin/payments", roles: ["ADMIN"] },
  { prefix: "/admin/reports", roles: ["ADMIN"] },
  { prefix: "/admin/plans", roles: ["ADMIN"] },
  { prefix: "/admin/customers", roles: ["ADMIN"] },
  { prefix: "/admin/menu", roles: ["ADMIN"] },
  { prefix: "/admin/audit", roles: ["ADMIN"] },
  { prefix: "/admin/staff", roles: ["ADMIN"] },
  { prefix: "/admin/support", roles: ["ADMIN"] },
  { prefix: "/admin/kitchen", roles: ["ADMIN", "KITCHEN"] },
  { prefix: "/admin/orders", roles: ["ADMIN", "KITCHEN"] },
  { prefix: "/admin/delivery", roles: ["ADMIN", "DELIVERY"] },
  { prefix: "/admin", roles: ["ADMIN", "KITCHEN", "DELIVERY"] },
];

export function roleHas(role: string, permission: Permission): boolean {
  const list = grants[role as Role];
  if (!list) return false;
  return list.includes(permission);
}

export function canAccessPath(role: string, pathname: string): boolean {
  const found = [...pathRules]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`));
  if (!found) return false;
  return found.roles.includes(role as Role);
}

export function staffNav(role: string): { href: string; label: string }[] {
  const items = [
    { href: "/admin", label: "Overview", roles: ["ADMIN", "KITCHEN", "DELIVERY"] },
    { href: "/admin/customers", label: "Customers", roles: ["ADMIN"] },
    { href: "/admin/plans", label: "Memberships", roles: ["ADMIN"] },
    { href: "/admin/menu", label: "Menu", roles: ["ADMIN"] },
    { href: "/admin/orders", label: "Orders", roles: ["ADMIN", "KITCHEN"] },
    { href: "/admin/kitchen", label: "Kitchen", roles: ["ADMIN", "KITCHEN"] },
    { href: "/admin/delivery", label: "Delivery", roles: ["ADMIN", "DELIVERY"] },
    { href: "/admin/payments", label: "Payments", roles: ["ADMIN"] },
    { href: "/admin/reports", label: "Reports", roles: ["ADMIN"] },
    { href: "/admin/support", label: "Desk", roles: ["ADMIN"] },
    { href: "/admin/staff", label: "Staff", roles: ["ADMIN"] },
    { href: "/admin/audit", label: "Audit", roles: ["ADMIN"] },
  ];
  return items.filter((item) => item.roles.includes(role as Role)).map(({ href, label }) => ({ href, label }));
}
