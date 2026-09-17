"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hopper, { type HopperPose } from "./Hopper";
import Hopper3D from "./Hopper3D";

gsap.registerPlugin(ScrollTrigger);

/**
 * Hopper lives in a fixed corner and reacts to whichever section is on screen.
 * Sections expose a pose via data-scroll-pose="point|wave|talking".
 * The chat widget overrides everything with `window.dispatchEvent(new CustomEvent('hopper:pose',{detail:'talking'}))`
 * while open, and `'reset'` when it closes.
 */
export default function HopperMascot() {
  const [pose, setPose] = useState<HopperPose>("wave");
  const chatOpen = useRef(false);
  const suppressed = useRef(false); // while a pose event is active

  useEffect(() => {
    const onPose = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "reset") {
        chatOpen.current = false;
        suppressed.current = false;
        setPose("wave");
        return;
      }
      chatOpen.current = true;
      suppressed.current = true;
      setPose(detail as HopperPose);
    };

    window.addEventListener("hopper:pose", onPose);

    const triggers: ScrollTrigger[] = [];
    document.querySelectorAll<HTMLElement>("[data-scroll-pose]").forEach((el) => {
      const target = el.dataset.scrollPose as HopperPose;
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 68%",
        end: "bottom 26%",
        onToggle: (self) => {
          if (suppressed.current || chatOpen.current) return;
          if (self.isActive) setPose(target);
          else if (window.scrollY < 100) setPose("wave");
          else setPose("idle");
        },
      });
      triggers.push(st);
    });

    ScrollTrigger.create({
      start: "top top",
      end: "max",
      onToggle: (self) => {
        if (suppressed.current || chatOpen.current) return;
        if (self.isActive) setPose("idle");
      },
    });

    const initial = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => {
      if (!suppressed.current && !chatOpen.current) setPose(initial ? "idle" : "wave");
    }, 2200);

    return () => {
      window.removeEventListener("hopper:pose", onPose);
      triggers.forEach((tr) => tr.kill());
      window.clearTimeout(t);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-40 hidden sm:block" aria-hidden="true">
      <Hopper3D
        view="mascot"
        pose={pose}
        framing="full"
        primary
        className="h-[120px] w-[88px] sm:h-[150px] sm:w-[110px] drop-shadow-lg"
        fallback={<Hopper pose={pose} className="h-[120px] w-[88px] sm:h-[150px] sm:w-[110px] drop-shadow-lg" />}
      />
    </div>
  );
}