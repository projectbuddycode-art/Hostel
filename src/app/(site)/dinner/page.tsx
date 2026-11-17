import { MealServicePage, mealMetadata } from "@/components/meal-page";

export const metadata = mealMetadata("dinner");

export default function Page() {
  return <MealServicePage meal="dinner" />;
}
