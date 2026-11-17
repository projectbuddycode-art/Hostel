import type { Metadata } from "next";
import { PageIntro } from "@/components/editorial";

export const metadata: Metadata = {
  title: "Cancellation and Refund Policy",
  description: "How pauses, cancellations and refunds are handled.",
  alternates: { canonical: "/cancellation" },
};

export default function CancellationPage() {
  return (
    <>
      <PageIntro kicker="Cancellation" title="Pause, cancel, refund." lede="A cancellation stops the kitchen. It does not, by itself, return money." film="dinner" start={4} layout="split" />
      <article className="mx-auto max-w-3xl space-y-5 px-5 py-16 text-base leading-8 text-ink/80">
        <p>You can pause an active membership for the number of days the plan allows. The pause begins the next day at the earliest, so a meal already with the kitchen is undisturbed. The end of the term moves by the days you actually pause.</p>
        <p>Cancelling withdraws future meals that are still before cutoff. Meals past cutoff are prepared. Cancellation does not mark a payment as refunded.</p>
        <p>Refunds are recorded by an administrator. An online payment is refunded through Razorpay only when the gateway credentials are present and the refund call succeeds. An offline payment can be recorded as refunded when the money was returned outside the gateway. A refund does not automatically reopen or close a membership.</p>
      </article>
    </>
  );
}
