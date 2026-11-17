import type { Metadata } from "next";
import { PageIntro } from "@/components/editorial";

export const metadata: Metadata = { title: "Terms and Conditions", description: "The membership terms for THE HOSTELS.", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <>
      <PageIntro kicker="Terms" title="The agreement for a term of dining." lede="These terms describe how a membership, a credit and a cutoff work. Have them reviewed before you rely on them commercially." film="hero" start={4.2} layout="split" />
      <article className="mx-auto max-w-3xl space-y-5 px-5 py-16 text-base leading-8 text-ink/80">
        <p>A membership is the plan configured at the moment of verified payment. Price, meal services, credits, customisation and the length of the term are copied onto the membership. Later edits to the plan do not rewrite a term already paid.</p>
        <p>Credits are spent when a meal is confirmed and returned when that meal is skipped before cutoff. They are not a promise of a meal on every date. The daily ceiling on the plan still applies.</p>
        <p>Paying for a different plan starts a new term on the next day and closes the current one. Unused credits are not moved across. Delivery timing depends on zone and dispatch.</p>
        <p>Menus, allergens and instructions are shown before you confirm. A working kitchen cannot promise the absence of cross-contact. Nothing in these terms is intended to limit a right that applicable law does not allow to be limited.</p>
      </article>
    </>
  );
}
