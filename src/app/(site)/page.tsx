import { HomeCinema } from "@/components/home-cinema";
import { PlanGrid } from "@/components/editorial";
import { site } from "@/lib/config";
import { publishedPlans } from "@/lib/catalog";

export default async function HomePage() {
  const plans = await publishedPlans();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodService",
    name: "THE HOSTELS",
    description: site.description,
    url: site.url,
    servesCuisine: ["Indian", "International"],
    ...(site.email ? { email: site.email } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeCinema plans={<PlanGrid plans={plans} />} />
    </>
  );
}
