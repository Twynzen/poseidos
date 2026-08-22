/**
 * Escala + pulso del anillo de loot más cercano — headless.
 * worldView aplica el mul al grupo del contenedor en reach.
 */

import { CONTAINER_REACH } from "../items";

/** Radio de foco (= reach de loot). */
export const LOOT_FOCUS_REACH = CONTAINER_REACH;

/** Escala encima del contenedor (dist 0; 1.5525 × 1.15, para leerse de noche). */
export const LOOT_FOCUS_SCALE_NEAR = 1.785375;

/** Escala en el borde de reach (1.288 × 1.15, para leerse de noche). */
export const LOOT_FOCUS_SCALE_FAR = 1.4812;

/** Amplitud del seno (0.0575 × 1.15, para leerse de noche). */
export const LOOT_FOCUS_PULSE_AMP = 0.066125;

/** Velocidad angular del pulso (rad/s; 6 × 1.15, para leerse de noche). */
export const LOOT_FOCUS_PULSE_SPEED = 6.9;

/** Altura world del floatBadge loot (2.3 × 1.15, misma banda door/bed; queda por encima del Soldier 1.5). */
export const lootBadgeY = 2.645;

/** Escala world del glifo loot (0.8 × 1.15, misma convención door/bed letter/disc). */
export const lootBadgeIconScale = 0.92;

/**
 * HAS MUERTO / F9 load-muerto: no pulso loot (anillo+escala) sobre el cadáver.
 * Vivo (incl. F9 load-vivo): en reach pulsa igual que hoy.
 * Ya apagado = no-op; gameOver no inventa pulso.
 */
export function lootFocusApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/** True si dist está en reach (incl. el borde). */
export function lootFocusInReach(dist: number): boolean {
  return Number.isFinite(dist) && dist <= LOOT_FOCUS_REACH;
}

/**
 * 1.785375 en dist 0 · 1.4812 en reach 1.6 · 1.0 fuera.
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

/** scale * pulse si está en reach; si no, 1 (sin pulso). gameOver → 1. */
export function lootFocusMul(
  dist: number,
  elapsed: number,
  gameOver = false,
): number {
  if (!lootFocusApplies(gameOver)) return 1;
  if (!lootFocusInReach(dist)) return 1;
  return lootFocusScale(dist) * lootFocusPulse(elapsed);
}

/** Anillo ámbar solo si hay loot Y está en reach. gameOver → hidden. */
export function lootRingVisible(
  empty: boolean,
  dist: number,
  reach: number = LOOT_FOCUS_REACH,
  gameOver = false,
): boolean {
  if (!lootFocusApplies(gameOver)) return false;
  if (empty) return false;
  if (!Number.isFinite(dist) || !Number.isFinite(reach) || reach <= 0) {
    return false;
  }
  return dist <= reach;
}

/** Spawn barrio (neighborhood 24.5, 15.5). Three default ring visible / scale 1 = leftover. */
export const LOOT_FOCUS_LOOK_X_SPAWN = 24.5;
export const LOOT_FOCUS_LOOK_Z_SPAWN = 15.5;

/**
 * Look X que lee syncLootFocus (wx fresco o vivo).
 * leftover mid-life (ctor origin 0 / far 40) ≠ look fresco (spawn 24.5).
 */
export function lootFocusLookXFromLook(wx: number): number {
  return wx;
}

/**
 * Look Z que lee syncLootFocus (wy fresco o vivo).
 * leftover mid-life (ctor origin 0 / far 30) ≠ look fresco (spawn 15.5).
 */
export function lootFocusLookZFromLook(wy: number): number {
  return wy;
}

/**
 * Distancia look→marcador que lee syncLootFocus (look fresco o vivo).
 * leftover ctor hypot(0, marker) / far ≠ dist fresco (spawn).
 */
export function lootFocusDistFromLook(
  wx: number,
  wy: number,
  mx: number,
  my: number,
): number {
  return Math.hypot(
    lootFocusLookXFromLook(wx) - mx,
    lootFocusLookZFromLook(wy) - my,
  );
}

/**
 * Pulso elapsed que lee syncLootFocus (elapsed fresco o vivo).
 * leftover mid-life (π/2 phase) ≠ elapsed fresco (0).
 */
export function lootFocusElapsedFromLook(elapsed: number): number {
  return Number.isFinite(elapsed) ? elapsed : 0;
}

/**
 * Mul que lee syncLootFocus (look fresco o vivo).
 * leftover ctor scale 1 / mid-pulse ≠ mul fresco (spawn + elapsed 0).
 */
export function lootFocusMulFromLook(
  dist: number,
  elapsed: number,
  gameOver = false,
): number {
  return lootFocusMul(dist, lootFocusElapsedFromLook(elapsed), gameOver);
}

/**
 * Anillo que lee syncLootFocus (look fresco o vivo).
 * leftover ctor Three visible / far ring ≠ anillo fresco (solo reach).
 */
export function lootRingVisibleFromLook(
  empty: boolean,
  dist: number,
  gameOver = false,
): boolean {
  return lootRingVisible(empty, dist, LOOT_FOCUS_REACH, gameOver);
}

/**
 * R / softReset: look X fresco (spawn 24.5).
 * WorldView nace applyLootFocusLook(lootFocusLookXAfterRestart(), …);
 * leftover ctor origin 0 no filtra.
 * syncLootFocus lee lootFocusLookXFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function lootFocusLookXAfterRestart(
  wx = LOOT_FOCUS_LOOK_X_SPAWN,
): number {
  return lootFocusLookXFromLook(wx);
}

/**
 * R / softReset: look Z fresco (spawn 15.5).
 * WorldView nace applyLootFocusLook(…, lootFocusLookZAfterRestart(), …);
 * leftover ctor origin 0 no filtra.
 */
export function lootFocusLookZAfterRestart(
  wy = LOOT_FOCUS_LOOK_Z_SPAWN,
): number {
  return lootFocusLookZFromLook(wy);
}

/**
 * R / softReset: elapsed fresco (0).
 * WorldView nace `lootFocusElapsed = lootFocusElapsedAfterRestart()`;
 * leftover mid-pulse de la vida anterior no filtra.
 */
export function lootFocusElapsedAfterRestart(): number {
  return lootFocusElapsedFromLook(0);
}

/**
 * R / softReset: mul fresco (spawn + elapsed 0).
 * leftover ctor scale 1 / mid-pulse no filtra.
 */
export function lootFocusMulAfterRestart(
  dist: number,
  gameOver = false,
): number {
  return lootFocusMulFromLook(dist, lootFocusElapsedAfterRestart(), gameOver);
}

/**
 * R / softReset: anillo fresco (solo reach desde spawn).
 * leftover ctor Three visible / far ring no filtra.
 */
export function lootRingVisibleAfterRestart(
  empty: boolean,
  dist: number,
  gameOver = false,
): boolean {
  return lootRingVisibleFromLook(empty, dist, gameOver);
}

/**
 * R / softReset: dist fresco (marcador vs spawn).
 * leftover ctor origin 0,0 / far 40,30 no filtra.
 */
export function lootFocusDistAfterRestart(
  mx: number,
  my: number,
  wx = LOOT_FOCUS_LOOK_X_SPAWN,
  wy = LOOT_FOCUS_LOOK_Z_SPAWN,
): number {
  return lootFocusDistFromLook(
    lootFocusLookXAfterRestart(wx),
    lootFocusLookZAfterRestart(wy),
    mx,
    my,
  );
}
