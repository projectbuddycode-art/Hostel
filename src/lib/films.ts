const revision = "?v=4";

export const films = {
  hero: {
    label: "Grand dining",
    poster: `/videos/posters/hero.jpg${revision}`,
    desktop: `/videos/hero.mp4${revision}`,
    webm: `/videos/hero.webm${revision}`,
    mobile: `/videos/hero-mobile.mp4${revision}`,
    still: "/images/grand-table.jpg",
  },
  breakfast: {
    label: "Breakfast",
    poster: `/videos/posters/breakfast.jpg${revision}`,
    desktop: `/videos/breakfast.mp4${revision}`,
    webm: `/videos/breakfast.webm${revision}`,
    mobile: `/videos/breakfast-mobile.mp4${revision}`,
    still: "/images/breakfast-table.jpg",
  },
  lunch: {
    label: "Lunch",
    poster: `/videos/posters/lunch.jpg${revision}`,
    desktop: `/videos/lunch.mp4${revision}`,
    webm: `/videos/lunch.webm${revision}`,
    mobile: `/videos/lunch-mobile.mp4${revision}`,
    still: "/images/lunch-thali.jpg",
  },
  dinner: {
    label: "Dinner",
    poster: `/videos/posters/dinner.jpg${revision}`,
    desktop: `/videos/dinner.mp4${revision}`,
    webm: `/videos/dinner.webm${revision}`,
    mobile: `/videos/dinner-mobile.mp4${revision}`,
    still: "/images/dinner-table.jpg",
  },
} as const;

export type FilmKey = keyof typeof films;
