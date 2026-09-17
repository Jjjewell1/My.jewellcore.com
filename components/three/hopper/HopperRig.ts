import * as THREE from "three";
import type { HopperParts } from "./HopperModel";
import type { HopperFraming, HopperPose3D } from "./HopperTypes";

export type { HopperPose3D };

type Vec3 = [number, number, number];

interface PoseDef {
  armL?: Vec3;
  armR?: Vec3;
  foreL?: Vec3;
  foreR?: Vec3;
  head?: Vec3;
  torso?: Vec3;
  /** ground-level body offset (bob / crouch) */
  bodyY?: number;
  /** whole-body tilt and turn */
  bodyRotZ?: number;
  bodyRotY?: number;
  legL?: number;
  legR?: number;
  /** jaw opening in radians */
  jaw?: number;
  /** cycles the walk animation while active */
  walk?: boolean;
  /** mutes the ear/breath overlays (e.g. while walking) */
  calm?: boolean;
}

/**
 * Angles are radians, applied to shoulder/hip/head pivots. Remember the arms
 * hang along -Y: rotation.z swings them out to the side, rotation.x swings them
 * forward (negative = forward, because +X rotation pushes -Y toward -Z).
 */
const POSES: Record<HopperPose3D, PoseDef> = {
  idle: {
    armL: [0.06, 0, 0.1],
    armR: [0.06, 0, -0.08],
    foreL: [-0.18, 0, 0.05],
    foreR: [-0.22, 0, -0.06],
    head: [0.02, 0, 0],
    torso: [0, 0, 0],
    jaw: 0,
  },
  wave: {
    // right arm up and out, forearm cocked, hand waving (applied in update)
    armR: [0.1, 0, 2.05],
    foreR: [0, 0, -0.5],
    armL: [0.06, 0, 0.12],
    foreL: [-0.2, 0, 0.06],
    head: [0.04, -0.16, 0.06],
    torso: [0, 0.1, -0.03],
    jaw: 0.06,
  },
  point: {
    // arm extended forward-right, head tracking the same way
    armR: [-1.42, 0.2, 0.34],
    foreR: [-0.18, 0, 0],
    armL: [0.1, 0, 0.16],
    foreL: [-0.3, 0, 0.08],
    head: [0.02, -0.34, 0.02],
    torso: [0, -0.12, 0],
    jaw: 0,
  },
  talking: {
    armL: [0.2, 0, 0.34],
    armR: [0.16, 0, 0.3],
    foreL: [-0.55, 0, 0.16],
    foreR: [-0.5, 0, -0.14],
    head: [0.03, 0, 0],
    torso: [0, 0, 0],
    jaw: 0.14,
  },
  sip: {
    // tumbler rides the right forearm; fold it up toward the muzzle
    armR: [0.1, 0, 0.62],
    foreR: [-2.05, 0.1, -0.16],
    armL: [0.08, 0, 0.14],
    foreL: [-0.34, 0, 0.1],
    head: [-0.14, 0.04, 0],
    torso: [0.04, 0, 0],
    jaw: 0.04,
  },
  walk: {
    armL: [0, 0, 0.22],
    armR: [0, 0, 0.16],
    foreL: [-0.35, 0, 0.1],
    foreR: [-0.3, 0, -0.1],
    head: [0.02, 0, 0],
    torso: [0.06, 0, 0],
    jaw: 0,
    walk: true,
    calm: true,
  },
  lean: {
    // propped against a block: body tilted, right arm braced low and wide
    armR: [0.1, 0, 1.15],
    foreR: [-0.5, 0, -0.2],
    armL: [0.1, 0, 0.06],
    foreL: [-0.16, 0, 0.1],
    head: [0.03, 0.14, -0.1],
    torso: [0, 0.08, 0],
    bodyRotZ: -0.09,
    legL: -0.16,
    legR: 0.06,
    jaw: 0.03,
  },
};

export interface HopperRigOptions {
  /** global motion multiplier — 0 freezes everything but the pose blend */
  speed?: number;
  /** phase offset so instances never blink or sway in lockstep */
  seed?: number;
}

const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.damp(current, target, lambda, dt);

/**
 * Per-instance animation state. Poses are damped joint targets; breath, blink,
 * ear sway and the walk cycle are layered on top so a pose change never snaps.
 */
export function createHopperRig(parts: HopperParts, options: HopperRigOptions = {}) {
  const seed = options.seed ?? Math.random() * 100;

  // damped joint state, mirrored from the pose table
  const s = {
    armLx: 0,
    armLz: 0.1,
    armRx: 0,
    armRz: -0.08,
    foreLx: -0.18,
    foreLz: 0.05,
    foreRx: -0.22,
    foreRz: -0.06,
    headx: 0,
    heady: 0,
    headz: 0,
    torsox: 0,
    torsoy: 0,
    torsoz: 0,
    bodyY: 0,
    bodyRotZ: 0,
    bodyRotY: 0,
    legL: 0,
    legR: 0,
    jaw: 0,
    blink: 0,
  };

  let walkPhase = 0;
  let blinkTimer = 1.5 + (seed % 3);
  let blinkT = -1;
  let speed = options.speed ?? 1;

  const vec = new THREE.Vector3();

  function update(poseName: HopperPose3D, now: number, dtRaw: number) {
    const dt = Math.min(dtRaw, 0.05);
    const def = POSES[poseName] ?? POSES.idle;
    const motion = dt * speed;

    // ---- pose targets (presence keeps the last value if a pose omits a joint)
    const ta = def.armL ?? POSES.idle.armL!;
    const tb = def.armR ?? POSES.idle.armR!;
    const fa = def.foreL ?? POSES.idle.foreL!;
    const fb = def.foreR ?? POSES.idle.foreR!;
    const hd = def.head ?? POSES.idle.head!;
    const to = def.torso ?? POSES.idle.torso!;

    const lambda = 6.5;
    s.armLx = damp(s.armLx, ta[0], lambda, motion);
    s.armLz = damp(s.armLz, ta[2], lambda, motion);
    s.armRx = damp(s.armRx, tb[0], lambda, motion);
    s.armRz = damp(s.armRz, tb[2], lambda, motion);
    s.foreLx = damp(s.foreLx, fa[0], lambda, motion);
    s.foreLz = damp(s.foreLz, fa[2], lambda, motion);
    s.foreRx = damp(s.foreRx, fb[0], lambda, motion);
    s.foreRz = damp(s.foreRz, fb[2], lambda, motion);
    s.headx = damp(s.headx, hd[0], lambda, motion);
    s.heady = damp(s.heady, hd[1], lambda, motion);
    s.headz = damp(s.headz, hd[2], lambda, motion);
    s.torsox = damp(s.torsox, to[0], lambda, motion);
    s.torsoy = damp(s.torsoy, to[1], lambda, motion);
    s.torsoz = damp(s.torsoz, to[2], lambda, motion);
    s.bodyRotZ = damp(s.bodyRotZ, def.bodyRotZ ?? 0, lambda * 0.6, motion);
    s.bodyRotY = damp(s.bodyRotY, def.bodyRotY ?? 0, lambda * 0.6, motion);
    s.jaw = damp(s.jaw, def.jaw ?? 0, 9, motion);

    // ---- procedural overlays
    const breathe = Math.sin(now * 1.55 + seed) * 0.5 + 0.5;
    const calm = def.calm ? 0.35 : 1;

    let legLTarget = def.legL ?? 0;
    let legRTarget = def.legR ?? 0;
    let bodyYTarget = def.bodyY ?? 0;

    if (def.walk) {
      walkPhase += dt * 6.2 * speed;
      legLTarget = Math.sin(walkPhase) * 0.62;
      legRTarget = -Math.sin(walkPhase) * 0.62;
      bodyYTarget = Math.abs(Math.sin(walkPhase * 2)) * 0.035;
      const swing = Math.sin(walkPhase) * 0.42;
      s.armLx = damp(s.armLx, ta[0] - swing, lambda, motion);
      s.armRx = damp(s.armRx, tb[0] + swing, lambda, motion);
    } else {
      walkPhase = 0;
      // arms swing a touch with the breath so idle never looks frozen
      s.armLx += Math.sin(now * 1.55 + seed) * 0.012 * calm * speed;
      s.armRx += Math.sin(now * 1.55 + seed + 0.7) * 0.012 * calm * speed;
    }
    s.legL = damp(s.legL, legLTarget, lambda, motion);
    s.legR = damp(s.legR, legRTarget, lambda, motion);
    s.bodyY = damp(s.bodyY, bodyYTarget, lambda, motion);

    // wave / talk hand motion
    let waveZ = 0;
    let waveX = 0;
    if (poseName === "wave") {
      waveZ = Math.sin(now * 5.4) * 0.3;
      waveX = Math.cos(now * 4.1) * 0.12;
    } else if (poseName === "talking") {
      waveZ = Math.sin(now * 2.6 + seed) * 0.16;
      waveX = Math.sin(now * 2.1) * 0.1;
    } else if (poseName === "sip") {
      waveX = Math.sin(now * 2.2) * 0.05;
    } else if (poseName === "point") {
      waveZ = Math.sin(now * 3.1) * 0.07;
    }

    // ---- blink (fast close/open, per-instance timer)
    if (blinkT >= 0) {
      blinkT += dt;
      const p = blinkT / 0.16;
      s.blink = p < 0.5 ? p * 2 : Math.max(0, 2 - p * 2);
      if (p >= 1) {
        blinkT = -1;
        s.blink = 0;
      }
    } else {
      blinkTimer -= dt;
      if (blinkTimer <= 0) {
        blinkT = 0;
        blinkTimer = 2.4 + Math.random() * 4.2;
      }
      s.blink = damp(s.blink, 0, 12, dt);
    }

    // ---- apply
    const p = parts;
    p.armL.rotation.set(s.armLx, 0, s.armLz);
    p.armR.rotation.set(s.armRx, 0, s.armRz + waveZ);
    p.foreArmL.rotation.set(s.foreLx, 0, s.foreLz);
    p.foreArmR.rotation.set(s.foreRx + waveX, 0, s.foreRz + waveZ * 0.35);
    p.head.rotation.set(s.headx, s.heady, s.headz);
    p.torso.rotation.set(s.torsox, s.torsoy, s.torsoz);
    p.torso.scale.set(1, 1 + breathe * 0.018 * calm, 1);
    p.body.position.y = s.bodyY + breathe * 0.012 * calm;
    p.body.rotation.z = s.bodyRotZ;
    p.body.rotation.y = s.bodyRotY;
    p.legL.rotation.x = s.legL;
    p.legR.rotation.x = s.legR;
    p.jaw.rotation.x = s.jaw * (1 + 0.5 * Math.sin(now * 9.2));

    // ear sway — a bit of follow-through on the head turn
    const sway = Math.sin(now * 1.25 + seed) * (0.05 + 0.03 * calm);
    p.earL.rotation.z = 0.16 + sway - s.heady * 0.5;
    p.earR.rotation.z = -0.16 - sway - s.heady * 0.5;
    p.earL.rotation.x = -0.12 - sway * 0.5;
    p.earR.rotation.x = -0.12 + sway * 0.5;

    // tail wag + eye blink scale
    p.tail.scale.setScalar(1 + Math.sin(now * 2.4 + seed) * 0.04);
    const lid = Math.max(0.06, 1 - s.blink);
    p.eyeL.scale.y = lid;
    p.eyeR.scale.y = lid;

    // pupils drift with the head so he reads as looking around
    vec.set(0, 0, 0);
    p.pupilL.position.x = vec.x + s.heady * 0.02;
    p.pupilR.position.x = vec.x + s.heady * 0.02;

    // tumbler glow pulses
    return breathe;
  }

  return {
    update,
    setSpeed(v: number) {
      speed = v;
    },
    pose: POSES,
  };
}

/**
 * Camera framing profiles: distance is computed from the model's own bounding
 * box so a placement can never be cropped or lost in the middle of the frame.
 * `fill` is the fraction of the viewport height the subject should cover.
 */
export const FRAMING: Record<
  HopperFraming,
  { fill: number; height: number; look: number; yaw: number }
> = {
  // height = the slice of the model (in world units) the camera should frame
  full: { fill: 0.92, height: 2.35, look: 0.86, yaw: 0.42 },
  hero: { fill: 0.9, height: 2.5, look: 0.95, yaw: 0.5 },
  bust: { fill: 0.94, height: 1.05, look: 1.5, yaw: 0.62 },
  peek: { fill: 0.88, height: 1.5, look: 1.35, yaw: 0.86 },
};
