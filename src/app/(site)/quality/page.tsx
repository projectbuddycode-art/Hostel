import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/editorial";
import { Film } from "@/components/film";

export const metadata: Metadata = {
  title: "Quality Standards",
  description: "How THE HOSTELS handles ingredients, the pass, allergens and packing. No certification is claimed here.",
  alternates: { canonical: "/quality" },
};

export default function QualityPage() {
  return (
    <>
      <PageIntro
        kicker="Quality and care"
        title="Standards we work to. Claims we will not invent."
        lede="Care is a practice. A certificate, when one is held, will be published with its number."
        film="dinner"
        start={0.6}
        position="center 35%"
        layout="split"
      />
      <section className="grid gap-6 px-5 py-16 md:grid-cols-2 md:px-14">
        <article className="relative min-h-[520px] overflow-hidden text-ivory">
          <Film name="lunch" start={0.3} position="center 65%" fill label="Lunch simmering in a kadai" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/75 via-transparent to-transparent" />
          <div className="relative z-10 flex h-full min-h-[520px] flex-col justify-end p-8">
            <p className="font-serif text-6xl text-ivory/30">01</p>
            <h2 className="font-serif text-4xl">Ingredients</h2>
            <p className="mt-3 max-w-sm text-sm leading-7 text-ivory/80">Dishes are written as they are cooked. Allergens on the menu are the ones the recipe is known to contain. The lunch film is the pan, not a catalogue photograph.</p>
          </div>
        </article>
        <div className="grid gap-6">
          <article className="relative min-h-[250px] overflow-hidden text-ivory">
            <Film name="hero" start={1} position="60% 40%" fill label="Plating at the pass" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
            <div className="relative z-10 flex h-full min-h-[250px] flex-col justify-end p-6">
              <h2 className="font-serif text-4xl">The pass</h2>
              <p className="mt-2 max-w-sm text-sm leading-7 text-ivory/80">Confirmed orders become the production list. Notes and acknowledged allergies travel with the ticket.</p>
            </div>
          </article>
          <article className="relative min-h-[250px] overflow-hidden text-ivory">
            <Film name="breakfast" start={8.4} fill label="Breakfast packed as a table" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
            <div className="relative z-10 flex h-full min-h-[250px] flex-col justify-end p-6">
              <h2 className="font-serif text-4xl">Packing</h2>
              <p className="mt-2 max-w-sm text-sm leading-7 text-ivory/80">A meal leaves after it is marked packed, for the address saved on the membership.</p>
            </div>
          </article>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-5 pb-24 text-base leading-8 text-ink/80">
        <p>This kitchen is a working kitchen. Cross-contact is possible. If your profile overlaps with an allergen on a dish, the order asks you to acknowledge that before it can be saved. That acknowledgement is a warning, not a guarantee of an allergen-free environment.</p>
        <p className="mt-4">We do not display awards, supplier seals or licence numbers we cannot verify.</p>
        <Link href="/menu" className="btn btn-line-dark mt-8">See the menu</Link>
      </section>
    </>
  );
}
