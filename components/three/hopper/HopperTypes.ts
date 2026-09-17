/**
 * Shared Hopper type vocabulary. Deliberately free of any `three` import so the
 * DOM-side anchor component can reference these without pulling the renderer
 * into its bundle.
 */
export type HopperFraming = "full" | "hero" | "bust" | "peek";

export type HopperPose3D =
  | "idle"
  | "wave"
  | "point"
  | "talking"
  | "sip"
  | "walk"
  | "lean";
