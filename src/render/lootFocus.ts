/**
 * Escala + pulso del anillo de loot más cercano — headless.
 * worldView aplica el mul al grupo del contenedor en reach.
 */

import { CONTAINER_REACH } from "../items";

/** Radio de foco (= reach de loot). */
export const LOOT_FOCUS_REACH = CONTAINER_REACH;

/** Escala encima del contenedor (dist 0; 1.35 × 1.15, para leerse de noche). */
export const LOOT_FOCUS_SCALE_NEAR = 1.5525;

/** Escala en el borde de reach (1.12 × 1.15, para leerse de noche). */
export const LOOT_FOCUS_SCALE_FAR = 1.288;

/** Amplitud del seno (0.0575 × 1.15, para leerse de noche). */
export const LOOT_FOCUS_PULSE_AMP = 0.066125;

/** Velocidad angular del pulso (rad/s; 6 × 1.15, para leerse de noche). */
export const LOOT_FOCUS_PULSE_SPEED = 6.9;

/** True si dist está en reach (incl. el borde). */
export function lootFocusInReach(dist: number): boolean {
  return Number.isFinite(dist) && dist <= LOOT_FOCUS_REACH;
}

/**
 * 1.5525 en dist 0 · 1.288 en reach 1.6 · 1.0 fuera.
 * Lerp lineal entre near y far dentro de reach.
 */
export function lootFocusScale(dist: number): number {
  if (!lootFocusInReach(dist)) return 1;
  const d = Math.max(0, dist);
  const t = LOOT_FOCUS_REACH > 0 ? d / LOOT_FOCUS_REACH : 1;
  return (
    LOOT_FOCUS_SCALE_NEAR +
    (LOOT_FOCUS_SCALE_FAR - LOOT_FOCUS_SCALE_NEAR) * t
  );
}

/** 1 + 0.066125 * sin(elapsed * 6.9). */
export function lootFocusPulse(elapsed: number): number {
  const t = Number.isFinite(elapsed) ? elapsed : 0;
  return 1 + LOOT_FOCUS_PULSE_AMP * Math.sin(t * LOOT_FOCUS_PULSE_SPEED);
}

/** scale * pulse si está en reach; si no, 1 (sin pulso). */
export function lootFocusMul(dist: number, elapsed: number): number {
  if (!lootFocusInReach(dist)) return 1;
  return lootFocusScale(dist) * lootFocusPulse(elapsed);
}

/** Anillo ámbar solo si hay loot Y está en reach. */
export function lootRingVisible(
  empty: boolean,
  dist: number,
  reach: number = LOOT_FOCUS_REACH,
): boolean {
  if (empty) return false;
  if (!Number.isFinite(dist) || !Number.isFinite(reach) || reach <= 0) {
    return false;
  }
  return dist <= reach;
}
