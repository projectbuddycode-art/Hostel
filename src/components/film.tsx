"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { films, type FilmKey } from "@/lib/films";

type Scrub = { from: number; to: number };

export function Film({
  name,
  className = "",
  position = "center center",
  start = 0,
  eager = false,
  scrub,
  label,
  fill = false,
}: {
  name: FilmKey;
  className?: string;
  position?: string;
  start?: number;
  eager?: boolean;
  scrub?: Scrub;
  label?: string;
  fill?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const item = films[name];

  useEffect(() => {
    const video = videoRef.current;
    const frame = frameRef.current;
    if (!video || !frame) return;
    if (eager) video.setAttribute("fetchpriority", "high");
    const kick = () => {
      if (reduced) {
        video.pause();
        return;
      }
      if (video.paused) video.play().catch(() => undefined);
    };

    kick();
    video.addEventListener("loadeddata", kick);
    const query = window.matchMedia("(max-width: 767px)");
    const onBreakpoint = () => {
      const chosen = query.matches ? item.mobile : item.desktop;
      const stamp = start > 0 ? `#t=${start}` : "";
      if (!video.currentSrc.includes(chosen)) {
        video.src = `${chosen}${stamp}`;
        kick();
      }
    };
    query.addEventListener("change", onBreakpoint);
    let trigger: ScrollTrigger | undefined;
    if (scrub && !reduced) {
      gsap.registerPlugin(ScrollTrigger);
      trigger = ScrollTrigger.create({
        trigger: frame,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          const duration = Number.isFinite(video.duration) ? video.duration : 10;
          const from = Math.min(scrub.from, duration - 0.3);
          const to = Math.min(scrub.to, duration - 0.05);
          video.currentTime = from + (to - from) * self.progress;
          if (video.paused) video.play().catch(() => undefined);
        },
      });
    }

    return () => {
      video.removeEventListener("loadeddata", kick);
      query.removeEventListener("change", onBreakpoint);
      trigger?.kill();
    };
  }, [eager, item, reduced, scrub, start]);

  return (
    <div
      ref={frameRef}
      className={`${fill ? "absolute inset-0" : "relative"} overflow-hidden bg-navy ${className}`}
      style={{ backgroundImage: `url(${item.poster})`, backgroundSize: "cover", backgroundPosition: position }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: position }}
        poster={item.poster}
        muted
        autoPlay={!reduced}
        loop
        playsInline
        preload="auto"
        aria-hidden={label ? undefined : true}
        aria-label={label}
      >
        <source src={`${item.mobile}${start > 0 ? `#t=${start}` : ""}`} media="(max-width: 767px)" type="video/mp4" />
        <source src={`${item.desktop}${start > 0 ? `#t=${start}` : ""}`} type="video/mp4" />
      </video>
    </div>
  );
}
