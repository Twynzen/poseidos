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

/**
 * HAS MUERTO / F9 load-muerto: +/- no aplica (se drena, frustum igual, sin HUD).
 * Vivo (incl. F9 load-vivo): +/- zoomea, igual que hoy.
 * No cambia copy / limits. gameOver no inventa restore.
 */
export function zoomInputApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/**
 * HAS MUERTO / F9 load-muerto: no llama apply (frustum/msg iguales).
 * Vivo + wants → apply(). !wants → null.
 */
export function applyZoomInput<T>(
  gameOver: boolean,
  wants: boolean,
  apply: () => T | null,
): T | null {
  if (!zoomInputApplies(gameOver) || !wants) return null;
  return apply();
}

/**
 * HAS MUERTO / F9 load-muerto: frustum igual, changed false, sin msg.
 * Vivo: nextIsoZoom de hoy (changed → frustum + acercaste/alejaste; min/max no spam).
 */
export function applyIsoZoom(
  gameOver: boolean,
  current: number,
  zoomIn: boolean,
  zoomOut: boolean,
): IsoZoomNext {
  if (!zoomInputApplies(gameOver)) {
    return { frustum: current, changed: false, msg: null };
  }
  return nextIsoZoom(current, zoomIn, zoomOut);
}

/**
 * R / softReset: cámara nueva siempre nace en ISO_FRUSTUM.
 * Game.isoFrustum debe coincidir (un zoom 6–16 previo no filtra).
 * F9 load no usa esto — el zoom persiste en la misma vista.
 */
export function isoFrustumAfterRestart(): number {
  return ISO_FRUSTUM;
}

/** Spawn barrio (neighborhood 24.5, 15.5). Origin 0,0 = leftover Three default. */
export const CAMERA_LOOK_X_SPAWN = 24.5;
export const CAMERA_LOOK_Z_SPAWN = 15.5;
/** Offset iso XZ: camera.position = look + offset. */
export const CAMERA_FOLLOW_OFFSET = 12;
/** Altura Y iso de la cámara. */
export const CAMERA_FOLLOW_Y = 14;

/**
 * Look X que lee followCamera (wx fresco o vivo).
 * leftover mid-life (ctor 0 / far origin) ≠ look fresco (spawn 24.5).
 */
export function cameraFollowLookXFromLook(wx: number): number {
  return wx;
}

/**
 * Look Z que lee followCamera (wy fresco o vivo).
 * leftover mid-life (ctor 0 / far origin) ≠ look fresco (spawn 15.5).
 */
export function cameraFollowLookZFromLook(wz: number): number {
  return wz;
}

/**
 * Position X que lee followCamera (look X + offset + shake).
 * leftover ctor 12 (look 0) ≠ pos fresco (spawn 36.5).
 */
export function cameraFollowPosXFromLook(wx: number, shakeX = 0): number {
  return cameraFollowLookXFromLook(wx) + CAMERA_FOLLOW_OFFSET + shakeX;
}

/**
 * Position Y que lee followCamera (altura iso fija).
 */
export function cameraFollowPosYFromLook(): number {
  return CAMERA_FOLLOW_Y;
}

/**
 * Position Z que lee followCamera (look Z + offset + shake).
 * leftover ctor 12 (look 0) ≠ pos fresco (spawn 27.5).
 */
export function cameraFollowPosZFromLook(wz: number, shakeZ = 0): number {
  return cameraFollowLookZFromLook(wz) + CAMERA_FOLLOW_OFFSET + shakeZ;
}

/**
 * R / softReset: look X fresco (spawn 24.5).
 * WorldView nace `camera.lookAt(cameraFollowLookXAfterRestart(), 0, …)`;
 * leftover mid-life origin no filtra.
 * followCamera lee cameraFollowLookXFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function cameraFollowLookXAfterRestart(
  wx = CAMERA_LOOK_X_SPAWN,
): number {
  return cameraFollowLookXFromLook(wx);
}

/**
 * R / softReset: look Z fresco (spawn 15.5).
 * WorldView nace `camera.lookAt(…, 0, cameraFollowLookZAfterRestart())`;
 * leftover mid-life origin no filtra.
 * followCamera lee cameraFollowLookZFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function cameraFollowLookZAfterRestart(
  wz = CAMERA_LOOK_Z_SPAWN,
): number {
  return cameraFollowLookZFromLook(wz);
}

/**
 * R / softReset: pos X fresco (spawn 24.5 + 12).
 * WorldView nace `camera.position.x = cameraFollowPosXAfterRestart()`;
 * leftover ctor 12 no filtra.
 */
export function cameraFollowPosXAfterRestart(
  wx = CAMERA_LOOK_X_SPAWN,
  shakeX = 0,
): number {
  return cameraFollowPosXFromLook(wx, shakeX);
}

/**
 * R / softReset: pos Y fresco (14).
 */
export function cameraFollowPosYAfterRestart(): number {
  return cameraFollowPosYFromLook();
}

/**
 * R / softReset: pos Z fresco (spawn 15.5 + 12).
 * WorldView nace `camera.position.z = cameraFollowPosZAfterRestart()`;
 * leftover ctor 12 no filtra.
 */
export function cameraFollowPosZAfterRestart(
  wz = CAMERA_LOOK_Z_SPAWN,
  shakeZ = 0,
): number {
  return cameraFollowPosZFromLook(wz, shakeZ);
}
