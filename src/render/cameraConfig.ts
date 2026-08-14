/**
 * Cámara ortográfica isométrica compartida (creación + resize).
 * Frustum half-extent: ~8–12 tiles de radio útil sin claustrofobia.
 * Legacy 16 (personaje ~15px); 8 es más cerca que 10 (≈2× vs 1.6× zoom in).
 * Zoom runtime: +/- ajusta frustum en pasos de 1 (min 6 / max 16).
 */
export const ISO_FRUSTUM = 8;
export const ISO_FRUSTUM_MIN = 6;
export const ISO_FRUSTUM_MAX = 16;
export const ISO_FRUSTUM_STEP = 1;

export function clampIsoFrustum(value: number): number {
  return Math.min(ISO_FRUSTUM_MAX, Math.max(ISO_FRUSTUM_MIN, value));
}

/** Zoom in: frustum más pequeño (más cerca). */
export function zoomInFrustum(current: number): number {
  return clampIsoFrustum(current - ISO_FRUSTUM_STEP);
}

/** Zoom out: frustum más grande (más lejos). */
export function zoomOutFrustum(current: number): number {
  return clampIsoFrustum(current + ISO_FRUSTUM_STEP);
}
