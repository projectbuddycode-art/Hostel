import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  checkoutSignature,
  nextPaymentTransition,
  refundableBalance,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "@/lib/domain/payments";

describe("payment verification", () => {
  it("accepts a matching checkout signature and rejects a mismatch", () => {
    const signature = checkoutSignature("order_1", "pay_1", "secret");
    expect(verifyCheckoutSignature({ orderId: "order_1", paymentId: "pay_1", signature, secret: "secret" })).toBe(true);
    expect(verifyCheckoutSignature({ orderId: "order_1", paymentId: "pay_1", signature, secret: "other" })).toBe(false);
    expect(verifyCheckoutSignature({ orderId: "order_1", paymentId: "pay_2", signature, secret: "secret" })).toBe(false);
  });

  it("verifies webhook bodies", () => {
    const raw = JSON.stringify({ event: "payment.captured" });
    const signature = createHmac("sha256", "hook").update(raw).digest("hex");
    expect(verifyWebhookSignature(raw, signature, "hook")).toBe(true);
    expect(verifyWebhookSignature(raw, signature, "other")).toBe(false);
  });

  it("applies a capture once and never turns a failure into a success", () => {
    expect(nextPaymentTransition("CREATED", "captured")).toEqual({ apply: true, status: "PAID" });
    expect(nextPaymentTransition("PAID", "captured")).toEqual({ apply: false, status: "PAID" });
    expect(nextPaymentTransition("REFUNDED", "captured")).toEqual({ apply: false, status: "REFUNDED" });
    expect(nextPaymentTransition("FAILED", "captured").apply).toBe(false);
    expect(nextPaymentTransition("CREATED", "failed")).toEqual({ apply: true, status: "FAILED" });
    expect(nextPaymentTransition("FAILED", "failed")).toEqual({ apply: false, status: "FAILED" });
    expect(nextPaymentTransition("PAID", "failed")).toEqual({ apply: false, status: "PAID" });
  });

  it("keeps refunds inside the captured amount", () => {
    expect(refundableBalance(1550000, 0)).toBe(1550000);
    expect(refundableBalance(1550000, 550000)).toBe(1000000);
    expect(refundableBalance(100, 150)).toBe(0);
  });
});
