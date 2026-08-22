/**
 * Geometría / TTL de tracers de disparo — headless.
 * La malla Three vive en worldView.spawnTracer / tickTracers.
 */

export interface TracerPoint {
  x: number;
  y: number;
}

/** Duración por defecto del tracer (~flash corto). */
export const DEFAULT_TRACER_TTL = 0.253;
/** Rango visual de TTL permitido. */
export const TRACER_TTL_MIN = 0.1725;
export const TRACER_TTL_MAX = 0.4025;
/** Altura de la línea en mundo (chest). */
export const TRACER_HEIGHT = 1.388625;
/** Grosor XY de la caja-línea (tiles). 0.06875 × 1.15 para leer de noche. */
export const TRACER_WIDTH = 0.0790625;

/** Re-export: miss / max-range endpoint (misma regla que ranged). */
export { aimAlongFacing } from "../combat/ranged";

/**
 * HAS MUERTO / F9 load-muerto: no avanzar tracers ni pintar líneas.
 * Vivo (incl. F9 load-vivo): tick/opacity de hoy.
 * Ya vacío = no-op; gameOver no inventa tracer.
 */
export function tracerOverlayApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/**
 * Avanza age si aplica; gameOver no muta (skip tick).
 * dt no finito / ≤0 no avanza (igual que un tick vacío).
 */
export function tickTracerAge(
  age: number,
  dt: number,
  gameOver = false,
): number {
  if (!tracerOverlayApplies(gameOver)) return age;
  if (!Number.isFinite(dt) || dt <= 0) return age;
  return age + dt;
}

/** Clampa TTL al rango visual pedido. */
export function clampTracerTtl(ttl: number): number {
  if (!Number.isFinite(ttl)) return DEFAULT_TRACER_TTL;
  return Math.min(TRACER_TTL_MAX, Math.max(TRACER_TTL_MIN, ttl));
}

/**
 * Progreso 0..1 del tracer (0 = recién spawn, 1 = expirado).
 */
export function tracerProgress(age: number, ttl: number): number {
  const t = ttl > 0 ? ttl : DEFAULT_TRACER_TTL;
  if (age <= 0) return 0;
  if (age >= t) return 1;
  return age / t;
}

/** Opacidad lineal que cae a 0 al TTL. */
export function tracerOpacity(age: number, ttl: number): number {
  return 1 - tracerProgress(age, ttl);
}

/** Idle tracer opacity. Pool empty = 0. Three default 1 = leftover. */
export const TRACER_OPACITY_SPAWN = 0;
/** Idle tracer count. Ctor pool empty = fresco. Mid-life count leftover ≠ 0. */
export const TRACER_COUNT_SPAWN = 0;

/**
 * Opacity que lee spawn/tick (look fresco o vivo).
 * leftover ctor Three opacity 1 / mid-fade ≠ fresco (idle 0).
 */
export function tracerOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * Active/visible que lee spawn (look fresco o vivo).
 * leftover mid-life line ≠ fresco (pool empty).
 */
export function tracerActiveFromLook(active: boolean): boolean {
  return active;
}

/**
 * Count del pool que nace empty (look fresco o vivo).
 * leftover mid-life count ≠ fresco (0).
 */
export function tracerCountFromLook(count: number): number {
  return count;
}

/**
 * R / softReset: opacity fresco (idle 0).
 * WorldView nace tracerMatBase AfterRestart; leftover ctor Three 1 no filtra.
 * spawn/tick lee tracerOpacityFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function tracerOpacityAfterRestart(): number {
  return tracerOpacityFromLook(TRACER_OPACITY_SPAWN);
}

/**
 * R / softReset: active fresco (false).
 * leftover mid-life line no filtra.
 */
export function tracerActiveAfterRestart(): boolean {
  return tracerActiveFromLook(false);
}

/**
 * R / softReset: count fresco (pool empty).
 * WorldView nace `new Array(tracerCountAfterRestart())`. leftover mid-life count no filtra.
 */
export function tracerCountAfterRestart(): number {
  return tracerCountFromLook(TRACER_COUNT_SPAWN);
}

/** Idle tracer flash decay. Ctor flash.decay TRACER_FLASH_DECAY 1.74 = fresco. Mid-life leftover ≠ fresco. */
export const TRACER_FLASH_DECAY_SPAWN = 1.74;

/**
 * Decay que leería spawn/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle TRACER_FLASH_DECAY).
 * spawn/tick no escribe decay (ctor constant).
 */
export function tracerFlashDecayFromLook(decay: number): number {
  return decay;
}

/**
 * R / softReset: decay fresco (idle TRACER_FLASH_DECAY).
 * WorldView nace flash.decay AfterRestart; leftover mid-life no filtra.
 * spawn/tick no escribe decay (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function tracerFlashDecayAfterRestart(): number {
  return tracerFlashDecayFromLook(TRACER_FLASH_DECAY_SPAWN);
}

/** Idle tracer flash color. Ctor flash.color TRACER_FLASH_COLOR 0xffdd6e = fresco. Mid-life leftover ≠ fresco. */
export const TRACER_FLASH_COLOR_SPAWN = 0xffdd6e;

/**
 * Color que leería spawn/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle TRACER_FLASH_COLOR 0xffdd6e).
 * spawn/tick no escribe color (ctor constant).
 */
export function tracerFlashColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle TRACER_FLASH_COLOR 0xffdd6e).
 * WorldView nace flash.color AfterRestart; leftover mid-life no filtra.
 * spawn/tick no escribe color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function tracerFlashColorAfterRestart(): number {
  return tracerFlashColorFromLook(TRACER_FLASH_COLOR_SPAWN);
}

/** Idle tracer flash distance. Ctor flash.distance TRACER_FLASH_DISTANCE 3.68 = fresco. Mid-life leftover ≠ fresco. */
export const TRACER_FLASH_DISTANCE_SPAWN = 3.68;

/**
 * Distance que leería spawn/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle TRACER_FLASH_DISTANCE).
 * spawn/tick no escribe distance (ctor constant).
 */
export function tracerFlashDistanceFromLook(distance: number): number {
  return distance;
}

/**
 * R / softReset: distance fresco (idle TRACER_FLASH_DISTANCE).
 * WorldView nace flash.distance AfterRestart; leftover mid-life no filtra.
 * spawn/tick no escribe distance (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function tracerFlashDistanceAfterRestart(): number {
  return tracerFlashDistanceFromLook(TRACER_FLASH_DISTANCE_SPAWN);
}

/** Idle tracer mesh color. Ctor tracerMatBase.color TRACER_COLOR 0xffffb8 = fresco. Mid-life leftover ≠ fresco. */
export const TRACER_COLOR_SPAWN = 0xffffb8;

/**
 * Color que leería spawn/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle TRACER_COLOR 0xffffb8).
 * spawn/tick no escribe color (ctor constant).
 */
export function tracerColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle TRACER_COLOR 0xffffb8).
 * WorldView nace tracerMatBase.color AfterRestart; leftover mid-life no filtra.
 * spawn/tick no escribe color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function tracerColorAfterRestart(): number {
  return tracerColorFromLook(TRACER_COLOR_SPAWN);
}

/** DepthWrite del tracer mesh. Ctor tracerMatBase.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const TRACER_DEPTH_WRITE = false;

/** Idle tracer mesh depthWrite. Ctor tracerMatBase.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const TRACER_DEPTH_WRITE_SPAWN = false;

/**
 * DepthWrite que leería spawn/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * spawn/tick no escribe depthWrite (ctor constant).
 */
export function tracerDepthWriteFromLook(depthWrite: boolean): boolean {
  return depthWrite;
}

/**
 * R / softReset: depthWrite fresco (idle false).
 * WorldView nace tracerMatBase.depthWrite AfterRestart; leftover mid-life no filtra.
 * spawn/tick no escribe depthWrite (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function tracerDepthWriteAfterRestart(): boolean {
  return tracerDepthWriteFromLook(TRACER_DEPTH_WRITE_SPAWN);
}

/** Transparent del tracer mesh. Ctor tracerMatBase.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const TRACER_TRANSPARENT = true;

/** Idle tracer mesh transparent. Ctor tracerMatBase.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const TRACER_TRANSPARENT_SPAWN = true;

/**
 * Transparent que leería spawn/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * spawn/tick no escribe transparent (ctor constant).
 */
export function tracerTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle true).
 * WorldView nace tracerMatBase.transparent AfterRestart; leftover mid-life no filtra.
 * spawn/tick no escribe transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function tracerTransparentAfterRestart(): boolean {
  return tracerTransparentFromLook(TRACER_TRANSPARENT_SPAWN);
}

/** Longitud del segmento (mínimo epsilon para evitar NaN en escala). */
export function tracerLength(from: TracerPoint, to: TracerPoint): number {
  return Math.max(0.05, Math.hypot(to.x - from.x, to.y - from.y));
}

/** Midpoint en plano XZ (y mundo = altura del tracer). */
export function tracerMidpoint(from: TracerPoint, to: TracerPoint): TracerPoint {
  return { x: (from.x + to.x) * 0.5, y: (from.y + to.y) * 0.5 };
}

/**
 * Ángulo yaw (rad) para orientar un mesh cuyo eje largo es +Z
 * hacia el vector from→to en el plano XZ (x,y mundo → x,z Three).
 */
export function tracerYaw(from: TracerPoint, to: TracerPoint): number {
  const dx = to.x - from.x;
  const dz = to.y - from.y;
  return Math.atan2(dx, dz);
}
