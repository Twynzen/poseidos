/**
 * Wedge XZ del cono de linterna en el suelo.
 * Soldier forward = +Z; yaw 0 → +Z (igual que el chevron/muzzle: sin/cos).
 * No re-aplica PLAYER_GLTF_YAW_OFFSET: el yaw ya lo incluye (atan2 + offset).
 */

/** Alcance del cono (tiles). */
export const FLASHLIGHT_CONE_LENGTH = 6.387675;

/** Semi-ancho en el extremo lejano (tiles). Más estrecho = haz, no flood. */
export const FLASHLIGHT_CONE_HALF_WIDTH = 1.3687875;

/** Altura Y de la cuña de suelo (tiles). */
export const FLASHLIGHT_CONE_Y = 0.12167;

/** Penumbra del SpotLight (0 nítido … 1 suave). 0.23 × 1.15 para leer de noche. */
export const FLASHLIGHT_SPOT_PENUMBRA = 0.2645;

/** Multiplicador de intensidad del SpotLight (sobre torchLightIntensity). */
export const FLASHLIGHT_SPOT_INTENSITY_MUL = 3.6501;

/** Multiplicador del PointLight fill (el spot debe leerse por encima). */
export const FLASHLIGHT_FILL_INTENSITY_MUL = 0.83648125;

/** Color de la cuña unlit (cian-blanco). */
export const FLASHLIGHT_WEDGE_COLOR = 0xefffff;

/** Color del SpotLight (cian-blanco un poco más frío). */
export const FLASHLIGHT_SPOT_COLOR = 0xf8ffff;

/** Opacidad base de la cuña (on). 0.6325 × 1.15 para leer de noche. */
export const FLASHLIGHT_WEDGE_OPACITY_BASE = 0.727375;

/** Ganancia de opacidad × intensidad. */
export const FLASHLIGHT_WEDGE_OPACITY_GAIN = 0.3345925;

/** Canal R del extremo lejano de la cuña (ápice 1,1,1 → far atenuado). 0.16 × 1.15. */
export const FLASHLIGHT_WEDGE_FAR_R = 0.184;

/** Canal G del extremo lejano de la cuña (ápice 1,1,1 → far atenuado). 0.22 × 1.15. */
export const FLASHLIGHT_WEDGE_FAR_G = 0.253;

/** Canal B del extremo lejano de la cuña (ápice 1,1,1 → far atenuado). 0.3 × 1.15. */
export const FLASHLIGHT_WEDGE_FAR_B = 0.345;

/** Umbral de intensidad para mostrar cono / luces. */
export const FLASHLIGHT_CONE_VISIBLE_EPS = 0.0174;

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

/**
 * ¿Cono / luces visibles? Mismo umbral que syncTorchLight (intensity > 0.0174).
 * gameOver → hidden (HAS MUERTO / F9 load-muerto; no ilumina el cadáver).
 * Ya apagado = no-op; gameOver no inventa cono.
 */
export function flashlightConeVisible(
  intensity: number,
  gameOver = false,
): boolean {
  if (gameOver) return false;
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
    FLASHLIGHT_WEDGE_FAR_R, FLASHLIGHT_WEDGE_FAR_G, FLASHLIGHT_WEDGE_FAR_B,
    FLASHLIGHT_WEDGE_FAR_R, FLASHLIGHT_WEDGE_FAR_G, FLASHLIGHT_WEDGE_FAR_B,
  ]);
}

/** Idle cone yaw. Ctor flashlightConeWedge rotation.y 0 + tip +Z = fresco. Mid-life leftover ≠ 0. */
export const FLASHLIGHT_CONE_YAW_SPAWN = 0;

/**
 * Yaw que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life yaw ≠ fresco (idle 0).
 */
export function flashlightConeYawFromLook(yaw: number): number {
  return yaw;
}

/**
 * Offset X (tip) que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life / far 40 ≠ fresco (yaw 0 → 0).
 */
export function flashlightConeOffsetXFromLook(x: number): number {
  return x;
}

/**
 * Offset Z (tip) que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life / far 30 ≠ fresco (yaw 0 → LENGTH).
 */
export function flashlightConeOffsetZFromLook(z: number): number {
  return z;
}

/**
 * R / softReset: yaw fresco (idle 0).
 * WorldView nace rotation.y AfterRestart; leftover mid-life yaw no filtra.
 * syncTorchLight lee flashlightConeYawFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function flashlightConeYawAfterRestart(): number {
  return flashlightConeYawFromLook(FLASHLIGHT_CONE_YAW_SPAWN);
}

/**
 * R / softReset: offset X fresco (yaw 0 → 0).
 * WorldView nace tip.x AfterRestart; leftover mid-life / far no filtra.
 * syncTorchLight lee flashlightConeOffsetXFromLook.
 */
export function flashlightConeOffsetXAfterRestart(): number {
  return flashlightConeOffsetXFromLook(
    flashlightConeTip(flashlightConeYawAfterRestart()).x,
  );
}

/**
 * R / softReset: offset Z fresco (yaw 0 → LENGTH).
 * WorldView nace tip.z AfterRestart; leftover mid-life / far no filtra.
 * syncTorchLight lee flashlightConeOffsetZFromLook.
 */
export function flashlightConeOffsetZAfterRestart(): number {
  return flashlightConeOffsetZFromLook(
    flashlightConeTip(flashlightConeYawAfterRestart()).z,
  );
}

/** Idle fill origin X. Ctor torchLight position.x 0 + visible false = fresco. Mid-life leftover ≠ 0. */
export const FLASHLIGHT_FILL_ORIGIN_X_SPAWN = 0;

/** Idle fill origin Z. Ctor torchLight position.z 0 + visible false = fresco. Mid-life leftover ≠ 0. */
export const FLASHLIGHT_FILL_ORIGIN_Z_SPAWN = 0;

/** Idle fill visible. Ctor torchLight.visible false = fresco. Vivo on ≠ boot. */
export const FLASHLIGHT_FILL_VISIBLE_SPAWN = false;

/**
 * Origin X que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life / far 40 ≠ fresco (idle 0).
 */
export function flashlightFillOriginXFromLook(x: number): number {
  return x;
}

/**
 * Origin Z que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life / far 30 ≠ fresco (idle 0).
 */
export function flashlightFillOriginZFromLook(z: number): number {
  return z;
}

/**
 * Visible que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life on ≠ fresco (idle false).
 */
export function flashlightFillVisibleFromLook(visible: boolean): boolean {
  return visible;
}

/**
 * R / softReset: origin X fresco (idle 0).
 * WorldView nace torchLight.position.x AfterRestart; leftover mid-life / far no filtra.
 * syncTorchLight lee flashlightFillOriginXFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function flashlightFillOriginXAfterRestart(): number {
  return flashlightFillOriginXFromLook(FLASHLIGHT_FILL_ORIGIN_X_SPAWN);
}

/**
 * R / softReset: origin Z fresco (idle 0).
 * WorldView nace torchLight.position.z AfterRestart; leftover mid-life / far no filtra.
 * syncTorchLight lee flashlightFillOriginZFromLook.
 */
export function flashlightFillOriginZAfterRestart(): number {
  return flashlightFillOriginZFromLook(FLASHLIGHT_FILL_ORIGIN_Z_SPAWN);
}

/**
 * R / softReset: visible fresco (idle false).
 * WorldView nace torchLight.visible AfterRestart; leftover mid-life on no filtra.
 * syncTorchLight lee flashlightFillVisibleFromLook.
 */
export function flashlightFillVisibleAfterRestart(): boolean {
  return flashlightFillVisibleFromLook(FLASHLIGHT_FILL_VISIBLE_SPAWN);
}

/** Idle fill distance. Ctor torchLight.distance 10 leftover vs idle BASE 8.05. Mid-life leftover ≠ 8.05. */
export const FLASHLIGHT_FILL_DISTANCE_SPAWN = 8.05;

/**
 * Distance que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life / ctor 10 ≠ fresco (idle BASE 8.05).
 */
export function flashlightFillDistanceFromLook(distance: number): number {
  return distance;
}

/**
 * R / softReset: distance fresco (idle BASE 8.05 / intensity-0).
 * WorldView nace torchLight.distance AfterRestart; leftover ctor 10 / mid-life no filtra.
 * syncTorchLight lee flashlightFillDistanceFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function flashlightFillDistanceAfterRestart(): number {
  return flashlightFillDistanceFromLook(FLASHLIGHT_FILL_DISTANCE_SPAWN);
}

/** Idle spot origin X. Ctor torchSpot position.x 0 + visible false = fresco. Mid-life leftover ≠ 0. */
export const FLASHLIGHT_SPOT_ORIGIN_X_SPAWN = 0;

/** Idle spot origin Z. Ctor torchSpot position.z 0 + visible false = fresco. Mid-life leftover ≠ 0. */
export const FLASHLIGHT_SPOT_ORIGIN_Z_SPAWN = 0;

/** Idle spot visible. Ctor torchSpot.visible false = fresco. Vivo on ≠ boot. */
export const FLASHLIGHT_SPOT_VISIBLE_SPAWN = false;

/**
 * Origin X que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life / far 40 ≠ fresco (idle 0).
 */
export function flashlightSpotOriginXFromLook(x: number): number {
  return x;
}

/**
 * Origin Z que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life / far 30 ≠ fresco (idle 0).
 */
export function flashlightSpotOriginZFromLook(z: number): number {
  return z;
}

/**
 * Visible que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life on ≠ fresco (idle false).
 */
export function flashlightSpotVisibleFromLook(visible: boolean): boolean {
  return visible;
}

/**
 * R / softReset: origin X fresco (idle 0).
 * WorldView nace torchSpot.position.x AfterRestart; leftover mid-life / far no filtra.
 * syncTorchLight lee flashlightSpotOriginXFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function flashlightSpotOriginXAfterRestart(): number {
  return flashlightSpotOriginXFromLook(FLASHLIGHT_SPOT_ORIGIN_X_SPAWN);
}

/**
 * R / softReset: origin Z fresco (idle 0).
 * WorldView nace torchSpot.position.z AfterRestart; leftover mid-life / far no filtra.
 * syncTorchLight lee flashlightSpotOriginZFromLook.
 */
export function flashlightSpotOriginZAfterRestart(): number {
  return flashlightSpotOriginZFromLook(FLASHLIGHT_SPOT_ORIGIN_Z_SPAWN);
}

/**
 * R / softReset: visible fresco (idle false).
 * WorldView nace torchSpot.visible AfterRestart; leftover mid-life on no filtra.
 * syncTorchLight lee flashlightSpotVisibleFromLook.
 */
export function flashlightSpotVisibleAfterRestart(): boolean {
  return flashlightSpotVisibleFromLook(FLASHLIGHT_SPOT_VISIBLE_SPAWN);
}

/** Idle spot target X. Ctor torchSpot.target position.x 0 (origin 0 + tip.x yaw 0) = fresco. Mid-life leftover ≠ 0. */
export const FLASHLIGHT_SPOT_TARGET_X_SPAWN = 0;

/** Idle spot target Z. Ctor torchSpot.target position.z LENGTH (origin 0 + tip.z yaw 0) = fresco. Mid-life leftover ≠ LENGTH. */
export const FLASHLIGHT_SPOT_TARGET_Z_SPAWN = FLASHLIGHT_CONE_LENGTH;

/**
 * Target X que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life / far 40 ≠ fresco (idle 0).
 */
export function flashlightSpotTargetXFromLook(x: number): number {
  return x;
}

/**
 * Target Z que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life / far 30 ≠ fresco (idle LENGTH).
 */
export function flashlightSpotTargetZFromLook(z: number): number {
  return z;
}

/**
 * R / softReset: target X fresco (idle 0 = origin 0 + tip.x yaw 0).
 * WorldView nace torchSpot.target.position.x AfterRestart; leftover mid-life / far no filtra.
 * syncTorchLight lee flashlightSpotTargetXFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function flashlightSpotTargetXAfterRestart(): number {
  return flashlightSpotTargetXFromLook(FLASHLIGHT_SPOT_TARGET_X_SPAWN);
}

/**
 * R / softReset: target Z fresco (idle LENGTH = origin 0 + tip.z yaw 0).
 * WorldView nace torchSpot.target.position.z AfterRestart; leftover mid-life / far no filtra.
 * syncTorchLight lee flashlightSpotTargetZFromLook.
 */
export function flashlightSpotTargetZAfterRestart(): number {
  return flashlightSpotTargetZFromLook(FLASHLIGHT_SPOT_TARGET_Z_SPAWN);
}

/** Idle cone visible. Ctor flashlightConeWedge.visible false = fresco. Vivo on ≠ boot. */
export const FLASHLIGHT_CONE_VISIBLE_SPAWN = false;

/**
 * Visible que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life on ≠ fresco (idle false).
 */
export function flashlightConeVisibleFromLook(visible: boolean): boolean {
  return visible;
}

/**
 * R / softReset: visible fresco (idle false).
 * WorldView nace flashlightConeWedge.visible AfterRestart; leftover mid-life on no filtra.
 * syncTorchLight lee flashlightConeVisibleFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function flashlightConeVisibleAfterRestart(): boolean {
  return flashlightConeVisibleFromLook(FLASHLIGHT_CONE_VISIBLE_SPAWN);
}

/** Idle cone opacity. Ctor coneMat.opacity BASE leftover vs idle 0. Mid-life leftover ≠ 0. */
export const FLASHLIGHT_CONE_OPACITY_SPAWN = 0;

/**
 * Opacity que lee syncTorchLight (look fresco o vivo).
 * leftover mid-life / ctor BASE ≠ fresco (idle 0).
 */
export function flashlightConeOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle 0).
 * WorldView nace coneMat.opacity AfterRestart; leftover ctor BASE / mid-life no filtra.
 * syncTorchLight lee flashlightConeOpacityFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function flashlightConeOpacityAfterRestart(): number {
  return flashlightConeOpacityFromLook(FLASHLIGHT_CONE_OPACITY_SPAWN);
}
