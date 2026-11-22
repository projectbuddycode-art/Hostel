"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { films, type FilmKey } from "@/lib/films";

type Scrub = { from: number; to: number };

function mediaSrc(item: (typeof films)[FilmKey], start: number, narrow: boolean) {
  const file = narrow ? item.mobile : item.desktop;
  return start > 0 ? `${file}#t=${start}` : file;
}

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

    let near = eager;
    let hovering = false;
    let armed = eager;
    let trigger: ScrollTrigger | undefined;
    const query = window.matchMedia("(max-width: 767px)");

    if (eager) video.setAttribute("fetchpriority", "high");

    const applySource = () => {
      const next = mediaSrc(item, start, query.matches);
      const base = next.split("#")[0];
      if (!video.currentSrc || !video.currentSrc.includes(base)) {
        video.src = next;
      }
    };

    const sync = () => {
      if (reduced) {
        video.pause();
        return;
      }
      if (scrub) {
        if (!near && !hovering) video.pause();
        return;
      }
      if (near || hovering) {
        if (video.paused) video.play().catch(() => undefined);
      } else if (!video.paused) {
        video.pause();
      }
    };

    const arm = () => {
      if (armed) return;
      armed = true;
      video.preload = "auto";
      applySource();
      if (video.readyState < 2) video.load();
    };

    applySource();
    if (eager) {
      video.preload = "auto";
      sync();
    } else {
      video.preload = "metadata";
    }

    const onReady = () => sync();
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);

    const onBreakpoint = () => {
      applySource();
      sync();
    };
    query.addEventListener("change", onBreakpoint);

    const onEnter = () => {
      hovering = true;
      arm();
      sync();
    };
    const onLeave = () => {
      hovering = false;
      sync();
    };
    frame.addEventListener("pointerenter", onEnter);
    frame.addEventListener("pointerleave", onLeave);

    let observer: IntersectionObserver | undefined;
    if (!eager) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          if (entry.isIntersecting) {
            near = true;
            arm();
          } else {
            near = false;
          }
          sync();
        },
        { root: null, rootMargin: "20% 0px", threshold: 0.12 },
      );
      observer.observe(frame);
    }

    if (scrub && !reduced) {
      gsap.registerPlugin(ScrollTrigger);
      trigger = ScrollTrigger.create({
        trigger: frame,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          if (!near && !hovering) return;
          const duration = Number.isFinite(video.duration) ? video.duration : 10;
          const from = Math.min(scrub.from, duration - 0.3);
          const to = Math.min(scrub.to, duration - 0.05);
          video.currentTime = from + (to - from) * self.progress;
        },
      });
    }

    return () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      query.removeEventListener("change", onBreakpoint);
      frame.removeEventListener("pointerenter", onEnter);
      frame.removeEventListener("pointerleave", onLeave);
      observer?.disconnect();
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
        autoPlay={Boolean(eager && !reduced)}
        loop={!scrub}
        playsInline
        preload={eager ? "auto" : "metadata"}
        aria-hidden={label ? undefined : true}
        aria-label={label}
      >
        <source src={mediaSrc(item, start, true)} media="(max-width: 767px)" type="video/mp4" />
        <source src={mediaSrc(item, start, false)} type="video/mp4" />
      </video>
    </div>
  );
}
