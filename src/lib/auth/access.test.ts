import { describe, expect, it } from "vitest";
import { canAccessPath, roleHas } from "@/lib/auth/access";

describe("staff access", () => {
  it("keeps customers out of the desk", () => {
    expect(canAccessPath("CUSTOMER", "/admin")).toBe(false);
    expect(canAccessPath("CUSTOMER", "/admin/payments")).toBe(false);
    expect(roleHas("CUSTOMER", "payments.manage")).toBe(false);
  });

  it("separates kitchen, delivery and administration", () => {
    expect(canAccessPath("KITCHEN", "/admin/kitchen")).toBe(true);
    expect(canAccessPath("KITCHEN", "/admin/orders")).toBe(true);
    expect(canAccessPath("KITCHEN", "/admin/payments")).toBe(false);
    expect(canAccessPath("DELIVERY", "/admin/delivery")).toBe(true);
    expect(canAccessPath("DELIVERY", "/admin/orders")).toBe(false);
    expect(canAccessPath("ADMIN", "/admin/payments")).toBe(true);
    expect(canAccessPath("ADMIN", "/admin/audit")).toBe(true);
    expect(roleHas("KITCHEN", "orders.prep")).toBe(true);
    expect(roleHas("KITCHEN", "orders.approve")).toBe(false);
    expect(roleHas("DELIVERY", "delivery.manage")).toBe(true);
    expect(roleHas("ADMIN", "staff.manage")).toBe(true);
  });
});
