/**
 * Wedge XZ del cono de linterna en el suelo.
 * Soldier forward = +Z; yaw 0 → +Z (igual que el chevron/muzzle: sin/cos).
 * No re-aplica PLAYER_GLTF_YAW_OFFSET: el yaw ya lo incluye (atan2 + offset).
 */

/** Alcance del cono (tiles). */
export const FLASHLIGHT_CONE_LENGTH = 5.5545;

/** Semi-ancho en el extremo lejano (tiles). Más estrecho = haz, no flood. */
export const FLASHLIGHT_CONE_HALF_WIDTH = 1.19025;

/** Altura Y de la cuña de suelo (tiles). */
export const FLASHLIGHT_CONE_Y = 0.1058;

/** Penumbra del SpotLight (0 nítido … 1 suave). 0.23 × 1.15 para leer de noche. */
export const FLASHLIGHT_SPOT_PENUMBRA = 0.2645;

/** Multiplicador de intensidad del SpotLight (sobre torchLightIntensity). */
export const FLASHLIGHT_SPOT_INTENSITY_MUL = 3.174;

/** Multiplicador del PointLight fill (el spot debe leerse por encima). */
export const FLASHLIGHT_FILL_INTENSITY_MUL = 0.727375;

/** Color de la cuña unlit (cian-blanco). */
export const FLASHLIGHT_WEDGE_COLOR = 0xefffff;

/** Color del SpotLight (cian-blanco un poco más frío). */
export const FLASHLIGHT_SPOT_COLOR = 0xf8ffff;

/** Opacidad base de la cuña (on). 0.6325 × 1.15 para leer de noche. */
export const FLASHLIGHT_WEDGE_OPACITY_BASE = 0.727375;

/** Ganancia de opacidad × intensidad. */
export const FLASHLIGHT_WEDGE_OPACITY_GAIN = 0.29095;

/** Umbral de intensidad para mostrar cono / luces. */
const FLASHLIGHT_CONE_VISIBLE_EPS = 0.02;

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

/** Alias de `flashlightConeAngle` (ángulo del SpotLight). */
export function flashlightSpotAngle(
  length: number = FLASHLIGHT_CONE_LENGTH,
  halfWidth: number = FLASHLIGHT_CONE_HALF_WIDTH,
): number {
  return flashlightConeAngle(length, halfWidth);
}

/** Alias de `flashlightConeWedge` (vértices ápice / left / right). */
export function flashlightConeWedgePoints(
  yaw: number,
  length: number = FLASHLIGHT_CONE_LENGTH,
  halfWidth: number = FLASHLIGHT_CONE_HALF_WIDTH,
): FlashlightConeWedge {
  return flashlightConeWedge(yaw, length, halfWidth);
}

/** ¿Cono / luces visibles? Mismo umbral que syncTorchLight (intensity > 0.02). */
export function flashlightConeVisible(intensity: number): boolean {
  return Number.isFinite(intensity) && intensity > FLASHLIGHT_CONE_VISIBLE_EPS;
}

/**
 * Opacidad de la cuña: 0 si off; si no, base + intensity × gain (clamp 0..1).
 */
export function flashlightWedgeOpacity(intensity: number): number {
  if (!flashlightConeVisible(intensity)) return 0;
  return Math.min(
    1,
    FLASHLIGHT_WEDGE_OPACITY_BASE + intensity * FLASHLIGHT_WEDGE_OPACITY_GAIN,
  );
}

/**
 * RGB por vértice (ápice, right, left): tip brillante → extremo lejano atenuado.
 * MeshBasicMaterial.vertexColors × FLASHLIGHT_WEDGE_COLOR.
 */
export function flashlightWedgeVertexColors(): Float32Array {
  return new Float32Array([
    1, 1, 1,
    0.16, 0.22, 0.3,
    0.16, 0.22, 0.3,
  ]);
}
