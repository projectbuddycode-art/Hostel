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
    const place = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 10;
      const time = Math.min(start, Math.max(0, duration - 0.2));
      if (time > 0 && video.currentTime < 0.05) {
        try {
          video.currentTime = time;
        } catch {
          /* The browser may reject a seek before the first frame. */
        }
      }
    };

    const onReady = () => {
      place();
      if (reduced) {
        video.pause();
        return;
      }
      video.play().catch(() => undefined);
    };

    video.addEventListener("loadedmetadata", onReady);
    const choose = () => {
      const narrow = window.matchMedia("(max-width: 767px)").matches;
      const canWebm = video.canPlayType("video/webm");
      return narrow ? item.mobile : canWebm ? item.webm : item.desktop;
    };
    const nextSrc = choose();
    if (!video.src.endsWith(nextSrc)) video.src = nextSrc;
    if (video.readyState >= 1) onReady();
    const query = window.matchMedia("(max-width: 767px)");
    const onBreakpoint = () => {
      const chosen = choose();
      if (!video.src.endsWith(chosen)) video.src = chosen;
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
      video.removeEventListener("loadedmetadata", onReady);
      query.removeEventListener("change", onBreakpoint);
      trigger?.kill();
    };
  }, [item, reduced, scrub, start]);

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
      />
    </div>
  );
}
