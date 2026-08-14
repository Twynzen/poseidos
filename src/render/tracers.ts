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
export const TRACER_TTL_MAX = 0.35;
/** Altura de la línea en mundo (chest). */
export const TRACER_HEIGHT = 1.388625;
/** Grosor XY de la caja-línea (tiles). 0.06875 × 1.15 para leer de noche. */
export const TRACER_WIDTH = 0.0790625;

/** Re-export: miss / max-range endpoint (misma regla que ranged). */
export { aimAlongFacing } from "../combat/ranged";

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
