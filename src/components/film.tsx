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

function isNearViewport(node: HTMLElement) {
  const rect = node.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;
  const slack = Math.round(window.innerHeight * 0.35);
  return rect.bottom > -slack && rect.top < window.innerHeight + slack;
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

    let alive = true;
    let near = eager;
    let hovering = false;
    let retry = 0;
    let trigger: ScrollTrigger | undefined;
    const query = window.matchMedia("(max-width: 767px)");

    if (eager) video.setAttribute("fetchpriority", "high");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const wanted = () => Boolean(alive && !reduced && (eager || near || hovering));

    const choose = () => mediaSrc(item, start, query.matches);

    const applySource = (force = false) => {
      const next = choose();
      const base = next.split("#")[0];
      if (!force && video.currentSrc && video.currentSrc.includes(base)) return false;
      video.src = next;
      return true;
    };

    const playNow = () => {
      if (!wanted()) return;
      const attempt = video.play();
      if (attempt) {
        attempt
          .then(() => {
            retry = 0;
          })
          .catch(() => {
            if (!alive || !wanted() || retry > 12) return;
            retry += 1;
            window.setTimeout(playNow, 120 * retry);
          });
      }
    };

    const sync = () => {
      if (!alive) return;
      if (reduced) {
        video.pause();
        return;
      }
      near = eager || hovering || isNearViewport(frame);
      if (wanted()) {
        video.preload = "auto";
        playNow();
      } else if (!video.paused) {
        video.pause();
      }
    };

    applySource();
    sync();

    const onReady = () => {
      if (wanted()) playNow();
    };
    const onPause = () => {
      if (!wanted()) return;
      window.setTimeout(() => {
        if (wanted() && video.paused) playNow();
      }, 40);
    };
    const onWaiting = () => {
      if (wanted()) playNow();
    };

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("canplaythrough", onReady);
    video.addEventListener("pause", onPause);
    video.addEventListener("stalled", onWaiting);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("suspend", onWaiting);

    const onBreakpoint = () => {
      applySource(true);
      sync();
    };
    query.addEventListener("change", onBreakpoint);

    const onEnter = () => {
      hovering = true;
      sync();
    };
    const onLeave = () => {
      hovering = false;
      sync();
    };
    frame.addEventListener("pointerenter", onEnter);
    frame.addEventListener("pointerleave", onLeave);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        near = eager || entry.isIntersecting || entry.intersectionRatio > 0;
        if (near) video.preload = "auto";
        sync();
      },
      { root: null, rootMargin: "40% 0px", threshold: [0, 0.01, 0.1, 0.25, 0.5] },
    );
    observer.observe(frame);

    const onScroll = () => sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    if (scrub && !reduced) {
      gsap.registerPlugin(ScrollTrigger);
      trigger = ScrollTrigger.create({
        trigger: frame,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onEnter: () => {
          near = true;
          sync();
        },
        onEnterBack: () => {
          near = true;
          sync();
        },
        onLeave: () => {
          if (!hovering && !eager) {
            near = false;
            sync();
          }
        },
        onLeaveBack: () => {
          if (!hovering && !eager) {
            near = false;
            sync();
          }
        },
        onUpdate: (self) => {
          if (!wanted()) return;
          const duration = Number.isFinite(video.duration) ? video.duration : 10;
          const from = Math.min(scrub.from, duration - 0.3);
          const to = Math.min(scrub.to, duration - 0.05);
          video.currentTime = from + (to - from) * self.progress;
          if (video.paused) playNow();
        },
      });
    }

    const boot = window.setTimeout(sync, 80);
    const bootAgain = window.setTimeout(sync, 400);

    return () => {
      alive = false;
      window.clearTimeout(boot);
      window.clearTimeout(bootAgain);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("canplaythrough", onReady);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("stalled", onWaiting);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("suspend", onWaiting);
      query.removeEventListener("change", onBreakpoint);
      frame.removeEventListener("pointerenter", onEnter);
      frame.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
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
        loop
        playsInline
        preload="auto"
        aria-hidden={label ? undefined : true}
        aria-label={label}
      >
        <source src={mediaSrc(item, start, true)} media="(max-width: 767px)" type="video/mp4" />
        <source src={mediaSrc(item, start, false)} type="video/mp4" />
      </video>
    </div>
  );
}
