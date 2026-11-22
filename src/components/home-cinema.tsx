"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { Film } from "@/components/film";
import type { FilmKey } from "@/lib/films";

const services: { film: FilmKey; index: string; title: string; line: string; copy: string; position: string; start: number }[] = [
  {
    film: "breakfast",
    index: "01",
    title: "Breakfast",
    line: "Fresh beginnings.",
    copy: "The morning film opens on butter melting into a paratha, then a South Indian table of dosa, idli, poha and fruit.",
    position: "center 40%",
    start: 0.4,
  },
  {
    film: "lunch",
    index: "02",
    title: "Lunch",
    line: "Thoughtfully prepared nourishment.",
    copy: "Lunch stays with the kadai, then the hands assembling a thali. The same film, seen from the pan to the tray.",
    position: "center center",
    start: 0.6,
  },
  {
    film: "dinner",
    index: "03",
    title: "Dinner",
    line: "An elevated end to the day.",
    copy: "Dinner begins with coriander on the curry and settles on biryani, naan and a laid evening table.",
    position: "center 45%",
    start: 0.5,
  },
];

export function HomeCinema({ plans }: { plans: React.ReactNode }) {
  return (
    <>
      <HeroFilm />
      <Philosophy />
      <HorizontalServices />
      <GrandTable />
      <HowItWorks />
      <section className="bg-ivory px-5 py-12 md:px-14 md:py-16">
        <div className="mx-auto max-w-page">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.32em] text-golddeep">Memberships</p>
              <h2 className="mt-3 font-serif text-5xl font-light text-navy md:text-6xl">Choose the shape of the day.</h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-ink/70">
              Prices and credits are the tariffs currently configured by the dining desk. They are not unlimited, and they can be revised for future terms.
            </p>
          </div>
          <div className="mt-8">{plans}</div>
        </div>
      </section>
      <QualityFilms />
      <Finale />
    </>
  );
}

function MaskedWords({ text, token, className }: { text: string; token: string; className: string }) {
  return (
    <span className={className} aria-hidden="true">
      {Array.from(text).map((char, index) => (
        <span key={`${token}-${index}`} data-mask={token} className="inline-block overflow-hidden align-bottom">
          <span className="inline-block">{char === " " ? "\u00A0" : char}</span>
        </span>
      ))}
    </span>
  );
}

function HeroFilm() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .fromTo("[data-rule]", { scaleX: 0 }, { scaleX: 1, duration: 0.75, ease: "power2.inOut" })
        .fromTo("[data-rule-label]", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.65 }, 0.2)
        .fromTo("[data-mask='kicker']", { y: 28, clipPath: "inset(0 0 100% 0)" }, { y: "0px", clipPath: "inset(0 0 0% 0)", duration: 0.62, stagger: 0.03 }, 0.32)
        .fromTo("[data-mask='title']", { y: 48, clipPath: "inset(0 0 100% 0)" }, { y: "0px", clipPath: "inset(0 0 0% 0)", duration: 0.85, stagger: 0.04 }, 0.78)
        .fromTo("[data-hero-copy]", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 1.45)
        .fromTo("[data-hero-cta]", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.12 }, 1.75);
      gsap.fromTo("[data-hero-video]", { scale: 1.06 }, { scale: 1, duration: 2.4, ease: "power2.out" });
    }, rootRef);
    return () => context.revert();
  }, [reduced]);

  return (
    <section ref={rootRef} className={`relative min-h-[100svh] overflow-hidden bg-charcoal text-ivory ${reduced ? "" : "hero-intro"}`}>
      <div data-hero-video className="absolute inset-0">
        <Film name="hero" eager className="h-full w-full" position="center 42%" label="Chefs preparing a grand dining table" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy/75 via-navy/30 to-transparent" />
      <div className="relative z-10 flex min-h-[100svh] flex-col justify-end px-5 pb-14 pt-28 md:px-14 md:pb-16">
        <div className="mb-6 flex items-center gap-4">
          <span data-rule className="block h-px w-14 origin-left bg-gold" />
          <span data-rule-label className="text-[0.68rem] uppercase tracking-[0.42em] text-gold">The Hostels</span>
        </div>
        <h1>
          <span className="sr-only">Everyday dining. Elevated.</span>
          <MaskedWords text="EVERYDAY DINING" token="kicker" className="block font-sans text-[clamp(0.78rem,1.7vw,1.2rem)] font-medium uppercase tracking-[0.38em] text-ivory" />
          <MaskedWords text="Elevated." token="title" className="mt-3 block font-serif text-[clamp(2.7rem,5.6vw,4.8rem)] font-light leading-none tracking-[-0.03em] text-ivory" />
        </h1>
        <p data-hero-copy className="mt-6 max-w-md text-[clamp(0.95rem,1.2vw,1.05rem)] leading-7 text-ivory/85">
          A thoughtfully curated daily dining experience, prepared with care and delivered to your doorstep.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link data-hero-cta className="btn btn-gold w-full transition duration-300 hover:-translate-y-0.5 sm:w-auto" href="/memberships">Explore Memberships</Link>
          <Link data-hero-cta className="btn btn-line w-full transition duration-300 hover:-translate-y-0.5 sm:w-auto" href="/dining-experience">Discover Our Experience</Link>
        </div>
      </div>
      <div className="absolute bottom-8 right-6 z-10 hidden flex-col items-center gap-3 md:flex" aria-hidden="true">
        <span className="text-[0.62rem] uppercase tracking-[0.32em] text-ivory/80">Scroll</span>
        <span className="scroll-line" />
      </div>
    </section>
  );
}

function Philosophy() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.from("[data-philosophy]", {
        y: 28,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: { trigger: node, start: "top 75%" },
      });
    }, node);
    return () => context.revert();
  }, []);

  return (
    <section ref={ref} className="relative bg-ivory px-5 py-12 md:px-14 md:py-16">
      <div className="mx-auto grid max-w-page items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p data-philosophy className="font-serif text-7xl text-gold/80">01</p>
          <p data-philosophy className="text-[0.68rem] uppercase tracking-[0.32em] text-golddeep">The house</p>
          <h2 data-philosophy className="mt-4 font-serif text-5xl font-light leading-[0.95] text-navy md:text-6xl">A dining room that comes to you.</h2>
          <p data-philosophy className="mt-6 max-w-md text-base leading-8 text-ink/80">
            THE HOSTELS is a daily dining membership, not a conventional tiffin round. The kitchen prepares a considered table. You choose, within your membership, how each day is set.
          </p>
          <p data-philosophy className="mt-4 max-w-md text-base leading-8 text-ink/80">
            Exceptional food. Thoughtfully prepared. Personalised around you. Delivered to your doorstep.
          </p>
          <Link data-philosophy href="/our-story" className="btn btn-line-dark mt-8">Read our story</Link>
        </div>
        <div data-philosophy-film className="relative">
          <div className="absolute -left-4 top-8 hidden h-[84%] w-px bg-gold md:block" />
          <Film name="hero" start={1.1} position="62% 42%" className="aspect-video w-full" label="A chef plating the opening of the grand dining film" />
        </div>
      </div>
    </section>
  );
}

function HorizontalServices() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(min-width: 900px)", () => {
      const tween = gsap.to(track, {
        x: () => -(Math.max(0, track.scrollWidth - window.innerWidth)),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          end: () => `+=${Math.max(window.innerWidth * 0.85, track.scrollWidth - window.innerWidth)}`,
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    window.addEventListener("resize", refresh);
    const timer = window.setTimeout(refresh, 350);
    return () => {
      window.removeEventListener("load", refresh);
      window.removeEventListener("resize", refresh);
      window.clearTimeout(timer);
      media.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="overflow-hidden bg-charcoal py-10 text-ivory md:py-12">
      <div ref={trackRef} className="flex flex-col gap-4 px-5 min-[900px]:w-max min-[900px]:flex-row min-[900px]:gap-6 min-[900px]:px-0 min-[900px]:pl-[calc((100vw-min(80vw,1080px))/2)] min-[900px]:pr-[calc((100vw-min(80vw,1080px))/2)]">
        {services.map((service) => (
          <article key={service.film} className="relative aspect-[4/3] w-full overflow-hidden min-[900px]:aspect-auto min-[900px]:h-[clamp(360px,60vh,620px)] min-[900px]:w-[min(80vw,1080px)] min-[900px]:shrink-0">
            <Film name={service.film} start={service.start} position={service.position} fill label={service.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/15 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-10">
              <p className="font-serif text-4xl text-ivory/35 md:text-5xl">{service.index}</p>
              <div className="max-w-lg">
                <p className="text-[0.68rem] uppercase tracking-[0.3em] text-gold">{service.line}</p>
                <h2 className="mt-3 font-serif text-[clamp(2.4rem,4vw,4rem)] font-light">{service.title}</h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-ivory/80">{service.copy}</p>
                <Link href={`/${service.film}`} className="btn btn-line mt-6">Enter {service.title}</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function GrandTable() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-charcoal text-ivory">
      <Film
        name="hero"
        scrub={{ from: 6.2, to: 9.7 }}
        position="center center"
        fill
        className="min-h-[100svh]"
        label="The wide dining room at the end of the grand table film"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-navy/20 to-transparent" />
      <div className="relative z-10 flex min-h-[100svh] items-end px-5 py-20 md:px-16">
        <div className="max-w-xl">
          <p className="font-serif text-7xl text-ivory/30">02</p>
          <p className="text-[0.68rem] uppercase tracking-[0.32em] text-gold">The grand table</p>
          <h2 className="mt-4 font-serif text-5xl font-light leading-[0.95] md:text-7xl">Abundance, without noise.</h2>
          <p className="mt-5 text-base leading-7 text-ivory/85">
            This is the same dining film, held on its final movement: curries, breads, pizza, salads, juices and dessert, then the room itself. Scroll and the picture moves with you.
          </p>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const steps = [
    ["01", "Choose your membership", "A configured plan sets the price, the services and the number of meal credits."],
    ["02", "Select your meals", "Breakfast, lunch and dinner appear only when your membership includes them."],
    ["03", "Personalise the day", "Portion, spice, sides and paid extras stay inside the rules of the plan."],
    ["04", "Enjoy doorstep delivery", "Confirmed meals move to the kitchen, then to the address saved on the membership."],
  ];

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.from("[data-step]", {
        y: 24,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: node, start: "top 72%" },
      });
    }, node);
    return () => context.revert();
  }, []);

  return (
    <section ref={ref} className="grid bg-ivory text-navy lg:grid-cols-[1.05fr_0.95fr]">
      <div className="mx-auto grid w-full max-w-3xl content-center gap-8 px-5 py-12 md:px-14 md:py-16">
        <div>
          <p className="font-serif text-7xl text-gold/80">03</p>
          <p className="text-[0.68rem] uppercase tracking-[0.32em] text-golddeep">The rhythm</p>
          <h2 className="mt-4 font-serif text-5xl font-light leading-none text-navy md:text-6xl">How the table works.</h2>
        </div>
        <div className="space-y-8 border-l border-gold/70 pl-6">
          {steps.map(([number, title, copy]) => (
            <article data-step key={number}>
              <p className="font-serif text-2xl text-golddeep">{number}</p>
              <h3 className="mt-1 font-serif text-3xl text-navy">{title}</h3>
              <p className="mt-2 max-w-md text-sm leading-7 text-ink/75">{copy}</p>
            </article>
          ))}
        </div>
      </div>
      <Film name="lunch" start={4.2} position="center 58%" className="min-h-[420px] lg:min-h-full" label="Lunch being plated" />
    </section>
  );
}

function QualityFilms() {
  return (
    <section className="bg-ivory px-5 py-12 md:px-14 md:py-14">
      <div className="mx-auto grid max-w-page gap-3 md:grid-cols-12 md:grid-rows-2">
        <article className="relative min-h-[420px] overflow-hidden text-ivory md:col-span-7 md:row-span-2">
          <Film name="dinner" start={0.8} position="center 30%" fill label="Finishing a dinner curry" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/75 via-transparent to-transparent" />
          <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-end p-8">
            <p className="text-[0.66rem] uppercase tracking-[0.28em] text-gold">The pass</p>
            <h2 className="mt-2 font-serif text-5xl">Preparation</h2>
            <p className="mt-3 max-w-sm text-sm leading-7 text-ivory/80">Confirmed orders become the kitchen list. The dinner film is the care itself: a finish of herbs, then the table.</p>
          </div>
        </article>
        <article className="relative min-h-[220px] overflow-hidden text-ivory md:col-span-5">
          <Film name="lunch" start={0.4} position="center 70%" fill label="A lunch curry simmering" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
          <div className="relative z-10 flex h-full min-h-[220px] items-end p-6">
            <h3 className="font-serif text-4xl">Ingredients</h3>
          </div>
        </article>
        <article className="relative min-h-[220px] overflow-hidden text-ivory md:col-span-5">
          <Film name="breakfast" start={8} position="center center" fill label="The breakfast table" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
          <div className="relative z-10 flex h-full min-h-[220px] items-end p-6">
            <h3 className="font-serif text-4xl">The morning table</h3>
          </div>
        </article>
      </div>
      <p className="mx-auto mt-6 max-w-3xl text-sm leading-7 text-ink/70">
        These are three of the four films, cropped to the gesture that matters. Allergens are printed with the dish. A working kitchen cannot promise the absence of cross-contact, and no certificate is shown here unless its number can be published.
      </p>
    </section>
  );
}

function Finale() {
  return (
    <section className="relative min-h-[78vh] overflow-hidden text-ivory">
      <Film name="dinner" start={8.2} position="center 40%" fill label="The evening table" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/25 to-transparent" />
      <div className="relative z-10 flex min-h-[78vh] flex-col items-center justify-center px-6 text-center">
        <span className="mb-8 h-px w-16 bg-gold" />
        <h2 className="max-w-4xl font-serif text-5xl font-light leading-[0.95] md:text-7xl">Make every day a better dining experience.</h2>
        <Link href="/memberships" className="btn btn-gold mt-10">Explore Memberships</Link>
      </div>
    </section>
  );
}
