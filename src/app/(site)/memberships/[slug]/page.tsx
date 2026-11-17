import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Film } from "@/components/film";
import { prisma } from "@/lib/db";
import type { FilmKey } from "@/lib/films";
import { parseList } from "@/lib/json";
import { formatINR, titleCase } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const plan = await prisma.plan.findUnique({ where: { slug } });
  return {
    title: plan?.name || "Membership",
    description: plan?.tagline || "A THE HOSTELS membership.",
    alternates: { canonical: `/memberships/${slug}` },
  };
}

export default async function MembershipDetail({ params }: Props) {
  const { slug } = await params;
  const plan = await prisma.plan.findUnique({ where: { slug } });
  if (!plan || !plan.active) notFound();
  const meals = parseList(plan.mealTypes);
  const film: FilmKey = slug.includes("family") ? "breakfast" : slug.includes("signature") ? "hero" : slug.includes("complete") ? "dinner" : "lunch";
  return (
    <>
    <section className="relative min-h-[58vh]">
      <Film name={film} start={3.2} fill className="min-h-[58vh]" label={plan.name} />
      <div className="absolute inset-0 bg-gradient-to-t from-ivory via-ivory/20 to-navy/30" />
    </section>
    <article className="relative z-10 mx-auto -mt-28 max-w-3xl bg-ivory/90 px-5 pb-24 pt-10 backdrop-blur-sm">
      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-golddeep">Membership</p>
      <h1 className="mt-3 font-serif text-6xl font-light text-navy">{plan.name}</h1>
      <p className="mt-4 text-lg leading-8 text-ink/80">{plan.description}</p>
      <p className="mt-8 font-serif text-5xl text-navy">{plan.purchasable ? formatINR(plan.pricePaise) : "By arrangement"}</p>
      <p className="mt-2 text-sm leading-6 text-ink/65">{plan.priceNote}</p>
      <dl className="mt-10 space-y-4 text-sm leading-6">
        <div><dt className="uppercase tracking-[0.16em] text-golddeep">Services</dt><dd>{meals.map(titleCase).join(", ")}</dd></div>
        <div><dt className="uppercase tracking-[0.16em] text-golddeep">Daily ceiling</dt><dd>{plan.mealsPerDay} confirmed meal{plan.mealsPerDay === 1 ? "" : "s"} on a date.</dd></div>
        <div><dt className="uppercase tracking-[0.16em] text-golddeep">Credits</dt><dd>{plan.purchasable ? `${plan.mealCredits} across ${plan.durationDays} days` : "Set in the proposal."}</dd></div>
        <div><dt className="uppercase tracking-[0.16em] text-golddeep">Customisation</dt><dd>{plan.allowSides ? "Sides. " : ""}{plan.allowBread ? "Bread or rice. " : ""}{plan.allowInstructions ? `Notes up to ${plan.maxInstructionLength} characters. ` : "No special instructions. "}{plan.maxAddons} paid extra{plan.maxAddons === 1 ? "" : "s"}.</dd></div>
        <div><dt className="uppercase tracking-[0.16em] text-golddeep">Pause</dt><dd>{plan.pauseMinDays} to {plan.pauseMaxDays} days. The term extends by the days you pause.</dd></div>
        <div><dt className="uppercase tracking-[0.16em] text-golddeep">Delivery</dt><dd>{plan.deliveryConditions}</dd></div>
        <div><dt className="uppercase tracking-[0.16em] text-golddeep">Cancellation</dt><dd>{plan.cancellationRules}</dd></div>
        <div><dt className="uppercase tracking-[0.16em] text-golddeep">Changing plans</dt><dd>{plan.upgradeNotes}</dd></div>
      </dl>
      {plan.purchasable ? (
        <Link href={`/checkout/${plan.slug}`} className="btn btn-navy mt-10">Continue to checkout</Link>
      ) : (
        <Link href="/corporate" className="btn btn-navy mt-10">Request a proposal</Link>
      )}
    </article>
    </>
  );
}
