import { MealServicePage, mealMetadata } from "@/components/meal-page";

export const metadata = mealMetadata("breakfast");

export default function Page() {
  return <MealServicePage meal="breakfast" />;
}
