"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Hopper3D from "./Hopper3D";
import Hopper from "./Hopper";

export default function JewellHero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = el.querySelectorAll("[data-reveal]");

    if (reduced) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      items,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: "power3.out", delay: 0.15 }
    );

    const floaters = Array.from(el.querySelectorAll<HTMLElement>("[data-parallax]"));
    if (floaters.length === 0) return () => gsap.killTweensOf(items);

    const per = floaters.map((f) => ({ f, depth: Number(f.dataset.parallax || 12) }));
    const xTo = gsap.quickTo(floaters, "x", { duration: 0.6, ease: "power2.out" });
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      per.forEach(({ f, depth }, i) => {
        xTo(nx * depth * (i % 2 === 0 ? 1 : -1));
        gsap.to(f, { y: -ny * depth * 0.4, duration: 0.6, ease: "power2.out", overwrite: "auto" });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.killTweensOf([items, floaters]);
    };
  }, []);

  return (
    <section
      id="hero"
      ref={root}
      data-scroll-pose="wave"
      className="relative z-10 flex min-h-screen items-center overflow-hidden"
    >
      {/* faint grid that fades in behind the HUD */}
      <div aria-hidden="true" data-jj-grid className="pointer-events-none absolute inset-0 bg-grid-void opacity-80 [mask-image:radial-gradient(70%_70%_at_50%_40%,black,transparent)]" />

      {/* left-weighted scrim so copy stays legible over the bright 3D core */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 [background:linear-gradient(100deg,rgba(2,3,8,0.92)_0%,rgba(2,3,8,0.6)_28%,rgba(2,3,8,0.12)_52%,transparent_70%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-28 lg:py-0">
        <div className="max-w-2xl">
          <div data-reveal className="glass flex w-fit items-center gap-2 rounded-full px-4 py-1.5">
            <span aria-hidden="true" className="inline-block h-2 w-2 animate-pulse rounded-full bg-electric" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.28em] text-white/70">
              JEWELLCORE · INDEPENDENT · SELF-HOSTED
            </span>
          </div>

          <h1 className="mt-7 font-display text-[clamp(2.9rem,8vw,6.4rem)] font-black leading-[0.92] tracking-[-0.03em] text-paper">
            <span data-reveal className="block">Real sites.</span>
            <span data-reveal className="block text-electric text-glow-cyan">Real infrastructure.</span>
            <span data-reveal className="block">
              No <span className="text-amber text-glow-amber">middlemen.</span>
            </span>
          </h1>

          <p data-reveal className="mt-7 max-w-md font-body text-lg text-white/80 [text-shadow:0_1px_20px_rgba(2,3,8,0.9)]">
            I&apos;m <strong className="font-bold text-paper">JJ Jewell</strong> — an independent web developer
            and systems builder. Every project is designed, built, and hosted on infrastructure I own and
            maintain myself.
          </p>

          <div data-reveal className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#ships"
              className="rounded-full bg-electric px-7 py-3.5 font-display text-base font-extrabold text-void shadow-[0_0_24px_-6px_rgba(47,212,224,0.7)] transition-transform hover:-translate-y-0.5"
            >
              View the work ↓
            </a>
            <a
              href="#contact"
              className="glass rounded-full border-white/20 px-7 py-3.5 font-display text-base font-extrabold text-paper transition-colors hover:border-electric hover:text-electric"
            >
              Get in touch
            </a>
          </div>

          {/* floating status chips */}
          <div data-reveal className="mt-12 flex flex-wrap gap-3 font-mono text-[11px] tracking-widest">
            {[
              ["HOSTING", "SELF-MANAGED"],
              ["STACK", "NEXT.JS / THREE.JS"],
              ["APPROACH", "DELIBERATE, BY HAND"],
            ].map(([k, v]) => (
              <span key={k} className="glass rounded-lg px-3 py-2 text-white/60">
                <span className="text-electric">{k}</span>
                <span className="mx-2 text-white/20">·</span>
                <span className="text-white/80">{v}</span>
              </span>
            ))}
          </div>
        </div>

        {/* floating corner accents */}
        <span
          aria-hidden="true"
          data-parallax="16"
          className="pointer-events-none absolute left-[8%] top-[16%] hidden font-mono text-xs text-electric/60 md:block"
        >
          ◈ ◈ ◈
        </span>
        <span
          aria-hidden="true"
          data-parallax="26"
          className="pointer-events-none absolute bottom-[18%] right-[7%] hidden font-mono text-[11px] text-amber/50 lg:block"
        >
          node.01 {`<-`} home
        </span>
        <span
          aria-hidden="true"
          data-parallax="20"
          className="pointer-events-none absolute right-[26%] top-[24%] hidden font-mono text-[11px] text-white/25 md:block"
        >
          °{`>`} status: nominal
        </span>
      </div>
        {/* 3D Hopper on the right of the fold */}
        <Hopper3D
          view="hero"
          pose="wave"
          framing="hero"
          className="pointer-events-none absolute bottom-[8%] -right-4 h-[56vh] w-[190px] md:h-[64vh] xl:block"
          fallback={<Hopper pose="wave" className="h-40 w-28 drop-shadow-[0_0_24px_rgba(47,212,224,0.35)]" />}
/>
    </section>
  );
}
