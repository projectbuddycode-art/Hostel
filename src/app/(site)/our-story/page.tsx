import type { Metadata } from "next";
import { Film } from "@/components/film";
import { PageIntro } from "@/components/editorial";

export const metadata: Metadata = {
  title: "Our Story",
  description: "THE HOSTELS is a daily dining membership built around care, variety and a clear entitlement.",
  alternates: { canonical: "/our-story" },
};

export default function OurStoryPage() {
  return (
    <>
      <PageIntro
        kicker="Our story"
        title="Everyday dining, held to a higher standard."
        lede="The house exists for people who want a proper meal without turning every evening into a reservation."
        film="hero"
        start={3.8}
        position="center 50%"
      />
      <section className="grid items-center md:grid-cols-[1.1fr_0.9fr]">
        <article className="px-5 py-20 md:px-14 md:py-28">
          <p className="font-serif text-3xl leading-snug text-navy">We began with a simple dissatisfaction: daily food had become either an errand or a compromise.</p>
          <div className="mt-8 max-w-xl space-y-6 text-base leading-8 text-ink/80">
            <p>THE HOSTELS treats the day as three services. Breakfast can be quiet. Lunch can be sustaining. Dinner can feel like the room in the film, even when it arrives at the door. The membership is the agreement that makes that possible: a price, a number of credits, and a menu the kitchen is actually cooking.</p>
            <p>There is no invented heritage and no borrowed award. The standard is visible in the plate, the cutoff, and the way an allergy is carried from your profile to the kitchen ticket.</p>
            <p>Indian cooking sits at the centre. Italian plates, salads and juices share the table when the menu says so. Variety is hospitality. It is not a promise that every dish is available every day.</p>
          </div>
        </article>
        <Film name="hero" start={2} position="42% center" className="aspect-video min-h-[320px] w-full md:aspect-auto md:min-h-[560px]" label="A drink poured during the dining film" />
      </section>
      <Film name="hero" scrub={{ from: 7.4, to: 9.8 }} position="center 46%" className="aspect-video w-full md:aspect-auto md:h-[78vh]" label="The dining room revealed at the end of the film" />
    </>
  );
}
