"use client";

import dynamic from "next/dynamic";

const HopperScene = dynamic(() => import("./three/HopperScene"), {
  ssr: false,
  loading: () => null,
});

/**
 * Fixed, transparent WebGL layer holding every 3D Hopper placement on the page.
 * It sits above the section content and below the chat widget, and never
 * intercepts pointer events.
 */
export default function HopperStage() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30">
      <HopperScene />
    </div>
  );
}
