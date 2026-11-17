import type { Metadata } from "next";
import { contactAction } from "@/server/actions";
import { Notice, PageIntro } from "@/components/editorial";

export const metadata: Metadata = {
  title: "Corporate Dining",
  description: "A private dining proposal for offices and households that need more than a published membership.",
  alternates: { canonical: "/corporate" },
};

export default async function CorporatePage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  return (
    <>
      <PageIntro
        kicker="Corporate"
        title="A table for the office."
        lede="Family Table and office dining are priced to the brief. Tell us the headcount, the services and the address."
        film="dinner"
        start={8.2}
      />
      <section className="mx-auto grid max-w-5xl gap-12 px-5 py-16 md:grid-cols-[1fr_1fr]">
        <div className="text-base leading-8 text-ink/80">
          <p>There is no published rate for a private table, and this page will not invent one. A proposal follows a conversation about days, meals, dietary needs and where the food has to arrive.</p>
          <p className="mt-4">We do not list client logos. If we cook for a company, that relationship stays theirs to mention.</p>
        </div>
        <form action={contactAction} className="space-y-4 border border-navy/10 bg-white/50 p-6">
          <Notice notice={query.notice} error={query.error} />
          <input type="hidden" name="topic" value="corporate" />
          <label className="block text-sm">Name<input className="field mt-2" name="name" required autoComplete="name" /></label>
          <label className="block text-sm">Work email<input className="field mt-2" type="email" name="email" required autoComplete="email" /></label>
          <label className="block text-sm">Phone<input className="field mt-2" name="phone" autoComplete="tel" /></label>
          <label className="block text-sm">Subject<input className="field mt-2" name="subject" required defaultValue="Corporate dining" /></label>
          <label className="block text-sm">The brief<textarea className="field mt-2 min-h-32" name="message" required placeholder="Headcount, services, locality, dietary notes" /></label>
          <button className="btn btn-navy" type="submit">Request a proposal</button>
        </form>
      </section>
    </>
  );
}
