"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const GROUPS: { index: string; title: string; blurb: string; accent: string; chip: string; items: string[] }[] = [
  {
    index: "01",
    title: "Web Dev",
    blurb: "Custom, accessible websites built on the framework or CMS that best fits the project.",
    accent: "text-electric",
    chip: "bg-electric text-void",
    items: ["Next.js", "Tailwind", "PHP", "WordPress"],
  },
  {
    index: "02",
    title: "Systems",
    blurb: "The infrastructure behind it — from containers to the public edge, fully self-managed.",
    accent: "text-amber",
    chip: "bg-amber text-void",
    items: ["Unraid", "Docker", "Coolify", "Cloudflare Tunnels"],
  },
  {
    index: "03",
    title: "AI Ops",
    blurb: "Local models integrated into real workflows, with no cloud dependency unless I choose one.",
    accent: "text-electric",
    chip: "bg-electric text-void",
    items: ["Ollama", "Open WebUI", "OpenCode", "ComfyUI"],
  },
  {
    index: "04",
    title: "Hardware",
    blurb: "Physical work, kept practical — from CAD and 3D printing to the machines that run it all.",
    accent: "text-amber",
    chip: "bg-amber text-void",
    items: ["3D Printing", "CAD", "Bambu Lab", "Pi"],
  },
];

export default function JewellArsenal() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const cards = el.querySelectorAll("[data-card]");
    gsap.fromTo(
      cards,
      { opacity: 0, y: 44, rotateX: 12 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 72%" },
      }
    );

    // subtle ongoing float per card
    cards.forEach((c, i) => {
      gsap.to(c, { y: Math.sin(i) * 10, duration: 2.2 + i * 0.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
    });

    return () => gsap.killTweensOf(cards);
  }, []);

  return (
    <section id="arsenal" ref={root} data-scroll-pose="point" className="relative z-10 py-40">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-lg font-display text-[clamp(2rem,4.5vw,3.4rem)] font-black tracking-[-0.02em] text-paper">
            The toolkit<span className="text-electric">.</span>
          </h2>
          <p className="max-w-sm font-body text-white/55">
            A single core, several disciplines — the tools I rely on daily, grouped by craft.
          </p>
        </div>

        <div
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          style={{ perspective: "1200px" }}
        >
          {GROUPS.map((g) => (
            <article
              key={g.title}
              data-card
              className="glass-deep glass-sheen group relative flex flex-col rounded-2xl p-6 transition-colors hover:border-white/30"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold tracking-widest ${g.chip}`}>
                  {g.index}
                </span>
                <span aria-hidden="true" className="font-display text-xl font-black text-white/15 transition-colors group-hover:text-electric">
                  {`</>`}
                </span>
              </div>
              <h3 className={`mt-5 font-display text-2xl font-extrabold ${g.accent}`}>{g.title}</h3>
              <p className="mt-2 flex-1 font-body text-sm text-white/70">{g.blurb}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {g.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/15 px-3 py-1 font-mono text-[11px] text-white/75 transition-colors hover:border-electric hover:text-electric"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
