import type { MetadataRoute } from "next";
import { site } from "@/lib/config";

const paths = [
  "",
  "/our-story",
  "/dining-experience",
  "/breakfast",
  "/lunch",
  "/dinner",
  "/menu",
  "/memberships",
  "/how-it-works",
  "/quality",
  "/corporate",
  "/contact",
  "/privacy",
  "/terms",
  "/cancellation",
  "/login",
  "/register",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: `${site.url}${path || "/"}`,
    lastModified: new Date(),
  }));
}
