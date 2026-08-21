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

/** Copy HUD de + zoom in (frustum menor). Estilo descansaste / mute. */
export const ZOOM_IN_HUD_MSG = "acercaste";
/** Copy HUD de - zoom out (frustum mayor). */
export const ZOOM_OUT_HUD_MSG = "alejaste";

export type IsoZoomDir = "in" | "out";

/** lastLootMsg de +/- según la dirección que sí cambió el frustum. */
export function zoomHudMsg(dir: IsoZoomDir): string {
  return dir === "in" ? ZOOM_IN_HUD_MSG : ZOOM_OUT_HUD_MSG;
}

export type IsoZoomNext = {
  frustum: number;
  changed: boolean;
  msg: string | null;
};

/**
 * Un paso de +/-. `changed` es false en min/max (no spam HUD / no resize).
 * Si + y - llegan el mismo frame, el net (y el msg) es el último que movió.
 */
export function nextIsoZoom(
  current: number,
  zoomIn: boolean,
  zoomOut: boolean,
): IsoZoomNext {
  let frustum = current;
  let msg: string | null = null;
  if (zoomIn) {
    const next = zoomInFrustum(frustum);
    if (next !== frustum) {
      frustum = next;
      msg = zoomHudMsg("in");
    }
  }
  if (zoomOut) {
    const next = zoomOutFrustum(frustum);
    if (next !== frustum) {
      frustum = next;
      msg = zoomHudMsg("out");
    }
  }
  return { frustum, changed: frustum !== current, msg };
}
