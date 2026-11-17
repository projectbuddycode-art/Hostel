import { MealServicePage, mealMetadata } from "@/components/meal-page";

export const metadata = mealMetadata("lunch");

export default function Page() {
  return <MealServicePage meal="lunch" />;
}
