import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { site } from "@/lib/config";
import "./globals.css";

const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const sans = Outfit({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "THE HOSTELS", template: "%s · THE HOSTELS" },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "THE HOSTELS",
    description: site.description,
    url: site.url,
    siteName: "THE HOSTELS",
    images: [{ url: "/images/grand-table.jpg", width: 1800, height: 1012, alt: "A long dining table laid with Indian and Italian dishes, salads, juices and desserts." }],
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:bg-ivory focus:px-4 focus:py-2">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
