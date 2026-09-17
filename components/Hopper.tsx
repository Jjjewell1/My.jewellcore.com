"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export type HopperPose = "idle" | "wave" | "point" | "talking";

const PALETTE = {
  paper: "#F7F5F2",
  ink: "#14172B",
  court: "#FF7A29",
  courtDeep: "#f2610f",
  electric: "#2FD4E0",
  slate: "#8a93a6",
};

const OUT = PALETTE.ink;

/** Shoulder pivots — shared with runPose so gestures rotate about the joint. */
const SHOULDER_L = { x: 66, y: 124 };
const SHOULDER_R = { x: 154, y: 124 };

export default function Hopper({
  pose = "idle",
  mirror = false,
  className = "",
}: {
  pose?: HopperPose;
  mirror?: boolean;
  className?: string;
}) {
  const root = useRef<SVGSVGElement>(null);
  const reduced = useRef(false);
  const poseRef = useRef<HopperPose>(pose);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    poseRef.current = pose;
    const svg = root.current;
    if (!svg) return;
    const q = gsap.utils.selector(svg);
    const ctx = gsap.context(() => {
      if (reduced.current) return;
      const tl = runPose(q, pose);
      return () => tl?.kill();
    }, svg);
    return () => {
      ctx.revert();
      gsap.set(svg, { clearProps: "all" });
    };
  }, [pose]);

  return (
    <svg
      ref={root}
      viewBox="0 0 220 300"
      className={className}
      role="img"
      aria-label="Hopper the rabbit"
      style={mirror ? { transform: "scaleX(-1)" } : undefined}
    >
      <defs>
        <linearGradient id="hp-body" x1="0.1" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="52%" stopColor="#F4F1EB" />
          <stop offset="100%" stopColor="#DBD5CC" />
        </linearGradient>
        <linearGradient id="hp-head" x1="0.15" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#F5F2ED" />
          <stop offset="100%" stopColor="#E0DAD2" />
        </linearGradient>
        <linearGradient id="hp-ear" x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#F2EEE7" />
          <stop offset="100%" stopColor="#DCD6CD" />
        </linearGradient>
        <linearGradient id="hp-pink" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#FFC9D6" />
          <stop offset="100%" stopColor="#EE8AA6" />
        </linearGradient>
        <linearGradient id="hp-court" x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0%" stopColor="#FF9E52" />
          <stop offset="100%" stopColor="#DF550D" />
        </linearGradient>
        <linearGradient id="hp-electric" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#67E7F1" />
          <stop offset="100%" stopColor="#16A3B1" />
        </linearGradient>
        <linearGradient id="hp-slate" x1="0.15" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#9DA6B8" />
          <stop offset="100%" stopColor="#5C6577" />
        </linearGradient>
        <linearGradient id="hp-shoe" x1="0.1" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E4DED5" />
        </linearGradient>
        <radialGradient id="hp-floor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(20,23,43,0.45)" />
          <stop offset="60%" stopColor="rgba(20,23,43,0.20)" />
          <stop offset="100%" stopColor="rgba(20,23,43,0)" />
        </radialGradient>
      </defs>

      {/* ground shadow */}
      <ellipse className="h-shadow" cx="110" cy="285" rx="64" ry="11" fill="url(#hp-floor)" />

      {/* ---- legs ---- */}
      <g strokeLinejoin="round" strokeLinecap="round">
        <rect className="h-leg-l" x="70" y="200" width="30" height="76" rx="15" fill="url(#hp-slate)" stroke={OUT} strokeWidth="2" />
        <rect className="h-leg-r" x="120" y="200" width="30" height="76" rx="15" fill="url(#hp-slate)" stroke={OUT} strokeWidth="2" />
        {/* sock cuffs */}
        <rect x="72" y="242" width="26" height="10" rx="5" fill="url(#hp-electric)" stroke={OUT} strokeWidth="1.5" />
        <rect x="122" y="242" width="26" height="10" rx="5" fill="url(#hp-electric)" stroke={OUT} strokeWidth="1.5" />
      </g>

      {/* ---- sneakers ---- */}
      <g strokeLinejoin="round" strokeLinecap="round">
        {/* left */}
        <rect x="60" y="256" width="46" height="22" rx="10" fill="url(#hp-shoe)" stroke={OUT} strokeWidth="2" />
        <rect x="58" y="272" width="50" height="15" rx="7.5" fill="url(#hp-court)" stroke={OUT} strokeWidth="2" />
        <path d="M64 279.5 H102" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        <path d="M68 261 L78 268 M76 260 L86 267" stroke={OUT} strokeWidth="1.6" opacity="0.45" />
        <rect x="62" y="268" width="14" height="5" rx="2.5" fill={PALETTE.electric} />
        {/* right */}
        <rect x="114" y="256" width="46" height="22" rx="10" fill="url(#hp-shoe)" stroke={OUT} strokeWidth="2" />
        <rect x="112" y="272" width="50" height="15" rx="7.5" fill="url(#hp-court)" stroke={OUT} strokeWidth="2" />
        <path d="M118 279.5 H156" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        <path d="M134 260 L142 267 M142 261 L150 268" stroke={OUT} strokeWidth="1.6" opacity="0.45" />
        <rect x="144" y="268" width="14" height="5" rx="2.5" fill={PALETTE.electric} />
      </g>

      {/* ---- jersey body ---- */}
      <g>
        <rect className="h-body" x="52" y="94" width="116" height="134" rx="32" fill="url(#hp-body)" stroke={OUT} strokeWidth="2.4" />
        {/* soft fabric shading */}
        <path d="M150 112 C160 140 158 180 140 208" stroke="rgba(20,23,43,0.10)" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M74 118 C64 146 66 184 82 208" stroke="rgba(255,255,255,0.75)" strokeWidth="9" fill="none" strokeLinecap="round" />
        {/* neck opening + collar trim */}
        <path d="M97 96 L110 114 L123 96 Z" fill="#D8D2C9" />
        <path d="M99 96 L110 111 L121 96" stroke={PALETTE.court} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M97 96 L110 114 L123 96" stroke={OUT} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
        {/* electric shoulder flash */}
        <path d="M62 124 Q72 112 86 109" stroke={PALETTE.electric} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M158 124 Q148 112 134 109" stroke={PALETTE.electric} strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* chest emblem */}
        <circle cx="110" cy="150" r="16" fill="url(#hp-electric)" stroke={OUT} strokeWidth="2" />
        <circle cx="110" cy="150" r="12.4" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" />
        <path d="M113 140 L102 153 L108.8 153 L106 161 L118 149 L111 149 Z" fill={OUT} />
        {/* hem band */}
        <rect x="56" y="202" width="108" height="24" rx="12" fill="url(#hp-court)" stroke={OUT} strokeWidth="2" />
        <path d="M64 214 H156" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" strokeDasharray="4 4" />
      </g>

      {/* ---- arms (pivot groups) ---- */}
      <g transform={`translate(${SHOULDER_L.x},${SHOULDER_L.y})`} className="h-arm-pivot-l">
        <g className="h-arm-l" strokeLinejoin="round" strokeLinecap="round">
          <path d="M-12 -14 L-12 40 Q-12 52 0 52 Q12 52 12 40 L12 -14 Z" fill="url(#hp-body)" stroke={OUT} strokeWidth="2" />
          <rect x="-12" y="4" width="24" height="8" fill={PALETTE.electric} />
          <rect x="-12" y="34" width="24" height="12" rx="6" fill="url(#hp-electric)" stroke={OUT} strokeWidth="1.6" />
          <circle cx="0" cy="-2" r="13.5" fill="url(#hp-body)" stroke={OUT} strokeWidth="2" />
          <circle cx="0" cy="56" r="13" fill="url(#hp-body)" stroke={OUT} strokeWidth="2" />
          <path d="M-5 51 Q0 48 5 51 M-5 57 Q0 61 5 57" stroke="rgba(20,23,43,0.35)" strokeWidth="1.5" fill="none" />
        </g>
      </g>
      <g transform={`translate(${SHOULDER_R.x},${SHOULDER_R.y})`} className="h-arm-pivot-r">
        <g className="h-arm-r" strokeLinejoin="round" strokeLinecap="round">
          <path d="M-12 -14 L-12 40 Q-12 52 0 52 Q12 52 12 40 L12 -14 Z" fill="url(#hp-body)" stroke={OUT} strokeWidth="2" />
          <rect x="-12" y="4" width="24" height="8" fill={PALETTE.electric} />
          <rect x="-12" y="34" width="24" height="12" rx="6" fill="url(#hp-electric)" stroke={OUT} strokeWidth="1.6" />
          <circle cx="0" cy="-2" r="13.5" fill="url(#hp-body)" stroke={OUT} strokeWidth="2" />
          <circle cx="0" cy="56" r="13" fill="url(#hp-body)" stroke={OUT} strokeWidth="2" />
          <path d="M-5 51 Q0 48 5 51 M-5 57 Q0 61 5 57" stroke="rgba(20,23,43,0.35)" strokeWidth="1.5" fill="none" />
        </g>
      </g>

      {/* ---- ears (drawn behind head, bases hidden by cap band) ---- */}
      <g className="h-ear-l" transform="rotate(10 78 60)">
        <path d="M80 70 C67 52 58 32 63 17 C67 8 84 11 86 21 C89 42 86 58 82 70 Z" fill="url(#hp-ear)" stroke={OUT} strokeWidth="2" strokeLinejoin="round" />
        <path d="M78 62 C70 48 64 32 68 22 C71 15 79 16 80 23 C82 38 80 52 77 62 Z" fill="url(#hp-pink)" />
        <path d="M75 40 C73 32 74 25 77 20" stroke="rgba(255,255,255,0.7)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M66 26 C68 21 71 18 75 16" stroke="rgba(20,23,43,0.12)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      <g className="h-ear-r" transform="rotate(-10 142 60)">
        <path d="M140 70 C153 52 162 32 157 17 C153 8 136 11 134 21 C131 42 134 58 138 70 Z" fill="url(#hp-ear)" stroke={OUT} strokeWidth="2" strokeLinejoin="round" />
        <path d="M142 62 C150 48 156 32 152 22 C149 15 141 16 140 23 C138 38 140 52 143 62 Z" fill="url(#hp-pink)" />
        <path d="M145 40 C147 32 146 25 143 20" stroke="rgba(255,255,255,0.7)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M154 26 C152 21 149 18 145 16" stroke="rgba(20,23,43,0.12)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>

      {/* ---- head ---- */}
      <g>
        <path className="h-head" d="M60 84 C58 50 74 32 110 32 C146 32 162 50 160 84 C160 118 140 132 110 132 C80 132 60 118 60 84 Z" fill="url(#hp-head)" stroke={OUT} strokeWidth="2.4" />

        {/* ears-inner shadow line under the cap */}
        <path d="M76 66 Q92 74 110 74 Q128 74 144 66" stroke="rgba(20,23,43,0.10)" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* cheeks */}
        <ellipse cx="86" cy="106" rx="12" ry="7.5" fill="url(#hp-pink)" opacity="0.5" />
        <ellipse cx="134" cy="106" rx="12" ry="7.5" fill="url(#hp-pink)" opacity="0.5" />
        {/* whiskers */}
        <path d="M78 98 Q64 93 57 95 M78 104 Q64 105 57 108 M142 98 Q156 93 163 95 M142 104 Q156 105 163 108" stroke={OUT} strokeWidth="1.5" fill="none" opacity="0.32" strokeLinecap="round" />
        {/* eyes */}
        <ellipse cx="92" cy="79" rx="8.5" ry="10.5" fill="#fff" stroke={OUT} strokeWidth="2" />
        <circle cx="93" cy="80.5" r="4.9" fill={OUT} />
        <circle cx="90.3" cy="76.5" r="2.1" fill="#fff" />
        <circle cx="95.4" cy="84" r="1.2" fill="#fff" opacity="0.75" />
        <ellipse cx="128" cy="79" rx="8.5" ry="10.5" fill="#fff" stroke={OUT} strokeWidth="2" />
        <circle cx="127" cy="80.5" r="4.9" fill={OUT} />
        <circle cx="124.3" cy="76.5" r="2.1" fill="#fff" />
        <circle cx="129.4" cy="84" r="1.2" fill="#fff" opacity="0.75" />
        {/* brows */}
        <path d="M83 66 Q92 61 101 67" stroke={OUT} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path d="M119 67 Q128 61 137 66" stroke={OUT} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        {/* nose + philtrum */}
        <path d="M104 86.5 C107 83 113 83 116 86.5 C114 92.5 106 92.5 104 86.5 Z" fill="url(#hp-pink)" stroke={OUT} strokeWidth="1.8" strokeLinejoin="round" />
        <ellipse cx="109.4" cy="86" rx="2" ry="1.3" fill="rgba(255,255,255,0.8)" />
        <path d="M110 93 V99" stroke={OUT} strokeWidth="1.6" opacity="0.45" strokeLinecap="round" />
        {/* buck teeth */}
        <rect x="104.4" y="98.5" width="5.7" height="9" rx="1.7" fill="#fff" stroke={OUT} strokeWidth="1.6" />
        <rect x="110.9" y="98.5" width="5.7" height="9" rx="1.7" fill="#fff" stroke={OUT} strokeWidth="1.6" />
        <path d="M105 105.5 H116" stroke="rgba(20,23,43,0.18)" strokeWidth="1.2" />
      </g>

      {/* ---- snapback ---- */}
      <g>
        {/* brim flipped to the back, peeking above the crown */}
        <path d="M76 46 Q110 4 144 46 Z" fill={PALETTE.courtDeep} stroke={OUT} strokeWidth="2.2" strokeLinejoin="round" />
        {/* crown (apex ~y29, above the head's crown line at y32) */}
        <path className="h-hat" d="M72 60 Q110 -2 148 60 Z" fill="url(#hp-court)" stroke={OUT} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M94 36 C98 45 98 52 97 59" stroke="rgba(20,23,43,0.18)" strokeWidth="2" fill="none" />
        <path d="M126 36 C122 45 122 52 123 59" stroke="rgba(20,23,43,0.18)" strokeWidth="2" fill="none" />
        <path d="M82 44 C88 34 96 29 106 27" stroke="rgba(255,255,255,0.5)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        {/* band */}
        <path className="h-hat-band" d="M66 48 H154 C154 58 150 63 144 63 H76 C70 63 66 58 66 48 Z" fill={PALETTE.courtDeep} stroke={OUT} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M70 54 H150" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" strokeDasharray="3 4" />
        {/* snapback adjuster + buckle at the front */}
        <rect x="99" y="46" width="22" height="11" rx="3" fill="#F7F5F2" stroke={OUT} strokeWidth="1.8" />
        <rect x="102" y="45" width="16" height="13" rx="3.5" fill="none" stroke={OUT} strokeWidth="2.2" />
        <path d="M110 45 V58" stroke={OUT} strokeWidth="1.6" opacity="0.5" />
      </g>

      {/* mouth (animated for talking) */}
      <g className="h-mouth" transform="translate(110 114)">
        <path d="M-7.5 -3 Q0 7 7.5 -3 Z" fill={OUT} opacity="0.92" />
        <path d="M-3 0.5 Q0 4 3 0.5 Z" fill="#F08FAA" />
      </g>
    </svg>
  );
}

/**
 * Builds the pose timeline for the current pose. Returns a cleanup fn.
 * Uses the reduced-motion fallback (static state, no hops) via the caller.
 * Arm angles are chosen so every gesture stays inside the 220x300 viewBox.
 */
function runPose(q: ReturnType<typeof gsap.utils.selector>, pose: HopperPose): gsap.core.Timeline | null {
  const armL = q(".h-arm-l");
  const armR = q(".h-arm-r");
  const earL = q(".h-ear-l");
  const earR = q(".h-ear-r");
  const mouth = q(".h-mouth");
  const shadow = q(".h-shadow");

  const originL = `${SHOULDER_L.x} ${SHOULDER_L.y}`;
  const originR = `${SHOULDER_R.x} ${SHOULDER_R.y}`;

  gsap.set(armL, { svgOrigin: originL, rotation: 14 });
  gsap.set(armR, { svgOrigin: originR, rotation: -14 });

  if (pose === "idle") {
    const tl = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.6 });
    tl.to([earL, earR], { rotation: (i) => (i ? -12 : 12), duration: 0.5, ease: "sine.inOut" }, 0)
      .to(shadow, { scaleX: 0.96, opacity: 0.8, duration: 0.5, ease: "sine.inOut" }, 0);
    return tl;
  }

  if (pose === "wave") {
    gsap.set(earL, { rotation: 8 });
    gsap.set(earR, { rotation: -8 });
    const tl = gsap.timeline();
    tl.set(armL, { svgOrigin: originL, rotation: 0 })
      .to(armR, { svgOrigin: originR, rotation: -128, duration: 0.4, ease: "back.out(2.2)" })
      .to(armR, { rotation: -112, duration: 0.18, ease: "power2.inOut" })
      .to(armR, { rotation: -140, yoyo: true, repeat: 2, duration: 0.18, ease: "sine.inOut" })
      .to(armR, { rotation: -14, duration: 0.45, ease: "power3.inOut" });
    return tl;
  }

  if (pose === "point") {
    // anticipation -> raise the left arm and point out -> settle
    const tl = gsap.timeline();
    tl.to(armL, { svgOrigin: originL, rotation: 20, duration: 0.12, ease: "power2.out" })
      .to(armL, { rotation: 130, duration: 0.5, ease: "back.out(1.6)" })
      .to(armL, { rotation: 122, duration: 0.35, ease: "sine.inOut" })
      .to([earL, earR], { rotation: (i) => (i ? -10 : 14), duration: 0.3, ease: "sine.out" }, "<")
      .to(shadow, { scaleX: 1.06, opacity: 0.85, duration: 0.4, ease: "sine.inOut" }, "<");
    return tl;
  }

  // talking: ears rocking + mouth pulsing = looping idle attention
  const tl = gsap.timeline({ repeat: -1 });
  tl.set(mouth, { transformOrigin: "50% 50%" })
    .to(mouth, { scaleY: 1.6, duration: 0.16, ease: "sine.inOut" })
    .to(mouth, { scaleY: 1, duration: 0.22, ease: "sine.inOut" })
    .to([earL, earR], { rotation: (i) => (i ? -14 : 14), duration: 0.28, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.1);
  return tl;
}
