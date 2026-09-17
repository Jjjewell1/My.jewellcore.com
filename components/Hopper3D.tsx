"use client";

import type { ReactNode } from "react";
import type { HopperFraming, HopperPose3D } from "./three/hopper/HopperTypes";

/**
 * A placement anchor for the 3D Hopper.
 *
 * It renders an empty, non-interactive box that the WebGL stage measures and
 * draws into. `fallback` (the SVG mascot) is only shown when 3D is unavailable —
 * reduced motion, no WebGL, or a phone viewport — so every placement always has
 * something in it.
 */
export default function Hopper3D({
  view,
  pose = "idle",
  framing = "full",
  primary = false,
  className = "",
  fallback,
  label,
}: {
  view: string;
  pose?: HopperPose3D;
  framing?: HopperFraming;
  primary?: boolean;
  className?: string;
  fallback?: ReactNode;
  label?: string;
}) {
  return (
    <div
      data-hopper-view={view}
      data-hopper-pose={pose}
      data-hopper-framing={framing}
      data-hopper-primary={primary ? "" : undefined}
      aria-hidden="true"
      className={className}
    >
      {fallback ? <div className="hopper-fallback flex h-full w-full items-center justify-center">{fallback}</div> : null}
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}
