"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";

type CheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export function PayPanel({ paymentId, amountPaise, planName }: { paymentId: string; amountPaise: number; planName: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setMessage(null);
    try {
      const opened = await fetch("/api/payments/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = await opened.json();
      if (!data.ok) {
        setMessage(data.error || "Payment could not be started.");
        setBusy(false);
        return;
      }
      await loadRazorpay();
      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "THE HOSTELS",
        description: data.description,
        order_id: data.orderId,
        prefill: { name: data.name, email: data.email, contact: data.phone },
        theme: { color: "#14283C" },
        handler: async (response: CheckoutResponse) => {
          const verified = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const result = await verified.json();
          if (result.ok) window.location.href = "/account?notice=Membership confirmed";
          else {
            setMessage(result.error || "The payment could not be verified. The membership was not activated.");
            setBusy(false);
          }
        },
        modal: { ondismiss: () => { setBusy(false); setMessage("The payment window was closed. Nothing has been marked as paid."); } },
      });
      checkout.on("payment.failed", async (payload: { error?: { description?: string } }) => {
        const reason = payload.error?.description || "Payment failed";
        await fetch("/api/payments/failed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, reason }),
        });
        setMessage(`${reason} The membership was not activated.`);
        setBusy(false);
      });
      checkout.open();
    } catch {
      setMessage("The payment window could not be opened. Nothing has been marked as paid.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="font-serif text-4xl text-navy">{formatINR(amountPaise)}</p>
      <p className="text-sm leading-6 text-ink/70">{planName} begins the day after a verified payment. A closed or failed payment leaves the membership pending.</p>
      {message ? <p role="alert" className="border border-navy/15 px-4 py-3 text-sm">{message}</p> : null}
      <button type="button" className="btn btn-navy" onClick={start} disabled={busy}>
        {busy ? "Waiting for payment" : "Pay with Razorpay"}
      </button>
    </div>
  );
}

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay failed to load"));
    document.body.appendChild(script);
  });
}
