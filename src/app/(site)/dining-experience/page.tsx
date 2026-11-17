import type { Metadata } from "next";
import Link from "next/link";
import { Film } from "@/components/film";
import { PageIntro } from "@/components/editorial";
import type { FilmKey } from "@/lib/films";

export const metadata: Metadata = {
  title: "Dining Experience",
  description: "Breakfast, lunch and dinner as three distinct services from one kitchen.",
  alternates: { canonical: "/dining-experience" },
};

const services: { film: FilmKey; title: string; copy: string; start: number; position: string }[] = [
  { film: "breakfast", title: "Breakfast", copy: "The morning film moves from a buttered paratha to a full South Indian table.", start: 0.2, position: "center 35%" },
  { film: "lunch", title: "Lunch", copy: "A kadai, a thali, and an international plate only when it is actually on the menu.", start: 3.5, position: "center center" },
  { film: "dinner", title: "Dinner", copy: "Biryani, curry and a laid table. The day closes with more ceremony than haste.", start: 6.5, position: "center 40%" },
];

export default function DiningPage() {
  return (
    <>
      <PageIntro
        kicker="Our experience"
        title="Three services. One standard of care."
        lede="Each meal has its own film, its own hour, and its own place in the membership."
        film="hero"
        start={2.1}
        position="35% center"
      />
      {services.map((service, index) => (
        <article key={service.film} className={`grid min-h-[80vh] ${index % 2 ? "md:grid-cols-[0.8fr_1.2fr]" : "md:grid-cols-[1.2fr_0.8fr]"}`}>
          <Film
            name={service.film}
            start={service.start}
            position={service.position}
            className={`aspect-video w-full md:aspect-auto md:min-h-[560px] ${index % 2 ? "md:order-2" : ""}`}
            label={service.title}
          />
          <div className="flex flex-col justify-center bg-ivory px-6 py-16 md:px-12">
            <p className="font-serif text-6xl text-gold/70">0{index + 1}</p>
            <h2 className="mt-2 font-serif text-6xl text-navy">{service.title}</h2>
            <p className="mt-4 max-w-md text-base leading-8 text-ink/80">{service.copy}</p>
            <Link href={`/${service.film}`} className="btn btn-line-dark mt-8 w-fit">View {service.title}</Link>
          </div>
        </article>
      ))}
    </>
  );
}
