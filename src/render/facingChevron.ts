/**
 * Offset XZ del chevron de facing del player.
 * Soldier forward = +Z; yaw 0 → +Z (igual que el muzzle: sin/cos).
 * No re-aplica PLAYER_GLTF_YAW_OFFSET: el yaw ya lo incluye (atan2 + offset).
 */

/** Distancia del chevron al origen del player (tiles). 1.587 × 1.15 para leer facing de noche. */
export const FACING_CHEVRON_DIST = 1.82505;

/** Largo del triángulo de suelo (tiles). 1.0646125 × 1.15 para leer facing de noche. */
export const FACING_CHEVRON_LEN = 1.224304375;

/** Semi-ancho del triángulo de suelo (tiles). 0.425845 × 1.15 para leer facing de noche. */
export const FACING_CHEVRON_HW = 0.48972175;

/**
 * Knob de calibración (rad). Default 0 — yaw 0 ya apunta +Z.
 * No es PLAYER_GLTF_YAW_OFFSET; no volver a sumarlo aquí.
 */
export const FACING_CHEVRON_YAW_OFFSET = 0;

/** Color unlit del triángulo de suelo (oro HUD `#ffe07a`). 0xe8c36a × 1.15 por canal (r clamp) para leer facing de noche. */
export const FACING_CHEVRON_COLOR = 0xffe07a;

/** Opacidad del chevron (cue, no losa sólida). 0.8625 × 1.15 para leer facing de noche. */
export const FACING_CHEVRON_OPACITY = 0.991875;

export interface FacingChevronOffset {
  x: number;
  z: number;
}

/**
 * Desplazamiento en plano XZ: (sin(yaw), cos(yaw)) · dist.
 * yaw 0 → +Z. `dist` opcional (default FACING_CHEVRON_DIST).
 * Yaw/dist no finitos → yaw 0 / dist default (offset siempre finito).
 */
/**
 * HAS MUERTO / F9 load-muerto: ocultar el cue de facing (no tapa el cadáver).
 * Vivo (incl. F9 load-vivo): visible de hoy.
 * Ya oculto = no-op; gameOver no inventa chevron.
 */
export function facingChevronVisible(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

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

/** Idle chevron yaw. Ctor playerGltfYaw 0 + placeFacingChevron = fresco. Mid-life leftover ≠ 0. */
export const FACING_CHEVRON_YAW_SPAWN = 0;

/**
 * Yaw que lee placeFacingChevron (look fresco o vivo).
 * leftover mid-life yaw ≠ fresco (idle 0).
 */
export function facingChevronYawFromLook(yaw: number): number {
  return yaw;
}

/**
 * Offset X que lee placeFacingChevron (look fresco o vivo).
 * leftover mid-life / far 40 ≠ fresco (yaw 0 → 0).
 */
export function facingChevronOffsetXFromLook(x: number): number {
  return x;
}

/**
 * Offset Z que lee placeFacingChevron (look fresco o vivo).
 * leftover mid-life / far 30 ≠ fresco (yaw 0 → DIST).
 */
export function facingChevronOffsetZFromLook(z: number): number {
  return z;
}

/**
 * R / softReset: yaw fresco (idle 0).
 * WorldView nace rotation.y AfterRestart; leftover mid-life yaw no filtra.
 * placeFacingChevron lee facingChevronYawFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function facingChevronYawAfterRestart(): number {
  return facingChevronYawFromLook(FACING_CHEVRON_YAW_SPAWN);
}

/**
 * R / softReset: offset X fresco (yaw 0 → 0).
 * WorldView nace position.x AfterRestart; leftover mid-life / far no filtra.
 * placeFacingChevron lee facingChevronOffsetXFromLook.
 */
export function facingChevronOffsetXAfterRestart(): number {
  return facingChevronOffsetXFromLook(
    facingChevronOffset(facingChevronYawAfterRestart()).x,
  );
}

/**
 * R / softReset: offset Z fresco (yaw 0 → DIST).
 * WorldView nace position.z AfterRestart; leftover mid-life / far no filtra.
 * placeFacingChevron lee facingChevronOffsetZFromLook.
 */
export function facingChevronOffsetZAfterRestart(): number {
  return facingChevronOffsetZFromLook(
    facingChevronOffset(facingChevronYawAfterRestart()).z,
  );
}
