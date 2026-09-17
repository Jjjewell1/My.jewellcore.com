"use client";

import Hopper3D from "./Hopper3D";
import Hopper from "./Hopper";

export default function ChatSection() {
  const open = () => window.dispatchEvent(new CustomEvent("chat:open"));

  return (
    <section id="chat" data-scroll-pose="talking" className="relative overflow-hidden border-y border-white/10 bg-void-soft/40 py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_100%_at_50%_0%,rgba(47,212,224,0.08),transparent_60%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-5 text-center">
        <Hopper3D
          view="chat"
          pose="talking"
          framing="bust"
          className="pointer-events-none select-none h-28 w-20 drop-shadow-[0_0_18px_rgba(47,212,224,0.35)]"
          fallback={<Hopper pose="talking" className="h-28 w-20 drop-shadow-[0_0_18px_rgba(47,212,224,0.35)]" />}
        />
        <h2 className="mt-4 max-w-xl font-display text-[clamp(2rem,4.5vw,3.4rem)] font-black text-paper">
          Ask <span className="text-electric text-glow-cyan">Hopper</span> first
        </h2>
        <p className="mt-3 max-w-md font-body text-white/60">
          Hopper knows the portfolio, the pricing ranges, and the certifications in progress. Answers are drawn
          from the live project list, so they never go stale.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={open}
            className="rounded-full bg-electric px-7 py-3.5 font-display text-base font-extrabold text-void shadow-[0_0_24px_-6px_rgba(47,212,224,0.7)] transition-transform hover:-translate-y-0.5"
          >
            Chat with Hopper →
          </button>
          <button
            onClick={open}
            className="glass rounded-full border-white/20 px-6 py-3 font-display text-base font-extrabold text-paper transition-colors hover:border-electric hover:text-electric"
          >
            What does a site cost?
          </button>
        </div>
      </div>
    </section>
  );
}