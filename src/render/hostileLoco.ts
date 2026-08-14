/**
 * Locomocion visual hostiles (mute/poseído) a partir de delta de mapa (x,y) → Three (x,z).
 * Headless / sin Three.
 */

export type HostileLocoRole = "idle" | "walk" | "run";

/** Distancia mapa por frame bajo la cual se considera quieto. */
export const HOSTILE_LOCO_IDLE_DIST = 0.02;

/** Velocidad mapa (u/s) a partir de la cual se usa Run. */
export const HOSTILE_LOCO_RUN_SPEED = 3.5;

/**
 * Bob vertical mute/poseído: no hay (solo clasifica idle/walk/run → clips GLB).
 * 0 = lock; no inventar bounce. Player locoBob no se reusa aquí.
 */
export const HOSTILE_LOCO_BOB_AMP = 0;

/**
 * Clasifica idle/walk/run desde desplazamiento horizontal y dt.
 * - hypot(dx,dz) ≤ IDLE_DIST → idle
 * - dt≤0 / no finito → idle (primer frame / tick inválido)
 * - dist/dt ≥ RUN_SPEED → run
 * - else walk
 */
export function hostileLocoFromDelta(
  dx: number,
  dz: number,
  dt: number,
): HostileLocoRole {
  const safeDx = Number.isFinite(dx) ? dx : 0;
  const safeDz = Number.isFinite(dz) ? dz : 0;
  const dist = Math.hypot(safeDx, safeDz);
  if (!(dist > HOSTILE_LOCO_IDLE_DIST)) return "idle";
  if (!(Number.isFinite(dt) && dt > 0)) return "idle";
  const speed = dist / dt;
  if (speed >= HOSTILE_LOCO_RUN_SPEED) return "run";
  return "walk";
}
