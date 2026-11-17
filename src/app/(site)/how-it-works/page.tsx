import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/editorial";

export const metadata: Metadata = {
  title: "How It Works",
  description: "Choose a membership, select meals before cutoff, and receive them at your saved address.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowPage() {
  return (
    <>
      <PageIntro
        kicker="The rhythm"
        title="A clear way to eat well, daily."
        lede="Four steps, with the rules visible before you pay."
        film="breakfast"
        start={4}
        position="center 55%"
      />
      <section className="mx-auto max-w-3xl space-y-10 px-5 py-20">
        {[
          ["Choose a membership", "Each plan publishes its price, the meals it includes, the credits in the term, and how much you may customise. Family Table is arranged privately and is not charged online."],
          ["Create your table", "Registration asks for your name, a way to reach you, a delivery address, and anything the kitchen should know about diet or allergies."],
          ["Select before cutoff", "The calendar shows only the services in your plan. A meal can be changed or skipped until the cutoff stored on that menu, usually twelve hours before service."],
          ["The kitchen cooks the confirmed list", "After cutoff, the order is with the kitchen. Paid extras are priced from the catalogue, not from the browser. Delivery follows the zone on your address."],
        ].map(([title, body], index) => (
          <article key={title}>
            <p className="font-serif text-3xl text-gold">0{index + 1}</p>
            <h2 className="mt-2 font-serif text-4xl text-navy">{title}</h2>
            <p className="mt-3 text-base leading-8 text-ink/80">{body}</p>
          </article>
        ))}
        <Link href="/memberships" className="btn btn-navy">Explore Memberships</Link>
      </section>
    </>
  );
}
