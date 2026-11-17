"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const experience = [
  { href: "/dining-experience", label: "The dining experience" },
  { href: "/breakfast", label: "Breakfast" },
  { href: "/lunch", label: "Lunch" },
  { href: "/dinner", label: "Dinner" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/quality", label: "Quality and care" },
  { href: "/corporate", label: "Corporate dining" },
];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={light ? "text-ivory" : "text-navy"}>
      <span className="block font-serif text-[1.2rem] leading-none tracking-[0.22em]">THE HOSTELS</span>
      <span className="mt-1 block text-[0.58rem] uppercase tracking-[0.38em] text-gold">Everyday dining</span>
    </span>
  );
}

export function Header({ user }: { user: { name: string; role: string } | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const filmHero =
    pathname === "/" ||
    pathname === "/our-story" ||
    pathname === "/dining-experience" ||
    pathname === "/memberships" ||
    pathname.startsWith("/memberships/") ||
    pathname === "/breakfast" ||
    pathname === "/lunch" ||
    pathname === "/dinner" ||
    pathname === "/how-it-works" ||
    pathname === "/corporate" ||
    pathname === "/quality" ||
    pathname === "/menu" ||
    pathname === "/contact" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/cancellation";
  const overHero = filmHero && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const link = overHero ? "text-ivory/90 hover:text-ivory" : "text-navy/80 hover:text-navy";

  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${overHero ? "bg-transparent" : "border-b border-navy/10 bg-ivory"} ${open ? "" : "backdrop-blur"}`}>
      <div className="mx-auto flex h-20 max-w-page items-center justify-between px-5 md:px-10">
        <Link href="/" aria-label="THE HOSTELS home">
          <Logo light={overHero} />
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          <details className="relative">
            <summary className={`cursor-pointer list-none text-[0.72rem] uppercase tracking-[0.18em] ${link}`}>Our Experience</summary>
            <div className="absolute left-0 top-8 w-64 border border-navy/10 bg-ivory p-3 text-navy shadow-lift">
              {experience.map((item) => (
                <Link key={item.href} href={item.href} className="block px-3 py-2 text-sm hover:bg-navy/5">
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
          {[
            ["/menu", "Menu"],
            ["/memberships", "Memberships"],
            ["/our-story", "Our Story"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className={`text-[0.72rem] uppercase tracking-[0.18em] ${link}`}>
              {label}
            </Link>
          ))}
          {user?.role === "CUSTOMER" || user?.role === "ADMIN" ? (
            <Link href={user.role === "CUSTOMER" ? "/account" : "/admin"} className={`text-[0.72rem] uppercase tracking-[0.18em] ${link}`}>
              {user.role === "CUSTOMER" ? "Your Table" : "Desk"}
            </Link>
          ) : (
            <Link href="/login" className={`text-[0.72rem] uppercase tracking-[0.18em] ${link}`}>
              Sign In
            </Link>
          )}
          <Link href="/memberships" className={overHero ? "btn btn-gold" : "btn btn-navy"}>
            Explore Memberships
          </Link>
        </nav>
        <button
          type="button"
          className={`lg:hidden text-[0.72rem] uppercase tracking-[0.18em] ${overHero ? "text-ivory" : "text-navy"}`}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 top-0 z-50 flex flex-col overflow-y-auto bg-ivory px-6 pb-10 pt-8 text-navy lg:hidden"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" className="text-[0.72rem] uppercase tracking-[0.18em]" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <div className="mt-12 flex flex-col gap-5 font-serif text-4xl">
              {experience.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/menu">Menu</Link>
              <Link href="/memberships">Memberships</Link>
              <Link href="/our-story">Our Story</Link>
              <Link href={user ? (user.role === "CUSTOMER" ? "/account" : "/admin") : "/login"}>{user ? "Your table" : "Sign in"}</Link>
            </div>
            <Link href="/memberships" className="btn btn-navy mt-auto">
              Explore Memberships
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

export function Footer({ email, phone, instagram }: { email: string; phone: string; instagram: string }) {
  return (
    <footer className="bg-navy text-ivory">
      <div className="mx-auto grid max-w-page gap-12 px-5 py-16 md:grid-cols-[1.3fr_1fr_1fr] md:px-10">
        <div>
          <Logo light />
          <p className="mt-6 max-w-sm text-sm leading-7 text-ivory/75">
            A daily dining membership. The kitchen cooks. You decide how the day should taste. Meals are delivered to the address on your membership.
          </p>
        </div>
        <div>
          <p className="text-[0.66rem] uppercase tracking-[0.22em] text-gold">Visit</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-ivory/80">
            <Link href="/dining-experience">Our experience</Link>
            <Link href="/menu">Menu</Link>
            <Link href="/memberships">Memberships</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/our-story">Our story</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <p className="text-[0.66rem] uppercase tracking-[0.22em] text-gold">Correspondence</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-ivory/80">
            {email ? <a href={`mailto:${email}`}>{email}</a> : <span>Write through the contact desk.</span>}
            {phone ? <a href={`tel:${phone}`}>{phone}</a> : null}
            {instagram ? (
              <a href={instagram} rel="noreferrer">
                Instagram
              </a>
            ) : null}
            <Link href="/corporate">Corporate dining</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-page flex-col gap-3 px-5 py-5 text-[0.68rem] uppercase tracking-[0.16em] text-ivory/70 md:flex-row md:items-center md:justify-between md:px-10">
          <p>© {new Date().getFullYear()} THE HOSTELS</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cancellation">Cancellation</Link>
          </div>
        </div>
        <div className="mx-auto max-w-page px-5 pb-6 md:px-10">
          <Link href="/admin/login" className="text-[0.68rem] text-ivory/80 underline-offset-4 hover:underline">
            Admin Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
