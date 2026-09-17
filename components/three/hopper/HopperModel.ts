import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { HopperFraming } from "./HopperTypes";

/**
 * Procedural 3D Hopper — a white hacker bunny in a black tech-wear jacket,
 * holding a glowing coffee tumbler. Built entirely from primitives so there is
 * no asset to load or ship.
 *
 * Assets (geometry + materials + the neon environment map) are built ONCE and
 * shared by every instance; each placement on the page gets its own Group and
 * its own set of pivots from `createHopperInstance`. That keeps N placements at
 * one WebGL context and a handful of extra draw calls.
 */

export const HOPPER_CYAN = 0x2fd4e0;
export const HOPPER_MAGENTA = 0xff4fd8;

export type { HopperFraming };

export interface HopperParts {
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  earL: THREE.Group;
  earR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  foreArmL: THREE.Group;
  foreArmR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  jaw: THREE.Group;
  eyeL: THREE.Group;
  eyeR: THREE.Group;
  pupilL: THREE.Object3D;
  pupilR: THREE.Object3D;
  tumbler: THREE.Group;
  tail: THREE.Object3D;
  glow: THREE.Sprite[];
}

export interface HopperAssets {
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
  textures: THREE.Texture[];
  fur: THREE.MeshPhysicalMaterial;
  jacket: THREE.MeshPhysicalMaterial;
  rubber: THREE.MeshStandardMaterial;
  metal: THREE.MeshPhysicalMaterial;
  emissiveCyan: THREE.MeshStandardMaterial;
  emissiveMagenta: THREE.MeshStandardMaterial;
  ink: THREE.MeshStandardMaterial;
  pink: THREE.MeshStandardMaterial;
  white: THREE.MeshStandardMaterial;
  glowCyan: THREE.SpriteMaterial;
  glowMagenta: THREE.SpriteMaterial;
  built: {
    torso: THREE.BufferGeometry;
    head: THREE.BufferGeometry;
    muzzle: THREE.BufferGeometry;
    cheek: THREE.BufferGeometry;
    earOuter: THREE.BufferGeometry;
    earInner: THREE.BufferGeometry;
    arm: THREE.BufferGeometry;
    armSlim: THREE.BufferGeometry;
    paw: THREE.BufferGeometry;
    leg: THREE.BufferGeometry;
    foot: THREE.BufferGeometry;
    footPad: THREE.BufferGeometry;
    eye: THREE.BufferGeometry;
    pupil: THREE.BufferGeometry;
    spark: THREE.BufferGeometry;
    tooth: THREE.BufferGeometry;
    nose: THREE.BufferGeometry;
    tail: THREE.BufferGeometry;
    collar: THREE.BufferGeometry;
    trim: THREE.BufferGeometry;
    strap: THREE.BufferGeometry;
    badge: THREE.BufferGeometry;
    tumblerBody: THREE.BufferGeometry;
    tumblerBand: THREE.BufferGeometry;
    tumblerLid: THREE.BufferGeometry;
    tumblerCap: THREE.BufferGeometry;
  };
}

/**
 * A tiny neon studio encoded as an equirect canvas, pushed through PMREM so the
 * glossy fur/clearcoat actually has cyan and magenta to reflect. Without an
 * environment map a white clearcoat reads as flat grey plastic.
 */
export function createNeonEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, "#0a0d18");
  base.addColorStop(0.45, "#05060c");
  base.addColorStop(1, "#020307");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  const blob = (x: number, y: number, r: number, color: string, alpha: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
  };

  // key light above + hard neon rims left (cyan) and right (magenta)
  blob(w * 0.5, h * 0.12, 150, "#ffffff", 0.85);
  blob(w * 0.16, h * 0.55, 190, "#2fd4e0", 0.9);
  blob(w * 0.84, h * 0.6, 190, "#ff4fd8", 0.85);
  blob(w * 0.32, h * 0.82, 120, "#1a4b8f", 0.5);
  blob(w * 0.7, h * 0.3, 90, "#ffb454", 0.35);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

function makeGlowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.35, "rgba(255,255,255,0.32)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createHopperAssets(): HopperAssets {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const keep = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const mat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // ---- materials -----------------------------------------------------------
  // Glossy white fur: clearcoat for the sheen, sheen for the soft fabric-ish
  // falloff you get on stylised fur.
  const fur = mat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf7f8fc,
      roughness: 0.62,
      metalness: 0.0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.28,
      sheen: 0.65,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color(0xdcf6ff),
      envMapIntensity: 1.35,
    })
  );

  const jacket = mat(
    new THREE.MeshPhysicalMaterial({
      color: 0x0b0d13,
      roughness: 0.46,
      metalness: 0.12,
      clearcoat: 0.35,
      clearcoatRoughness: 0.3,
      sheen: 1.0,
      sheenRoughness: 0.42,
      sheenColor: new THREE.Color(0x8fa6c8),
      envMapIntensity: 1.1,
    })
  );

  const rubber = mat(
    new THREE.MeshStandardMaterial({ color: 0x14171f, roughness: 0.85, metalness: 0.05 })
  );

  const metal = mat(
    new THREE.MeshPhysicalMaterial({
      color: 0xc9d3e0,
      roughness: 0.22,
      metalness: 0.95,
      envMapIntensity: 1.5,
    })
  );

  const emissiveCyan = mat(
    new THREE.MeshStandardMaterial({
      color: 0x081018,
      emissive: HOPPER_CYAN,
      emissiveIntensity: 2.6,
      roughness: 0.4,
      metalness: 0.2,
    })
  );

  const emissiveMagenta = mat(
    new THREE.MeshStandardMaterial({
      color: 0x14060f,
      emissive: HOPPER_MAGENTA,
      emissiveIntensity: 2.2,
      roughness: 0.45,
      metalness: 0.2,
    })
  );

  const ink = mat(new THREE.MeshStandardMaterial({ color: 0x0a0b10, roughness: 0.35, metalness: 0.1 }));
  const pink = mat(new THREE.MeshStandardMaterial({ color: 0xff9ec4, roughness: 0.55, metalness: 0.0 }));
  const white = mat(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.0 }));

  const glowTex = makeGlowTexture();
  textures.push(glowTex);
  const glowCyan = mat(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: HOPPER_CYAN,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  const glowMagenta = mat(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: HOPPER_MAGENTA,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  // ---- shared geometry (segment counts kept lean: many placements) ---------
  const built: HopperAssets["built"] = {
    torso: keep(new THREE.CapsuleGeometry(0.30, 0.38, 8, 20)),
    head: keep(new THREE.SphereGeometry(0.42, 28, 20)),
    muzzle: keep(new THREE.SphereGeometry(0.19, 20, 14)),
    cheek: keep(new THREE.SphereGeometry(0.155, 16, 12)),
    earOuter: keep(new THREE.CapsuleGeometry(0.095, 0.42, 8, 14)),
    earInner: keep(new THREE.CapsuleGeometry(0.055, 0.30, 6, 12)),
    arm: keep(new THREE.CapsuleGeometry(0.093, 0.20, 8, 12)),
    armSlim: keep(new THREE.CapsuleGeometry(0.078, 0.17, 8, 12)),
    paw: keep(new THREE.SphereGeometry(0.105, 16, 12)),
    leg: keep(new THREE.CapsuleGeometry(0.125, 0.24, 8, 12)),
    foot: keep(new RoundedBoxGeometry(0.24, 0.14, 0.42, 4, 0.06)),
    footPad: keep(new RoundedBoxGeometry(0.19, 0.05, 0.3, 3, 0.02)),
    eye: keep(new THREE.SphereGeometry(0.082, 18, 14)),
    pupil: keep(new THREE.SphereGeometry(0.05, 14, 10)),
    spark: keep(new THREE.SphereGeometry(0.024, 10, 8)),
    tooth: keep(new RoundedBoxGeometry(0.075, 0.095, 0.03, 3, 0.012)),
    nose: keep(new THREE.SphereGeometry(0.045, 12, 10)),
    tail: keep(new THREE.SphereGeometry(0.145, 18, 14)),
    collar: keep(new THREE.TorusGeometry(0.3, 0.075, 10, 24)),
    trim: keep(new THREE.BoxGeometry(0.026, 0.44, 0.022)),
    strap: keep(new THREE.BoxGeometry(0.5, 0.055, 0.02)),
    badge: keep(new RoundedBoxGeometry(0.15, 0.075, 0.02, 3, 0.01)),
    tumblerBody: keep(new THREE.CylinderGeometry(0.085, 0.07, 0.24, 20, 1)),
    tumblerBand: keep(new THREE.CylinderGeometry(0.088, 0.088, 0.045, 20, 1)),
    tumblerLid: keep(new THREE.CylinderGeometry(0.082, 0.082, 0.035, 20, 1)),
    tumblerCap: keep(new THREE.CylinderGeometry(0.026, 0.026, 0.03, 12, 1)),
  };

  return {
    geometries,
    materials,
    textures,
    fur,
    jacket,
    rubber,
    metal,
    emissiveCyan,
    emissiveMagenta,
    ink,
    pink,
    white,
    glowCyan,
    glowMagenta,
    built,
  };
}

/**
 * One posed, placed Hopper. Returns the group plus every pivot the rig needs.
 * Origin sits between the feet (y=0) so a placement's rect maps to ground level.
 */
export function createHopperInstance(assets: HopperAssets): HopperParts {
  const b = assets.built;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // ---- torso + jacket ------------------------------------------------------
  const torso = new THREE.Group();
  torso.position.y = 0.86;
  body.add(torso);

  const torsoMesh = new THREE.Mesh(b.torso, assets.jacket);
  torsoMesh.scale.set(1.14, 1.02, 0.86);
  torso.add(torsoMesh);

  // tech-wear hardware: collar, zipper, reflective straps, hem, badge
  const collar = new THREE.Mesh(b.collar, assets.jacket);
  collar.position.set(0, 0.3, -0.02);
  collar.rotation.x = Math.PI / 2.1;
  collar.scale.set(0.92, 0.92, 0.72);
  torso.add(collar);

  const zip = new THREE.Mesh(b.trim, assets.emissiveCyan);
  zip.position.set(0, -0.02, 0.27);
  zip.scale.set(0.7, 0.96, 1);
  torso.add(zip);

  const strapA = new THREE.Mesh(b.strap, assets.rubber);
  strapA.position.set(0, 0.1, 0.255);
  strapA.rotation.z = 0.22;
  torso.add(strapA);

  const strapB = new THREE.Mesh(b.strap, assets.metal);
  strapB.position.set(0, 0.16, 0.25);
  strapB.rotation.z = 0.22;
  strapB.scale.set(1.02, 0.42, 1.1);
  torso.add(strapB);

  const badge = new THREE.Mesh(b.badge, assets.emissiveCyan);
  badge.position.set(0.16, -0.12, 0.25);
  badge.rotation.z = -0.08;
  torso.add(badge);

  const hem = new THREE.Mesh(b.collar, assets.rubber);
  hem.position.set(0, -0.36, 0);
  hem.rotation.x = Math.PI / 2;
  hem.scale.set(1.03, 1.03, 0.62);
  torso.add(hem);

  // magenta shoulder strip so the two neon notes bookend the silhouette
  const shoulderGlow = new THREE.Mesh(b.trim, assets.emissiveMagenta);
  shoulderGlow.position.set(-0.3, 0.26, 0.05);
  shoulderGlow.rotation.z = 0.5;
  shoulderGlow.scale.set(0.8, 0.42, 1);
  torso.add(shoulderGlow);

  // ---- head ---------------------------------------------------------------
  const neck = new THREE.Group();
  neck.position.y = 0.34;
  torso.add(neck);

  const head = new THREE.Group();
  neck.add(head);

  const skull = new THREE.Mesh(b.head, assets.fur);
  skull.scale.set(1.04, 0.99, 0.96);
  head.add(skull);

  const cheekL = new THREE.Mesh(b.cheek, assets.fur);
  cheekL.position.set(-0.2, -0.12, 0.24);
  cheekL.scale.set(1, 0.9, 0.9);
  head.add(cheekL);

  const cheekR = cheekL.clone();
  cheekR.position.x = 0.2;
  head.add(cheekR);

  const muzzle = new THREE.Mesh(b.muzzle, assets.fur);
  muzzle.position.set(0, -0.11, 0.31);
  muzzle.scale.set(1.12, 0.86, 0.95);
  head.add(muzzle);

  const nose = new THREE.Mesh(b.nose, assets.ink);
  nose.position.set(0, -0.05, 0.47);
  nose.scale.set(1.25, 0.85, 0.9);
  head.add(nose);

  // mouth: a small group so talking can open/close it
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.16, 0.3);
  head.add(jaw);

  const toothL = new THREE.Mesh(b.tooth, assets.white);
  toothL.position.set(-0.042, 0.005, 0.15);
  jaw.add(toothL);
  const toothR = toothL.clone();
  toothR.position.x = 0.042;
  jaw.add(toothR);

  const smile = new THREE.Mesh(b.trim, assets.ink);
  smile.position.set(0, -0.035, 0.155);
  smile.rotation.x = Math.PI / 2;
  smile.scale.set(0.5, 0.6, 1);
  jaw.add(smile);

  // eyes: outer white ring + dark pupil + spark, grouped for blinking
  const makeEye = (x: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.06, 0.31);
    const ball = new THREE.Mesh(b.eye, assets.ink);
    ball.scale.set(1, 1.06, 0.85);
    g.add(ball);
    const pupil = new THREE.Mesh(b.pupil, assets.ink);
    pupil.position.z = 0.055;
    g.add(pupil);
    const spark = new THREE.Mesh(b.spark, assets.white);
    spark.position.set(x > 0 ? -0.022 : 0.022, 0.024, 0.085);
    g.add(spark);
    head.add(g);
    return { g, pupil };
  };
  const eyeL = makeEye(-0.155);
  const eyeR = makeEye(0.155);

  // brows give him the "hacker" resting face
  const browL = new THREE.Mesh(b.trim, assets.ink);
  browL.position.set(-0.15, 0.19, 0.35);
  browL.rotation.z = -0.22;
  browL.scale.set(0.75, 0.34, 1.4);
  head.add(browL);
  const browR = browL.clone();
  browR.position.x = 0.15;
  browR.rotation.z = 0.22;
  head.add(browR);

  // whiskers
  const whiskers: THREE.Object3D[] = [];
  for (let i = 0; i < 3; i++) {
    const wl = new THREE.Mesh(b.trim, assets.ink);
    wl.position.set(-0.21, -0.07 + i * 0.045, 0.3);
    wl.rotation.z = Math.PI / 2 + (i - 1) * 0.22;
    wl.scale.set(0.35, 3.1 - i * 0.25, 0.5);
    head.add(wl);
    whiskers.push(wl);
    const wr = wl.clone();
    wr.position.x = 0.21;
    wr.rotation.z = -Math.PI / 2 - (i - 1) * 0.22;
    head.add(wr);
    whiskers.push(wr);
  }

  // ---- ears ---------------------------------------------------------------
  const makeEar = (x: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.34, -0.03);
    g.rotation.z = x > 0 ? -0.16 : 0.16;
    g.rotation.x = -0.12;
    const outer = new THREE.Mesh(b.earOuter, assets.fur);
    outer.position.y = 0.32;
    outer.scale.set(1, 1, 0.72);
    g.add(outer);
    const inner = new THREE.Mesh(b.earInner, assets.pink);
    inner.position.set(0, 0.3, 0.05);
    inner.scale.set(1, 1, 0.6);
    g.add(inner);
    // neon inner seam picks up the rim light in the reference
    const seam = new THREE.Mesh(b.trim, assets.emissiveMagenta);
    seam.position.set(0, 0.3, 0.075);
    seam.scale.set(0.3, 2.1, 0.8);
    g.add(seam);
    head.add(g);
    return g;
  };
  const earL = makeEar(-0.17);
  const earR = makeEar(0.17);

  // ---- arms ---------------------------------------------------------------
  // Shoulder pivot at the joint; the sleeve and paw hang from it so poses are
  // pure rotation and can never tear the mesh apart.
  const makeArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.34, 0.2, 0.02);
    torso.add(shoulder);
    const upper = new THREE.Mesh(b.arm, assets.jacket);
    upper.position.y = -0.13;
    upper.scale.set(1.06, 1.05, 1.02);
    shoulder.add(upper);
    // reflective band on the upper sleeve
    const band = new THREE.Mesh(b.trim, assets.emissiveMagenta);
    band.position.set(side * 0.075, -0.06, 0.02);
    band.rotation.z = side * 0.5;
    band.scale.set(0.7, 0.3, 1.1);
    shoulder.add(band);

    const fore = new THREE.Group();
    fore.position.y = -0.26;
    shoulder.add(fore);
    const forearm = new THREE.Mesh(b.armSlim, assets.jacket);
    forearm.position.y = -0.11;
    fore.add(forearm);
    const cuff = new THREE.Mesh(b.collar, assets.rubber);
    cuff.position.y = -0.21;
    cuff.rotation.x = Math.PI / 2;
    cuff.scale.set(0.42, 0.42, 0.4);
    fore.add(cuff);
    const paw = new THREE.Mesh(b.paw, assets.fur);
    paw.position.y = -0.27;
    paw.scale.set(1, 1.1, 1.05);
    fore.add(paw);
    return { shoulder, fore, paw };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // ---- legs ---------------------------------------------------------------
  const makeLeg = (side: -1 | 1) => {
    const g = new THREE.Group();
    g.position.set(side * 0.16, 0.62, 0);
    body.add(g);
    const leg = new THREE.Mesh(b.leg, assets.jacket);
    leg.position.y = -0.24;
    leg.scale.set(1.05, 1.06, 1.02);
    g.add(leg);
    const ankle = new THREE.Mesh(b.collar, assets.fur);
    ankle.position.y = -0.42;
    ankle.rotation.x = Math.PI / 2;
    ankle.scale.set(0.5, 0.5, 0.46);
    g.add(ankle);
    const foot = new THREE.Mesh(b.foot, assets.fur);
    foot.position.set(0, -0.5, 0.09);
    g.add(foot);
    const pad = new THREE.Mesh(b.footPad, assets.rubber);
    pad.position.set(0, -0.54, 0.1);
    g.add(pad);
    return g;
  };
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  // tail
  const tail = new THREE.Mesh(b.tail, assets.fur);
  tail.position.set(0, 0.6, -0.3);
  tail.scale.set(1, 1, 0.9);
  body.add(tail);

  // ---- tumbler (right paw) ------------------------------------------------
  const tumbler = new THREE.Group();
  tumbler.position.set(0.02, -0.3, 0.13);
  tumbler.rotation.x = -0.1;
  const cup = new THREE.Mesh(b.tumblerBody, assets.metal);
  tumbler.add(cup);
  const cupBand = new THREE.Mesh(b.tumblerBand, assets.emissiveCyan);
  cupBand.position.y = -0.02;
  tumbler.add(cupBand);
  const lid = new THREE.Mesh(b.tumblerLid, assets.rubber);
  lid.position.y = 0.135;
  tumbler.add(lid);
  const cap = new THREE.Mesh(b.tumblerCap, assets.rubber);
  cap.position.y = 0.165;
  cap.position.x = 0.03;
  tumbler.add(cap);
  armR.fore.add(tumbler);

  // ---- neon halo sprites (cheap stand-in for a bloom pass) ----------------
  const makeGlow = (m: THREE.SpriteMaterial, x: number, y: number, z: number, s: number) => {
    const spr = new THREE.Sprite(m);
    spr.position.set(x, y, z);
    spr.scale.setScalar(s);
    body.add(spr);
    return spr;
  };
  const glow = [
    makeGlow(assets.glowCyan, -0.52, 1.1, -0.16, 1.5),
    makeGlow(assets.glowMagenta, 0.5, 1.18, -0.1, 1.35),
    makeGlow(assets.glowCyan, 0.1, 0.28, 0.24, 0.85),
  ];

  return {
    root,
    body,
    torso,
    head,
    earL,
    earR,
    armL: armL.shoulder,
    armR: armR.shoulder,
    foreArmL: armL.fore,
    foreArmR: armR.fore,
    legL,
    legR,
    jaw,
    eyeL: eyeL.g,
    eyeR: eyeR.g,
    pupilL: eyeL.pupil,
    pupilR: eyeR.pupil,
    tumbler,
    tail,
    glow,
  };
}

export function disposeHopperAssets(assets: HopperAssets) {
  assets.geometries.forEach((g) => g.dispose());
  assets.materials.forEach((m) => m.dispose());
  assets.textures.forEach((t) => t.dispose());
}
