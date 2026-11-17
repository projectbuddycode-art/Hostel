import type { Metadata } from "next";
import Link from "next/link";
import { Film } from "@/components/film";
import { PageIntro } from "@/components/editorial";
import { prisma } from "@/lib/db";
import { parseList } from "@/lib/json";
import type { FilmKey } from "@/lib/films";

const copy: Record<FilmKey, { kicker: string; title: string; lede: string; alt: string; body: string }> = {
  hero: {
    kicker: "The table",
    title: "The long table.",
    lede: "Indian and Italian plates, salads, juices and dessert, held in one room.",
    alt: "A banquet table of mixed cuisine.",
    body: "The grand dining film is the house in one sequence: the pass, the spread, and the room.",
  },
  breakfast: {
    kicker: "Morning",
    title: "Fresh beginnings.",
    lede: "Paratha, dosa, idli, poha and the small ceremonies of the morning.",
    alt: "A breakfast table with paratha, dosa, idli, poha, sambar and chai.",
    body: "Breakfast in the film begins with butter on a layered paratha and opens into a South Indian morning: dosa, idli, poha, sambar and fruit. The published menu follows that mood, and changes with what the kitchen schedules.",
  },
  lunch: {
    kicker: "Midday",
    title: "A considered lunch.",
    lede: "The kadai, the thali, and enough bread or rice to make the plate complete.",
    alt: "A brass thali of curries, chutneys, salad and naan.",
    body: "Lunch starts in the pan and ends as a composed tray. Paneer, dal, salad and a vegetable pizza sit on the menu as distinct choices, not as an unlimited spread.",
  },
  dinner: {
    kicker: "Evening",
    title: "An elevated end to the day.",
    lede: "Biryani, a copper-pot curry, naan and the quieter light of evening.",
    alt: "An evening table set with biryani, curry, naan and wine glasses.",
    body: "Dinner is the most ceremonial of the three services. The film moves from a coriander finish on the curry to a table laid for the evening. Choose within the credits you hold.",
  },
};

export function mealMetadata(meal: Exclude<FilmKey, "hero">): Metadata {
  const page = copy[meal];
  return { title: page.title, description: page.lede, alternates: { canonical: `/${meal}` } };
}

export async function MealServicePage({ meal }: { meal: Exclude<FilmKey, "hero"> }) {
  const page = copy[meal];
  const dishes = await prisma.dish.findMany({ where: { mealType: meal, active: true }, orderBy: { name: "asc" } });
  return (
    <>
      <PageIntro kicker={page.kicker} title={page.title} lede={page.lede} film={meal} />
      <section className="grid min-h-[70vh] md:grid-cols-2">
        <Film name={meal} start={6.8} position={meal === "breakfast" ? "center 45%" : meal === "dinner" ? "center 40%" : "center 55%"} className="aspect-video w-full md:aspect-auto md:min-h-[520px]" label={`${page.title} later in the film`} />
        <div className="flex flex-col justify-center px-6 py-16 md:px-14">
          <h2 className="font-serif text-4xl text-navy">From the film</h2>
          <p className="mt-5 text-base leading-8 text-ink/80">{page.body}</p>
          <Link href="/memberships" className="btn btn-navy mt-8 w-fit">
            Explore Memberships
          </Link>
        </div>
      </section>
      <section className="px-5 pb-24 md:px-14">
        <h2 className="font-serif text-4xl text-navy">On the menu</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {dishes.map((dish) => (
            <article key={dish.id} className="border border-navy/10 bg-white/40 p-5">
              <div>
                <h3 className="font-serif text-2xl text-navy">{dish.name}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/75">{dish.description}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-golddeep">
                  {parseList(dish.dietaryTags).join(" · ") || "Kitchen menu"}
                  {parseList(dish.allergens).length ? ` · Allergens: ${parseList(dish.allergens).join(", ")}` : ""}
                </p>
              </div>
            </article>
          ))}
          {!dishes.length ? <p>The kitchen has not published this service yet.</p> : null}
        </div>
      </section>
    </>
  );
}
