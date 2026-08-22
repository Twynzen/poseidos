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

/** Idle chevron mesh color. Ctor chevronMat.color FACING_CHEVRON_COLOR 0xffe07a = fresco. Mid-life leftover ≠ fresco. */
export const FACING_CHEVRON_COLOR_SPAWN = 0xffe07a;

/**
 * Color que leería place/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle FACING_CHEVRON_COLOR 0xffe07a).
 * place/tick no escribe color (ctor constant).
 */
export function facingChevronColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle FACING_CHEVRON_COLOR 0xffe07a).
 * WorldView nace chevronMat.color AfterRestart; leftover mid-life no filtra.
 * place/tick no escribe color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function facingChevronColorAfterRestart(): number {
  return facingChevronColorFromLook(FACING_CHEVRON_COLOR_SPAWN);
}

/** Idle chevron mesh opacity. Ctor chevronMat.opacity FACING_CHEVRON_OPACITY 0.991875 = fresco. Mid-life leftover ≠ fresco. */
export const FACING_CHEVRON_OPACITY_SPAWN = 0.991875;

/**
 * Opacity que leería place/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle FACING_CHEVRON_OPACITY 0.991875).
 * place/tick no escribe opacity (ctor constant).
 */
export function facingChevronOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle FACING_CHEVRON_OPACITY 0.991875).
 * WorldView nace chevronMat.opacity AfterRestart; leftover mid-life no filtra.
 * place/tick no escribe opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function facingChevronOpacityAfterRestart(): number {
  return facingChevronOpacityFromLook(FACING_CHEVRON_OPACITY_SPAWN);
}

/** Transparent del chevron mesh. Ctor chevronMat.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const FACING_CHEVRON_TRANSPARENT = true;

/** Idle chevron mesh transparent. Ctor chevronMat.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const FACING_CHEVRON_TRANSPARENT_SPAWN = true;

/**
 * Transparent que leería place/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * place/tick no escribe transparent (ctor constant).
 */
export function facingChevronTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle true).
 * WorldView nace chevronMat.transparent AfterRestart; leftover mid-life no filtra.
 * place/tick no escribe transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function facingChevronTransparentAfterRestart(): boolean {
  return facingChevronTransparentFromLook(FACING_CHEVRON_TRANSPARENT_SPAWN);
}

/** DepthWrite del chevron mesh. Ctor chevronMat.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const FACING_CHEVRON_DEPTH_WRITE = false;

/** Idle chevron mesh depthWrite. Ctor chevronMat.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const FACING_CHEVRON_DEPTH_WRITE_SPAWN = false;

/**
 * DepthWrite que leería place/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * place/tick no escribe depthWrite (ctor constant).
 */
export function facingChevronDepthWriteFromLook(depthWrite: boolean): boolean {
  return depthWrite;
}

/**
 * R / softReset: depthWrite fresco (idle false).
 * WorldView nace chevronMat.depthWrite AfterRestart; leftover mid-life no filtra.
 * place/tick no escribe depthWrite (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function facingChevronDepthWriteAfterRestart(): boolean {
  return facingChevronDepthWriteFromLook(FACING_CHEVRON_DEPTH_WRITE_SPAWN);
}

/** renderOrder del chevron mesh. Ctor chevronMesh.renderOrder 8 = fresco. Mid-life leftover ≠ fresco. */
export const FACING_CHEVRON_RENDER_ORDER = 8;

/** Idle chevron mesh renderOrder. Ctor chevronMesh.renderOrder 8 = fresco. Mid-life leftover ≠ fresco. */
export const FACING_CHEVRON_RENDER_ORDER_SPAWN = 8;

/**
 * renderOrder que leería place/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 8).
 * place/tick no escribe renderOrder (ctor constant).
 */
export function facingChevronRenderOrderFromLook(renderOrder: number): number {
  return renderOrder;
}

/**
 * R / softReset: renderOrder fresco (idle 8).
 * WorldView nace chevronMesh.renderOrder AfterRestart; leftover mid-life no filtra.
 * place/tick no escribe renderOrder (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function facingChevronRenderOrderAfterRestart(): number {
  return facingChevronRenderOrderFromLook(FACING_CHEVRON_RENDER_ORDER_SPAWN);
}

/** Side del chevron mesh. Ctor chevronMat.side THREE.DoubleSide (2) = fresco. Mid-life leftover ≠ fresco. */
export const FACING_CHEVRON_SIDE = 2;

/** Idle chevron mesh side. Ctor chevronMat.side THREE.DoubleSide (2) = fresco. Mid-life leftover ≠ fresco. */
export const FACING_CHEVRON_SIDE_SPAWN = 2;

/**
 * Side que leería place/tick (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.DoubleSide / 2).
 * place/tick no escribe side (ctor constant).
 */
export function facingChevronSideFromLook(side: number): number {
  return side;
}

/**
 * R / softReset: side fresco (idle THREE.DoubleSide / 2).
 * WorldView nace chevronMat.side AfterRestart; leftover mid-life no filtra.
 * place/tick no escribe side (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function facingChevronSideAfterRestart(): number {
  return facingChevronSideFromLook(FACING_CHEVRON_SIDE_SPAWN);
}
