"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  createHopperAssets,
  createHopperInstance,
  createNeonEnvironment,
  disposeHopperAssets,
  HOPPER_CYAN,
  HOPPER_MAGENTA,
  type HopperFraming,
} from "./hopper/HopperModel";
import { createHopperRig, FRAMING, type HopperPose3D } from "./hopper/HopperRig";

/**
 * Hopper, everywhere at once.
 *
 * One WebGL context draws every placement on the page: each element carrying
 * `data-hopper-view` is measured and re-rendered with `setScissor`/`setViewport`
 * against its own camera, using its own model instance and animation rig. A
 * transparent canvas sits above the page content so he can stand in front of the
 * cards instead of behind them.
 *
 * Degrades to nothing (the SVG mascot stays) when WebGL is missing, when the
 * visitor prefers reduced motion, or on phone-sized viewports where a full 3D
 * mascot costs more than it's worth.
 */

const POSE_ALIASES: Record<string, HopperPose3D> = {
  idle: "idle",
  wave: "wave",
  point: "point",
  talking: "talking",
  typing: "idle",
  sip: "sip",
  walk: "walk",
  lean: "lean",
};

const POSE_FALLBACK: Record<string, HopperPose3D> = {
  idle: "idle",
  wave: "wave",
  point: "point",
  talking: "talking",
  sip: "sip",
  walk: "walk",
  lean: "lean",
  peek: "lean",
  sit: "idle",
};

interface View {
  el: HTMLElement;
  instance: ReturnType<typeof createHopperInstance>;
  rig: ReturnType<typeof createHopperRig>;
  framing: HopperFraming;
  poseAttr: string | null;
  primary: boolean;
  override: HopperPose3D | null;
  overrideUntil: number;
  reveal: number;
  rect: DOMRect | null;
  x: number;
}

const MIN_WIDTH = 640;

export default function HopperScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tooSmall = () => window.innerWidth < MIN_WIDTH;
    if (reduced || tooSmall()) {
      document.documentElement.dataset.hopper3d = "off";
      return;
    }

    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let clock: THREE.Clock;
    const assets = createHopperAssets();
    let env: THREE.Texture | null = null;
    const views: View[] = [];
    let ground: THREE.Mesh;
    let keyLight: THREE.DirectionalLight;
    let rimCyan: THREE.PointLight;
    let rimMagenta: THREE.PointLight;
    let ambient: THREE.AmbientLight;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (err) {
      console.error("[hopper] WebGL unavailable", err);
      disposeHopperAssets(assets);
      document.documentElement.dataset.hopper3d = "off";
      return;
    }

    if (disposed) {
      renderer.dispose();
      disposeHopperAssets(assets);
      return;
    }

    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    const maxDpr = isMobile ? 1.35 : 1.85;
    const targetFps = isMobile ? 30 : 48;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";
    mount.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    env = createNeonEnvironment(renderer);
    scene.environment = env;

    camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
    clock = new THREE.Clock();

    // ---- lighting ------------------------------------------------------------
    ambient = new THREE.AmbientLight(0x2b3452, 1.05);
    scene.add(ambient);

    keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0012;
    keyLight.shadow.normalBias = 0.02;
    const sc = keyLight.shadow.camera;
    sc.near = 0.5;
    sc.far = 14;
    sc.left = -1.7;
    sc.right = 1.7;
    sc.top = 2.7;
    sc.bottom = -1.7;
    scene.add(keyLight);
    scene.add(keyLight.target);

    rimCyan = new THREE.PointLight(HOPPER_CYAN, 30, 14, 2);
    rimMagenta = new THREE.PointLight(HOPPER_MAGENTA, 26, 14, 2);
    scene.add(rimCyan, rimMagenta);

    // ---- contact shadow only: the plane itself stays invisible --------------
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.42 });
    ground = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), shadowMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.002;
    ground.receiveShadow = true;
    scene.add(ground);

    // ---- views --------------------------------------------------------------
    const SPACING = 9;

    function readPose(el: HTMLElement): string | null {
      return el.getAttribute("data-hopper-pose");
    }

    function addView(el: HTMLElement) {
      const px = el.getBoundingClientRect();
      const instance = createHopperInstance(assets);
      instance.root.position.x = views.length * SPACING;
      instance.root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = false;
        }
        const spr = o as THREE.Sprite;
        if (spr.isSprite) spr.castShadow = false;
      });
      scene.add(instance.root);
      const framing = (el.getAttribute("data-hopper-framing") as HopperFraming) || "full";
      views.push({
        el,
        instance,
        rig: createHopperRig(instance, { seed: views.length * 7.3 }),
        framing: FRAMING[framing] ? framing : "full",
        poseAttr: readPose(el),
        primary: el.hasAttribute("data-hopper-primary"),
        override: null,
        overrideUntil: 0,
        reveal: 0,
        rect: null,
        x: px.x,
      });
    }

    function syncViews() {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-hopper-view]"));
      for (const el of els) {
        const found = views.find((v) => v.el === el);
        if (!found) addView(el);
      }
      // drop views whose anchor left the DOM (route change, admin edit, etc.)
      for (let i = views.length - 1; i >= 0; i--) {
        if (!views[i].el.isConnected) {
          scene.remove(views[i].instance.root);
          views.splice(i, 1);
        }
      }
      views.forEach((v, i) => {
        v.instance.root.position.x = i * SPACING;
      });
    }

    syncViews();
    if (views.length === 0) {
      document.documentElement.dataset.hopper3d = "off";
    } else {
      document.documentElement.dataset.hopper3d = "on";
    }

    // chat widget / mascot events drive whichever view is marked primary
    const onPoseEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      const primary = views.find((v) => v.primary);
      if (!primary) return;
      if (detail === "reset") {
        primary.override = null;
        primary.overrideUntil = 0;
        return;
      }
      primary.override = POSE_ALIASES[detail] ?? "idle";
      primary.overrideUntil = performance.now() + 1500;
    };
    window.addEventListener("hopper:pose", onPoseEvent);

    const onResize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      syncViews();
    };
    window.addEventListener("resize", onResize);

    // ---- framing -------------------------------------------------------------
    // Widest pose (a raised wave) reaches ~0.9 from centre; fit against that so
    // a gesture is never clipped by the placement's scissor box.
    const halfWidth = 0.95;
    const tmpTarget = new THREE.Vector3();

    function placeCamera(view: View, rect: DOMRect) {
      const profile = FRAMING[view.framing];
      const fov = (camera.fov * Math.PI) / 180;
      const aspect = Math.max(rect.width, 1) / Math.max(rect.height, 1);
      const dVert = (profile.height / 2) / (Math.tan(fov / 2) * profile.fill);
      const dHoriz = halfWidth / (Math.tan(fov / 2) * aspect * profile.fill);
      const d = Math.max(dVert, dHoriz, 1.6);

      const yaw = profile.yaw;
      const ox = view.instance.root.position.x;
      const camY = profile.look + profile.height * 0.1;
      camera.position.set(ox + Math.sin(yaw) * d, camY, Math.cos(yaw) * d);
      tmpTarget.set(ox, profile.look, 0);
      camera.lookAt(tmpTarget);

      // move the light rig so shadows stay crisp under the active instance
      keyLight.position.set(ox + 2.6, 4.6, 3.2);
      keyLight.target.position.set(ox, 0.7, 0);
      keyLight.target.updateMatrixWorld();
      rimCyan.position.set(ox - 2.1, 1.7, -1.4);
      rimMagenta.position.set(ox + 2.3, 2.0, -1.1);
      ground.position.x = ox;
    }

    // ---- scroll / velocity ---------------------------------------------------
    let lastScrollY = window.scrollY;
    let scrollVel = 0;
    const onScroll = () => {
      const y = window.scrollY;
      scrollVel = y - lastScrollY;
      lastScrollY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ---- render loop ---------------------------------------------------------
    let lastFrame = 0;
    const frameInterval = 1000 / targetFps;

    const loop = () => {
      if (disposed || document.hidden) return;
      const now = performance.now();
      if (now - lastFrame < frameInterval) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      lastFrame = now;
      const t = clock.elapsedTime;
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      renderer.setScissorTest(false);
      renderer.clear();

      scrollVel *= 0.9;
      const walking = Math.abs(scrollVel) > 26;

      let drew = 0;
      renderer.setScissorTest(true);
      for (const view of views) {
        const rect = view.el.getBoundingClientRect();
        view.rect = rect;

        const onScreen =
          rect.bottom > -80 && rect.top < vh + 80 && rect.right > -80 && rect.left < vw + 80;
        const target = onScreen ? 1 : 0;
        view.reveal = THREE.MathUtils.damp(view.reveal, target, 6, dt);
        if (view.reveal < 0.01) continue;

        // pose: explicit override > scroll-walk (primary only) > attribute
        let pose: HopperPose3D = POSE_FALLBACK[view.poseAttr ?? "idle"] ?? "idle";
        if (view.primary && walking) pose = "walk";
        if (view.override && now < view.overrideUntil) pose = view.override;
        else if (view.override && now >= view.overrideUntil) view.override = null;

        view.rig.update(pose, t, dt);
        placeCamera(view, rect);

        // only this placement's model is in the scene for this draw, so N
        // placements cost N x (one model), not N x (all models)
        for (const other of views) other.instance.root.visible = other === view;

        // reveal = wipe up from the feet, so he never pops in
        const w = Math.max(Math.round(rect.width), 1);
        const h = Math.round(rect.height * view.reveal);
        const x = Math.round(rect.left);
        const y = Math.round(vh - rect.bottom);
        renderer.setViewport(x, y, w, Math.max(h, 1));
        renderer.setScissor(x, y, w, Math.max(h, 1));
        renderer.render(scene, camera);
        drew++;
      }
      renderer.setScissorTest(false);

      // nothing on screen: idle out to save battery, but keep the loop alive
      if (drew === 0) {
        clock.getDelta();
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        renderer.setAnimationLoop(null);
      } else {
        clock.getDelta();
        renderer.setAnimationLoop(loop);
      }
    };
    renderer.setAnimationLoop(loop);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.documentElement.dataset.hopper3d = "off";
      renderer.setAnimationLoop(null);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hopper:pose", onPoseEvent);
      if (!disposed) {
        disposed = true;
        views.forEach((v) => {
          scene.remove(v.instance.root);
        });
        ground.geometry.dispose();
        (ground.material as THREE.Material).dispose();
        env?.dispose();
        disposeHopperAssets(assets);
        renderer.dispose();
        if (renderer.domElement.parentElement === mount) {
          mount.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
