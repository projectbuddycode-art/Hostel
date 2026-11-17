import type { Metadata } from "next";
import { contactAction } from "@/server/actions";
import { Notice, PageIntro } from "@/components/editorial";
import { site } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write to the dining desk at THE HOSTELS.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  return (
    <>
      <PageIntro kicker="Contact" title="The dining desk." lede="Questions about a membership, a meal or a delivery belong here." film="hero" start={2} position="30% center" layout="split" />
      <section className="mx-auto grid max-w-5xl gap-12 px-5 py-16 md:grid-cols-2">
        <div className="text-base leading-8 text-ink/80">
          {site.email ? <p>Email <a className="underline" href={`mailto:${site.email}`}>{site.email}</a></p> : <p>Leave a message. The desk replies to the email you provide.</p>}
          {site.phone ? <p className="mt-3">Telephone {site.phone}</p> : null}
          <p className="mt-4">Messages are stored as desk tickets. They are not a live chat, and a reply depends on the address you leave.</p>
        </div>
        <form action={contactAction} className="space-y-4">
          <Notice notice={query.notice} error={query.error} />
          <input type="hidden" name="topic" value="general" />
          <label className="block text-sm">Name<input className="field mt-2" name="name" required autoComplete="name" /></label>
          <label className="block text-sm">Email<input className="field mt-2" type="email" name="email" required autoComplete="email" /></label>
          <label className="block text-sm">Phone<input className="field mt-2" name="phone" autoComplete="tel" /></label>
          <label className="block text-sm">Subject<input className="field mt-2" name="subject" required /></label>
          <label className="block text-sm">Message<textarea className="field mt-2 min-h-32" name="message" required /></label>
          <button className="btn btn-navy" type="submit">Send</button>
        </form>
      </section>
    </>
  );
}
