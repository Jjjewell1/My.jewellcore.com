"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { PortfolioItem } from "../src/generated/prisma-node/client";

const FILTERS = [
  { key: "all", label: "All work" },
  { key: "client", label: "Client sites" },
  { key: "homelab", label: "Homelab" },
  { key: "experiment", label: "Experiments" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const CATEGORY_STYLE: Record<string, string> = {
  client: "text-electric border-electric/60",
  homelab: "text-amber border-amber/60",
  experiment: "text-grape border-grape/60",
};

export default function JewellShips({ items }: { items: PortfolioItem[] }) {
  const grid = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !grid.current) return;
    const cards = grid.current.querySelectorAll("[data-card]");
    gsap.fromTo(
      cards,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: "power3.out", overwrite: true }
    );
  }, [filter]);

  const visible = items.filter((i) => filter === "all" || i.category === filter);

  return (
    <section id="ships" data-scroll-pose="point" className="relative z-10 py-40">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.4rem)] font-black tracking-[-0.02em] text-paper">
              Selected work<span className="text-amber">.</span>
            </h2>
            <p className="mt-3 max-w-md font-body text-white/55">
              Live deployments drawn straight from the running infrastructure — if it&apos;s listed here, it&apos;s
              online.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`rounded-full px-4 py-2 font-body text-sm font-bold transition-colors ${
                  filter === f.key
                    ? "bg-electric text-void"
                    : "glass border-white/15 text-white/60 hover:border-electric hover:text-electric"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={grid} className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item, i) => (
            <article
              key={item.id}
              data-card
              className="glass glass-sheen group relative flex flex-col overflow-hidden rounded-2xl p-6 transition-colors hover:border-white/30"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-3 -top-7 font-display text-7xl font-black text-white/[0.04] transition-colors group-hover:text-electric/10"
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="flex items-center justify-between gap-3">
                <span
                  className={`rounded-full border px-3 py-1 font-body text-[11px] font-bold uppercase tracking-widest ${
                    CATEGORY_STYLE[item.category] ?? "text-white/60 border-white/25"
                  }`}
                >
                  {item.category}
                </span>
                <span aria-hidden="true" className="font-display text-xl font-black text-electric/60 transition-transform group-hover:rotate-12">
                  ✦
                </span>
              </div>

              <h3 className="mt-4 font-display text-2xl font-extrabold text-paper">{item.title}</h3>
              <p className="mt-2 flex-1 font-body text-sm leading-relaxed text-white/60">{item.description}</p>

              {item.techTags && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.techTags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                    <span key={t} className="font-mono text-[11px] text-white/40">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {item.liveUrl && (
                <a
                  href={item.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex w-fit items-center gap-1 font-body text-sm font-bold text-electric hover:text-amber"
                >
                  Visit live site →
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
