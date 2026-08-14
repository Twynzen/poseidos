/**
 * Offset XZ del chevron de facing del player.
 * Soldier forward = +Z; yaw 0 → +Z (igual que el muzzle: sin/cos).
 * No re-aplica PLAYER_GLTF_YAW_OFFSET: el yaw ya lo incluye (atan2 + offset).
 */

/** Distancia del chevron al origen del player (tiles). 1.2 × 1.15 para no quedar bajo el Soldier. */
export const FACING_CHEVRON_DIST = 1.38;

/** Largo del triángulo de suelo (tiles). 0.70 × 1.15 para Soldier 1.5. */
export const FACING_CHEVRON_LEN = 0.805;

/** Semi-ancho del triángulo de suelo (tiles). 0.28 × 1.15. */
export const FACING_CHEVRON_HW = 0.322;

/**
 * Knob de calibración (rad). Default 0 — yaw 0 ya apunta +Z.
 * No es PLAYER_GLTF_YAW_OFFSET; no volver a sumarlo aquí.
 */
export const FACING_CHEVRON_YAW_OFFSET = 0;

/** Color unlit del triángulo de suelo (oro HUD `#e8c36a`). */
export const FACING_CHEVRON_COLOR = 0xe8c36a;

/** Opacidad del chevron (cue, no losa sólida). */
export const FACING_CHEVRON_OPACITY = 0.75;

export interface FacingChevronOffset {
  x: number;
  z: number;
}

/**
 * Desplazamiento en plano XZ: (sin(yaw), cos(yaw)) · dist.
 * yaw 0 → +Z. `dist` opcional (default FACING_CHEVRON_DIST).
 * Yaw/dist no finitos → yaw 0 / dist default (offset siempre finito).
 */
export function facingChevronOffset(
  yaw: number,
  dist: number = FACING_CHEVRON_DIST,
): FacingChevronOffset {
  const a =
    (Number.isFinite(yaw) ? yaw : 0) +
    (Number.isFinite(FACING_CHEVRON_YAW_OFFSET)
      ? FACING_CHEVRON_YAW_OFFSET
      : 0);
  const d = Number.isFinite(dist) ? dist : FACING_CHEVRON_DIST;
  return {
    x: Math.sin(a) * d,
    z: Math.cos(a) * d,
  };
}
