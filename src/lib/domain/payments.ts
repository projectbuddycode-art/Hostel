import crypto from "crypto";

export type PaymentStatus = "CREATED" | "PAID" | "FAILED" | "REFUNDED";

export function checkoutSignature(orderId: string, paymentId: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  const expected = checkoutSignature(input.orderId, input.paymentId, input.secret);
  return safeEqual(expected, input.signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

export function nextPaymentTransition(
  current: string,
  event: "captured" | "failed",
): { apply: boolean; status: PaymentStatus } {
  if (current === "PAID" || current === "REFUNDED") {
    return { apply: false, status: current };
  }
  if (event === "failed") {
    if (current === "FAILED") return { apply: false, status: "FAILED" };
    return { apply: true, status: "FAILED" };
  }
  if (current !== "CREATED") return { apply: false, status: current as PaymentStatus };
  return { apply: true, status: "PAID" };
}

export function refundableBalance(amountPaise: number, refundedPaise: number): number {
  return Math.max(0, amountPaise - refundedPaise);
}

function safeEqual(expected: string, provided: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
