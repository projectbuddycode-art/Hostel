import Link from "next/link";
import { Film } from "@/components/film";
import type { FilmKey } from "@/lib/films";
import { formatINR, titleCase } from "@/lib/format";

export function PageIntro({
  kicker,
  title,
  lede,
  film,
  position = "center center",
  start = 0,
  layout = "overlay",
}: {
  kicker: string;
  title: string;
  lede: string;
  film: FilmKey;
  position?: string;
  start?: number;
  layout?: "overlay" | "split";
}) {
  if (layout === "split") {
    return (
      <section className="grid min-h-[78vh] bg-navy text-ivory md:grid-cols-2">
        <div className="flex flex-col justify-end px-5 pb-14 pt-32 md:px-12 md:pb-20">
          <p className="text-[0.68rem] uppercase tracking-[0.32em] text-gold">{kicker}</p>
          <h1 className="mt-4 max-w-lg font-serif text-5xl font-light leading-[0.95] md:text-7xl">{title}</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-ivory/78">{lede}</p>
        </div>
        <Film name={film} eager position={position} start={start} className="min-h-[360px]" label={title} />
      </section>
    );
  }
  return (
    <section className="relative min-h-[82vh] overflow-hidden bg-navy text-ivory">
      <Film name={film} eager position={position} start={start} fill className="min-h-[82vh]" label={title} />
      <div className="absolute inset-0 bg-gradient-to-r from-navy/78 via-navy/28 to-transparent" />
      <div className="relative z-10 flex min-h-[82vh] flex-col justify-end px-5 pb-16 pt-32 md:px-14">
        <p className="text-[0.68rem] uppercase tracking-[0.32em] text-gold">{kicker}</p>
        <h1 className="mt-4 max-w-3xl font-serif text-5xl font-light leading-[0.95] md:text-7xl">{title}</h1>
        <p className="mt-6 max-w-md text-base leading-7 text-ivory/80">{lede}</p>
      </div>
    </section>
  );
}

export function Notice({ notice, error }: { notice?: string; error?: string }) {
  if (!notice && !error) return null;
  return (
    <p role={error ? "alert" : "status"} className={`mb-6 border px-4 py-3 text-sm ${error ? "border-red-900/30 text-red-900" : "border-sage/40 text-navy"}`}>
      {error || notice}
    </p>
  );
}

export type PlanView = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  pricePaise: number;
  priceNote: string;
  mealsPerDay: number;
  mealTypes: string[];
  durationDays: number;
  mealCredits: number;
  maxAddons: number;
  purchasable: boolean;
  deliveryConditions: string;
};

export function PlanGrid({ plans }: { plans: PlanView[] }) {
  if (!plans.length) {
    return <p className="text-ink/70">Memberships are being prepared by the dining desk.</p>;
  }
  const filmFor = (slug: string): FilmKey => {
    if (slug.includes("family")) return "breakfast";
    if (slug.includes("signature")) return "hero";
    if (slug.includes("complete")) return "dinner";
    return "lunch";
  };
  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {plans.map((plan, index) => (
        <article key={plan.slug} className="group flex flex-col overflow-hidden border border-navy/10 bg-white/60 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
          <Film name={filmFor(plan.slug)} start={index + 1.2} position={index % 2 ? "center 30%" : "center 70%"} className="h-44" label="" />
          <div className="flex flex-1 flex-col p-6">
          <p className="text-[0.66rem] uppercase tracking-[0.22em] text-golddeep">{`${plan.mealsPerDay} ${plan.mealsPerDay === 1 ? "meal" : "meals"} a day, at most`}</p>
          <h3 className="mt-4 font-serif text-4xl text-navy">{plan.name}</h3>
          <p className="mt-3 text-sm leading-6 text-ink/75">{plan.tagline}</p>
          <p className="mt-6 font-serif text-3xl text-navy">{plan.purchasable ? formatINR(plan.pricePaise) : "By arrangement"}</p>
          <p className="mt-2 text-xs leading-5 text-ink/60">{plan.priceNote}</p>
          <ul className="mt-6 space-y-2 text-sm text-ink/80">
            <li>{plan.mealCredits} meal credits · {plan.durationDays} days</li>
            <li>{plan.mealTypes.map(titleCase).join(", ")}</li>
            <li>{`${plan.maxAddons} paid ${plan.maxAddons === 1 ? "extra" : "extras"} per meal`}</li>
          </ul>
          <Link href={plan.purchasable ? `/memberships/${plan.slug}` : "/corporate"} className="btn btn-navy mt-8">
            {plan.purchasable ? "View membership" : "Request a proposal"}
          </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
