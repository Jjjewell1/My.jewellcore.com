"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hopper3D from "./Hopper3D";

gsap.registerPlugin(ScrollTrigger);

const STATS: { value: string; label: string; sub: string; accent: string }[] = [
  { value: "10+", label: "YEARS RUNNING A REAL BUSINESS", sub: "a decade of clients served", accent: "text-electric" },
  { value: "1", label: "HOMELAB, FULLY SELF-HOSTED", sub: "the servers behind every project", accent: "text-amber" },
  { value: "100%", label: "BUILT AND MAINTAINED BY HAND", sub: "no middlemen, no boilerplate", accent: "text-paper" },
];

export default function JewellPitch() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const reveal = el.querySelectorAll("[data-reveal]");
    const st = gsap.utils.toArray<HTMLElement>("[data-sweep]", el).map((item) =>
      ScrollTrigger.create({
        trigger: item,
        start: "top 80%",
        end: "top 35%",
        scrub: true,
        onUpdate: (self) => {
          gsap.set(item, { y: self.progress * -40, opacity: 0.35 + self.progress * 0.65 });
        },
      })
    );

    gsap.fromTo(
      reveal,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 70%" },
      }
    );

    return () => {
      st.forEach((t) => t.kill());
      gsap.killTweensOf(reveal);
    };
  }, []);

  return (
    <section id="pitch" ref={root} data-scroll-pose="point" className="relative z-10 py-40">
      <div className="mx-auto max-w-6xl px-5">
        <div data-sweep>
          <p className="max-w-3xl font-display text-[clamp(1.8rem,4.2vw,3.4rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-paper">
            No template mills. No white-label resellers.{" "}
            <span className="text-electric text-glow-cyan">One developer</span>, one stack, one rack — every site
            built by hand and hosted on infrastructure I manage directly.
          </p>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              data-reveal
              className={`glass-sheen relative overflow-hidden rounded-2xl p-7 ${i === 2 ? "glass-deep" : "glass"}`}
            >
              <span aria-hidden="true" className="pointer-events-none absolute -right-4 -top-6 font-display text-8xl font-black text-white/[0.03]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className={`font-display text-5xl font-black tracking-tight ${s.accent}`}>{s.value}</p>
              <p className="mt-4 font-mono text-[11px] font-semibold tracking-[0.22em] text-white/70">{s.label}</p>
              <p className="mt-1 font-body text-sm text-white/60">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
