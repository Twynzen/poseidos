/**
 * Wedge XZ del cono de linterna en el suelo.
 * Soldier forward = +Z; yaw 0 → +Z (igual que el chevron/muzzle: sin/cos).
 * No re-aplica PLAYER_GLTF_YAW_OFFSET: el yaw ya lo incluye (atan2 + offset).
 */

/** Alcance del cono (tiles). */
export const FLASHLIGHT_CONE_LENGTH = 4.2;

/** Semi-ancho en el extremo lejano (tiles). */
export const FLASHLIGHT_CONE_HALF_WIDTH = 1.15;

/**
 * Knob de calibración (rad). Default 0 — yaw 0 ya apunta +Z.
 * No es PLAYER_GLTF_YAW_OFFSET; no volver a sumarlo aquí.
 */
export const FLASHLIGHT_CONE_YAW_OFFSET = 0;

export interface FlashlightConePoint {
  x: number;
  z: number;
}

export interface FlashlightConeWedge {
  apex: FlashlightConePoint;
  left: FlashlightConePoint;
  right: FlashlightConePoint;
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function coneYaw(yaw: number): number {
  return (
    finiteOr(yaw, 0) +
    (Number.isFinite(FLASHLIGHT_CONE_YAW_OFFSET)
      ? FLASHLIGHT_CONE_YAW_OFFSET
      : 0)
  );
}

/**
 * Punta del eje en plano XZ: (sin(yaw), cos(yaw)) · length.
 * yaw 0 → +Z. `length` opcional (default FLASHLIGHT_CONE_LENGTH).
 * Yaw/length no finitos → yaw 0 / length default (offset siempre finito).
 */
export function flashlightConeTip(
  yaw: number,
  length: number = FLASHLIGHT_CONE_LENGTH,
): FlashlightConePoint {
  const a = coneYaw(yaw);
  const d = finiteOr(length, FLASHLIGHT_CONE_LENGTH);
  return {
    x: Math.sin(a) * d,
    z: Math.cos(a) * d,
  };
}

/**
 * Rota un punto local (+X derecha, +Z forward) al yaw del player.
 */
function rotateLocal(lx: number, lz: number, yaw: number): FlashlightConePoint {
  const a = coneYaw(yaw);
  const s = Math.sin(a);
  const c = Math.cos(a);
  return {
    x: lx * c + lz * s,
    z: -lx * s + lz * c,
  };
}

/**
 * Vértices del wedge: ápice en origen, left/right en el extremo.
 * yaw 0: left = (−hw, +L), right = (+hw, +L).
 * Length/half-width no finitos → defaults.
 */
export function flashlightConeWedge(
  yaw: number,
  length: number = FLASHLIGHT_CONE_LENGTH,
  halfWidth: number = FLASHLIGHT_CONE_HALF_WIDTH,
): FlashlightConeWedge {
  const L = finiteOr(length, FLASHLIGHT_CONE_LENGTH);
  const w = finiteOr(halfWidth, FLASHLIGHT_CONE_HALF_WIDTH);
  return {
    apex: { x: 0, z: 0 },
    left: rotateLocal(-w, L, yaw),
    right: rotateLocal(w, L, yaw),
  };
}

/**
 * Semi-ángulo del SpotLight (rad): atan(halfWidth / length).
 * Length ≤ 0 o no finito → default length; half-width no finito → default.
 */
export function flashlightConeAngle(
  length: number = FLASHLIGHT_CONE_LENGTH,
  halfWidth: number = FLASHLIGHT_CONE_HALF_WIDTH,
): number {
  const L = Number.isFinite(length) && length > 0 ? length : FLASHLIGHT_CONE_LENGTH;
  const w = Number.isFinite(halfWidth) ? Math.abs(halfWidth) : FLASHLIGHT_CONE_HALF_WIDTH;
  return Math.atan(w / L);
}
