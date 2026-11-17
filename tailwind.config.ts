import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#14283C",
        ivory: "#F4EFE5",
        gold: "#B68A53",
        golddeep: "#7A5A32",
        sage: "#73816A",
        charcoal: "#171717",
        ink: "#1C1915",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        lift: "0 24px 60px rgba(20, 40, 60, 0.12)",
      },
      maxWidth: {
        page: "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
