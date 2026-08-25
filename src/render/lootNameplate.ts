/**
 * Nameplate flotante del contenedor — headless.
 * worldView aplica label/opacity al Sprite canvas hijo del grupo loot.
 */

import * as THREE from "three";

/** Máximo de caracteres del label. */
export const LOOT_NAMEPLATE_MAX_CHARS = 23;

/** Distancia a la que el nameplate sigue opaco / escala 1. 2 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_NEAR_DIST = 2.3;

/** Distancia a la que el nameplate llega a opacity 0. 6.325 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_FADE_DIST = 7.27375;

/** Escala mid-distance en el fade edge (dist ≥ fade). 0.552 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_MID_SCALE = 0.6348;

/** Altura local Y del sprite sobre el grupo loot. 2.4725 × 1.15 para despejar el mesh de noche. */
export const LOOT_NAMEPLATE_Y = 2.843375;

/** Escala world del sprite (canvas 384×80). 2.99 × 1.15 / 0.7475 × 1.15 para leer el label de noche. */
export const LOOT_NAMEPLATE_SCALE_X = 3.4385;
export const LOOT_NAMEPLATE_SCALE_Y = 0.859625;

/** Padding izquierdo del canvas para la silueta gold. 78.2 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_ICON_PAD = 89.93;
/** Tamaño de la silueta gold en el atlas (px). 73.6 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_ICON_SIZE = 84.64;

/** Tamaño de fuente del label en el canvas. 39.1 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_FONT_PX = 44.965;

/** Grosor del stroke del label en el canvas. 5.175 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_STROKE_PX = 5.95125;

/** Color del fill del label en el canvas. #f0c060 ×1.15 por canal (r clamp) para leer de noche. */
export const LOOT_NAMEPLATE_FILL = "#ffdd6e";

/** Fill del plate backdrop del nameplate. 0.828 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_PLATE_FILL = "rgba(15, 23, 42, 0.9522)";

/** Stroke del label en el canvas. 0.805 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_TEXT_STROKE = "rgba(0,0,0,0.92575)";

/** Grosor del stroke del icono gold. 1.725 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_ICON_STROKE = 1.98375;

/**
 * 1 en dist ≤ NEAR · lerp 1 → mid-scale de NEAR a fade · mid-scale más allá.
 * Omitido / no finito → 1.
 */
export function lootNameplateScale(dist?: number): number {
  if (dist === undefined || !Number.isFinite(dist)) return 1;
  if (dist <= LOOT_NAMEPLATE_NEAR_DIST) return 1;
  if (dist >= LOOT_NAMEPLATE_FADE_DIST) return LOOT_NAMEPLATE_MID_SCALE;
  const t =
    (dist - LOOT_NAMEPLATE_NEAR_DIST) /
    (LOOT_NAMEPLATE_FADE_DIST - LOOT_NAMEPLATE_NEAR_DIST);
  return 1 + (LOOT_NAMEPLATE_MID_SCALE - 1) * t;
}

/** Corta el nombre a 23 chars (sin ellipsis). */
export function lootNameplateLabel(label: string): string {
  if (typeof label !== "string") return "";
  if (label.length <= LOOT_NAMEPLATE_MAX_CHARS) return label;
  return label.slice(0, LOOT_NAMEPLATE_MAX_CHARS);
}

export function truncateLootLabel(label: string): string {
  return lootNameplateLabel(label);
}

/**
 * 1 en dist ≤ NEAR · lerp 1 → 0 de NEAR a fade · 0 en fade y más allá.
 * Fuera / no finito → 0. Dist negativa se clampa a 0.
 */
export function lootNameplateOpacity(dist: number): number {
  if (!Number.isFinite(dist)) return 0;
  if (dist >= LOOT_NAMEPLATE_FADE_DIST) return 0;
  const d = Math.max(0, dist);
  if (d <= LOOT_NAMEPLATE_NEAR_DIST) return 1;
  return (
    1 -
    (d - LOOT_NAMEPLATE_NEAR_DIST) /
      (LOOT_NAMEPLATE_FADE_DIST - LOOT_NAMEPLATE_NEAR_DIST)
  );
}

/**
 * Visible si opacity > 0 y el contenedor no está vacío.
 * empty / dist >= fade / no finito → false.
 * gameOver → hidden (HAS MUERTO / F9 load-muerto; no tapa HAS MUERTO).
 * Ya oculto = no-op; gameOver no inventa nameplate.
 * Firma igual que `lootRingVisible(empty, dist, reach?, gameOver?)`.
 */
export function lootNameplateVisible(
  empty: boolean,
  dist: number,
  gameOver = false,
): boolean {
  if (gameOver) return false;
  if (empty) return false;
  return lootNameplateOpacity(dist) > 0;
}

/** Spawn barrio (neighborhood 24.5, 15.5). Ctor dist 0 / Three opacity 1 = leftover. */
export const LOOT_NAMEPLATE_LOOK_X_SPAWN = 24.5;
export const LOOT_NAMEPLATE_LOOK_Z_SPAWN = 15.5;

/**
 * Look X que lee syncLootFocus (wx fresco o vivo).
 * leftover mid-life (ctor origin 0 / far 40) ≠ look fresco (spawn 24.5).
 */
export function lootNameplateLookXFromLook(wx: number): number {
  return wx;
}

/**
 * Look Z que lee syncLootFocus (wy fresco o vivo).
 * leftover mid-life (ctor origin 0 / far 30) ≠ look fresco (spawn 15.5).
 */
export function lootNameplateLookZFromLook(wy: number): number {
  return wy;
}

/**
 * Distancia look→marcador que lee syncLootFocus (look fresco o vivo).
 * leftover ctor dist 0 / hypot(0, marker) / far ≠ dist fresco (spawn).
 */
export function lootNameplateDistFromLook(
  wx: number,
  wy: number,
  mx: number,
  my: number,
): number {
  return Math.hypot(
    lootNameplateLookXFromLook(wx) - mx,
    lootNameplateLookZFromLook(wy) - my,
  );
}

/**
 * Opacity que lee syncLootFocus (dist fresco o vivo).
 * leftover ctor Three 1 / dist 0 ≠ fade fresco (spawn).
 */
export function lootNameplateOpacityFromLook(dist: number): number {
  return lootNameplateOpacity(dist);
}

/**
 * Visible que lee syncLootFocus (empty + dist fresco o vivo).
 * leftover ctor dist 0 / Three visible ≠ plate fresco (solo fade).
 */
export function lootNameplateVisibleFromLook(
  empty: boolean,
  dist: number,
  gameOver = false,
): boolean {
  return lootNameplateVisible(empty, dist, gameOver);
}

/**
 * Scale mul que lee syncLootFocus (dist fresco o vivo).
 * leftover ctor scale 1 / dist 0 ≠ fade fresco (spawn).
 */
export function lootNameplateScaleFromLook(dist?: number): number {
  return lootNameplateScale(dist);
}

/**
 * R / softReset: look X fresco (spawn 24.5).
 * WorldView nace applyLootNameplateLook(lootNameplateLookXAfterRestart(), …);
 * leftover ctor origin 0 / dist 0 no filtra.
 * syncLootFocus lee lootNameplateLookXFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateLookXAfterRestart(
  wx = LOOT_NAMEPLATE_LOOK_X_SPAWN,
): number {
  return lootNameplateLookXFromLook(wx);
}

/**
 * R / softReset: look Z fresco (spawn 15.5).
 * WorldView nace applyLootNameplateLook(…, lootNameplateLookZAfterRestart(), …);
 * leftover ctor origin 0 no filtra.
 */
export function lootNameplateLookZAfterRestart(
  wy = LOOT_NAMEPLATE_LOOK_Z_SPAWN,
): number {
  return lootNameplateLookZFromLook(wy);
}

/**
 * R / softReset: dist fresco (marcador vs spawn).
 * leftover ctor dist 0 / origin 0,0 / far 40,30 no filtra.
 */
export function lootNameplateDistAfterRestart(
  mx: number,
  my: number,
  wx = LOOT_NAMEPLATE_LOOK_X_SPAWN,
  wy = LOOT_NAMEPLATE_LOOK_Z_SPAWN,
): number {
  return lootNameplateDistFromLook(
    lootNameplateLookXAfterRestart(wx),
    lootNameplateLookZAfterRestart(wy),
    mx,
    my,
  );
}

/**
 * R / softReset: opacity fresco (spawn + fade).
 * leftover ctor Three 1 / dist 0 no filtra.
 */
export function lootNameplateOpacityAfterRestart(dist: number): number {
  return lootNameplateOpacityFromLook(dist);
}

/**
 * R / softReset: visible fresco (solo fade desde spawn).
 * leftover ctor dist 0 / Three visible no filtra.
 */
export function lootNameplateVisibleAfterRestart(
  empty: boolean,
  dist: number,
  gameOver = false,
): boolean {
  return lootNameplateVisibleFromLook(empty, dist, gameOver);
}

/**
 * R / softReset: scale fresco (fade desde spawn).
 * leftover ctor scale 1 / dist 0 no filtra.
 */
export function lootNameplateScaleAfterRestart(dist?: number): number {
  return lootNameplateScaleFromLook(dist);
}

/** Transparent del nameplate sprite. Ctor SpriteMaterial.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_TRANSPARENT = true;

/** Idle nameplate sprite transparent. Ctor SpriteMaterial.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_TRANSPARENT_SPAWN = true;

/**
 * Transparent que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * syncLootFocus no escribe transparent (ctor constant).
 */
export function lootNameplateTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle true).
 * WorldView nace SpriteMaterial.transparent AfterRestart; leftover mid-life no filtra.
 * syncLootFocus no escribe transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateTransparentAfterRestart(): boolean {
  return lootNameplateTransparentFromLook(LOOT_NAMEPLATE_TRANSPARENT_SPAWN);
}

/** DepthWrite del nameplate sprite. Ctor SpriteMaterial.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_DEPTH_WRITE = false;

/** Idle nameplate sprite depthWrite. Ctor SpriteMaterial.depthWrite false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_DEPTH_WRITE_SPAWN = false;

/**
 * DepthWrite que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * syncLootFocus no escribe depthWrite (ctor constant).
 */
export function lootNameplateDepthWriteFromLook(depthWrite: boolean): boolean {
  return depthWrite;
}

/**
 * R / softReset: depthWrite fresco (idle false).
 * WorldView nace SpriteMaterial.depthWrite AfterRestart; leftover mid-life no filtra.
 * syncLootFocus no escribe depthWrite (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateDepthWriteAfterRestart(): boolean {
  return lootNameplateDepthWriteFromLook(LOOT_NAMEPLATE_DEPTH_WRITE_SPAWN);
}

/** Color del nameplate sprite. Ctor SpriteMaterial.color 0xffffff = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_COLOR = 0xffffff;

/** Idle nameplate sprite color. Ctor SpriteMaterial.color 0xffffff = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_COLOR_SPAWN = 0xffffff;

/**
 * Color que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0xffffff).
 * syncLootFocus no escribe color (ctor constant).
 */
export function lootNameplateColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle 0xffffff).
 * WorldView nace SpriteMaterial.color AfterRestart; leftover mid-life no filtra.
 * syncLootFocus no escribe color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateColorAfterRestart(): number {
  return lootNameplateColorFromLook(LOOT_NAMEPLATE_COLOR_SPAWN);
}

/** renderOrder del nameplate sprite. Ctor sprite.renderOrder 9 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_RENDER_ORDER = 9;

/** Idle nameplate sprite renderOrder. Ctor sprite.renderOrder 9 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_RENDER_ORDER_SPAWN = 9;

/**
 * renderOrder que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 9).
 * syncLootFocus no escribe renderOrder (ctor constant).
 */
export function lootNameplateRenderOrderFromLook(renderOrder: number): number {
  return renderOrder;
}

/**
 * R / softReset: renderOrder fresco (idle 9).
 * WorldView nace sprite.renderOrder AfterRestart; leftover mid-life no filtra.
 * syncLootFocus no escribe renderOrder (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateRenderOrderAfterRestart(): number {
  return lootNameplateRenderOrderFromLook(LOOT_NAMEPLATE_RENDER_ORDER_SPAWN);
}

/** Side del nameplate sprite. Ctor SpriteMaterial.side THREE.FrontSide (0) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_SIDE = 0;

/** Idle nameplate sprite side. Ctor SpriteMaterial.side THREE.FrontSide (0) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_SIDE_SPAWN = 0;

/**
 * Side que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.FrontSide / 0).
 * syncLootFocus / applyLootNameplateLook no escriben side (ctor constant).
 */
export function lootNameplateSideFromLook(side: number): number {
  return side;
}

/**
 * R / softReset: side fresco (idle THREE.FrontSide / 0).
 * WorldView nace SpriteMaterial.side AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben side (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateSideAfterRestart(): number {
  return lootNameplateSideFromLook(LOOT_NAMEPLATE_SIDE_SPAWN);
}

/** SizeAttenuation del nameplate sprite. Ctor SpriteMaterial.sizeAttenuation true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_SIZE_ATTENUATION = true;

/** Idle nameplate sprite sizeAttenuation. Ctor SpriteMaterial.sizeAttenuation true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_SIZE_ATTENUATION_SPAWN = true;

/**
 * SizeAttenuation que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * syncLootFocus / applyLootNameplateLook no escriben sizeAttenuation (ctor constant).
 */
export function lootNameplateSizeAttenuationFromLook(
  sizeAttenuation: boolean,
): boolean {
  return sizeAttenuation;
}

/**
 * R / softReset: sizeAttenuation fresco (idle true).
 * WorldView nace SpriteMaterial.sizeAttenuation AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben sizeAttenuation (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateSizeAttenuationAfterRestart(): boolean {
  return lootNameplateSizeAttenuationFromLook(
    LOOT_NAMEPLATE_SIZE_ATTENUATION_SPAWN,
  );
}

/** Fog del nameplate sprite. Ctor SpriteMaterial.fog true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_FOG = true;

/** Idle nameplate sprite fog. Ctor SpriteMaterial.fog true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_FOG_SPAWN = true;

/**
 * Fog que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * syncLootFocus / applyLootNameplateLook no escriben fog (ctor constant).
 */
export function lootNameplateFogFromLook(fog: boolean): boolean {
  return fog;
}

/**
 * R / softReset: fog fresco (idle true).
 * WorldView nace SpriteMaterial.fog AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben fog (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateFogAfterRestart(): boolean {
  return lootNameplateFogFromLook(LOOT_NAMEPLATE_FOG_SPAWN);
}

/** Rotation del nameplate sprite. Ctor SpriteMaterial.rotation 0 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_ROTATION = 0;

/** Idle nameplate sprite rotation. Ctor SpriteMaterial.rotation 0 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_ROTATION_SPAWN = 0;

/**
 * Rotation que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * syncLootFocus / applyLootNameplateLook no escriben rotation (ctor constant).
 */
export function lootNameplateRotationFromLook(rotation: number): number {
  return rotation;
}

/**
 * R / softReset: rotation fresco (idle 0).
 * WorldView nace SpriteMaterial.rotation AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben rotation (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateRotationAfterRestart(): number {
  return lootNameplateRotationFromLook(LOOT_NAMEPLATE_ROTATION_SPAWN);
}

/** DepthTest del nameplate sprite. Ctor SpriteMaterial.depthTest true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_DEPTH_TEST = true;

/** Idle nameplate sprite depthTest. Ctor SpriteMaterial.depthTest true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_DEPTH_TEST_SPAWN = true;

/**
 * DepthTest que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * syncLootFocus / applyLootNameplateLook no escriben depthTest (ctor constant).
 */
export function lootNameplateDepthTestFromLook(depthTest: boolean): boolean {
  return depthTest;
}

/**
 * R / softReset: depthTest fresco (idle true).
 * WorldView nace SpriteMaterial.depthTest AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben depthTest (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateDepthTestAfterRestart(): boolean {
  return lootNameplateDepthTestFromLook(LOOT_NAMEPLATE_DEPTH_TEST_SPAWN);
}

/** ColorWrite del nameplate sprite. Ctor SpriteMaterial.colorWrite true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_COLOR_WRITE = true;

/** Idle nameplate sprite colorWrite. Ctor SpriteMaterial.colorWrite true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_COLOR_WRITE_SPAWN = true;

/**
 * ColorWrite que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * syncLootFocus / applyLootNameplateLook no escriben colorWrite (ctor constant).
 */
export function lootNameplateColorWriteFromLook(colorWrite: boolean): boolean {
  return colorWrite;
}

/**
 * R / softReset: colorWrite fresco (idle true).
 * WorldView nace SpriteMaterial.colorWrite AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben colorWrite (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateColorWriteAfterRestart(): boolean {
  return lootNameplateColorWriteFromLook(LOOT_NAMEPLATE_COLOR_WRITE_SPAWN);
}

/** Dithering del nameplate sprite. Ctor SpriteMaterial.dithering false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_DITHERING = false;

/** Idle nameplate sprite dithering. Ctor SpriteMaterial.dithering false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_DITHERING_SPAWN = false;

/**
 * Dithering que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * syncLootFocus / applyLootNameplateLook no escriben dithering (ctor constant).
 */
export function lootNameplateDitheringFromLook(dithering: boolean): boolean {
  return dithering;
}

/**
 * R / softReset: dithering fresco (idle false).
 * WorldView nace SpriteMaterial.dithering AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben dithering (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateDitheringAfterRestart(): boolean {
  return lootNameplateDitheringFromLook(LOOT_NAMEPLATE_DITHERING_SPAWN);
}

/** PremultipliedAlpha del nameplate sprite. Ctor SpriteMaterial.premultipliedAlpha false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_PREMULTIPLIED_ALPHA = false;

/** Idle nameplate sprite premultipliedAlpha. Ctor SpriteMaterial.premultipliedAlpha false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_PREMULTIPLIED_ALPHA_SPAWN = false;

/**
 * PremultipliedAlpha que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * syncLootFocus / applyLootNameplateLook no escriben premultipliedAlpha (ctor constant).
 */
export function lootNameplatePremultipliedAlphaFromLook(premultipliedAlpha: boolean): boolean {
  return premultipliedAlpha;
}

/**
 * R / softReset: premultipliedAlpha fresco (idle false).
 * WorldView nace SpriteMaterial.premultipliedAlpha AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben premultipliedAlpha (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplatePremultipliedAlphaAfterRestart(): boolean {
  return lootNameplatePremultipliedAlphaFromLook(LOOT_NAMEPLATE_PREMULTIPLIED_ALPHA_SPAWN);
}

/** ToneMapped del nameplate sprite. Ctor SpriteMaterial.toneMapped true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_TONE_MAPPED = true;

/** Idle nameplate sprite toneMapped. Ctor SpriteMaterial.toneMapped true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_TONE_MAPPED_SPAWN = true;

/**
 * ToneMapped que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * syncLootFocus / applyLootNameplateLook no escriben toneMapped (ctor constant).
 */
export function lootNameplateToneMappedFromLook(toneMapped: boolean): boolean {
  return toneMapped;
}

/**
 * R / softReset: toneMapped fresco (idle true).
 * WorldView nace SpriteMaterial.toneMapped AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben toneMapped (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateToneMappedAfterRestart(): boolean {
  return lootNameplateToneMappedFromLook(LOOT_NAMEPLATE_TONE_MAPPED_SPAWN);
}

/** VertexColors del nameplate sprite. Ctor SpriteMaterial.vertexColors false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_VERTEX_COLORS = false;

/** Idle nameplate sprite vertexColors. Ctor SpriteMaterial.vertexColors false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_VERTEX_COLORS_SPAWN = false;

/**
 * VertexColors que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * syncLootFocus / applyLootNameplateLook no escriben vertexColors (ctor constant).
 */
export function lootNameplateVertexColorsFromLook(vertexColors: boolean): boolean {
  return vertexColors;
}

/**
 * R / softReset: vertexColors fresco (idle false).
 * WorldView nace SpriteMaterial.vertexColors AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben vertexColors (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateVertexColorsAfterRestart(): boolean {
  return lootNameplateVertexColorsFromLook(LOOT_NAMEPLATE_VERTEX_COLORS_SPAWN);
}

/** AlphaTest del nameplate sprite. Ctor SpriteMaterial.alphaTest 0 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_ALPHA_TEST = 0;

/** Idle nameplate sprite alphaTest. Ctor SpriteMaterial.alphaTest 0 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_ALPHA_TEST_SPAWN = 0;

/**
 * AlphaTest que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * syncLootFocus / applyLootNameplateLook no escriben alphaTest (ctor constant).
 */
export function lootNameplateAlphaTestFromLook(alphaTest: number): number {
  return alphaTest;
}

/**
 * R / softReset: alphaTest fresco (idle 0).
 * WorldView nace SpriteMaterial.alphaTest AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben alphaTest (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateAlphaTestAfterRestart(): number {
  return lootNameplateAlphaTestFromLook(LOOT_NAMEPLATE_ALPHA_TEST_SPAWN);
}

/** AlphaHash del nameplate sprite. Ctor SpriteMaterial.alphaHash false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_ALPHA_HASH = false;

/** Idle nameplate sprite alphaHash. Ctor SpriteMaterial.alphaHash false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_ALPHA_HASH_SPAWN = false;

/**
 * AlphaHash que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * syncLootFocus / applyLootNameplateLook no escriben alphaHash (ctor constant).
 */
export function lootNameplateAlphaHashFromLook(alphaHash: boolean): boolean {
  return alphaHash;
}

/**
 * R / softReset: alphaHash fresco (idle false).
 * WorldView nace SpriteMaterial.alphaHash AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben alphaHash (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateAlphaHashAfterRestart(): boolean {
  return lootNameplateAlphaHashFromLook(LOOT_NAMEPLATE_ALPHA_HASH_SPAWN);
}

/** AlphaToCoverage del nameplate sprite. Ctor SpriteMaterial.alphaToCoverage false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_ALPHA_TO_COVERAGE = false;

/** Idle nameplate sprite alphaToCoverage. Ctor SpriteMaterial.alphaToCoverage false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_ALPHA_TO_COVERAGE_SPAWN = false;

/**
 * AlphaToCoverage que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * syncLootFocus / applyLootNameplateLook no escriben alphaToCoverage (ctor constant).
 */
export function lootNameplateAlphaToCoverageFromLook(alphaToCoverage: boolean): boolean {
  return alphaToCoverage;
}

/**
 * R / softReset: alphaToCoverage fresco (idle false).
 * WorldView nace SpriteMaterial.alphaToCoverage AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben alphaToCoverage (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateAlphaToCoverageAfterRestart(): boolean {
  return lootNameplateAlphaToCoverageFromLook(LOOT_NAMEPLATE_ALPHA_TO_COVERAGE_SPAWN);
}

/** ForceSinglePass del nameplate sprite. Ctor SpriteMaterial.forceSinglePass false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_FORCE_SINGLE_PASS = false;

/** Idle nameplate sprite forceSinglePass. Ctor SpriteMaterial.forceSinglePass false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_FORCE_SINGLE_PASS_SPAWN = false;

/**
 * ForceSinglePass que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * syncLootFocus / applyLootNameplateLook no escriben forceSinglePass (ctor constant).
 */
export function lootNameplateForceSinglePassFromLook(forceSinglePass: boolean): boolean {
  return forceSinglePass;
}

/**
 * R / softReset: forceSinglePass fresco (idle false).
 * WorldView nace SpriteMaterial.forceSinglePass AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben forceSinglePass (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateForceSinglePassAfterRestart(): boolean {
  return lootNameplateForceSinglePassFromLook(LOOT_NAMEPLATE_FORCE_SINGLE_PASS_SPAWN);
}

/** Blending del nameplate sprite. Ctor SpriteMaterial.blending THREE.NormalBlending (1) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLENDING = THREE.NormalBlending;

/** Idle nameplate sprite blending. Ctor SpriteMaterial.blending THREE.NormalBlending (1) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLENDING_SPAWN = THREE.NormalBlending;

/**
 * Blending que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.NormalBlending / 1).
 * syncLootFocus / applyLootNameplateLook no escriben blending (ctor constant).
 */
export function lootNameplateBlendingFromLook(blending: number): number {
  return blending;
}

/**
 * R / softReset: blending fresco (idle THREE.NormalBlending / 1).
 * WorldView nace SpriteMaterial.blending AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben blending (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateBlendingAfterRestart(): number {
  return lootNameplateBlendingFromLook(LOOT_NAMEPLATE_BLENDING_SPAWN);
}

/** BlendSrc del nameplate sprite. Ctor SpriteMaterial.blendSrc THREE.SrcAlphaFactor (204) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_SRC = THREE.SrcAlphaFactor;

/** Idle nameplate sprite blendSrc. Ctor SpriteMaterial.blendSrc THREE.SrcAlphaFactor (204) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_SRC_SPAWN = THREE.SrcAlphaFactor;

/**
 * BlendSrc que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.SrcAlphaFactor / 204).
 * syncLootFocus / applyLootNameplateLook no escriben blendSrc (ctor constant).
 */
export function lootNameplateBlendSrcFromLook(blendSrc: number): number {
  return blendSrc;
}

/**
 * R / softReset: blendSrc fresco (idle THREE.SrcAlphaFactor / 204).
 * WorldView nace SpriteMaterial.blendSrc AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben blendSrc (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateBlendSrcAfterRestart(): number {
  return lootNameplateBlendSrcFromLook(LOOT_NAMEPLATE_BLEND_SRC_SPAWN);
}

/** BlendDst del nameplate sprite. Ctor SpriteMaterial.blendDst THREE.OneMinusSrcAlphaFactor (205) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_DST = THREE.OneMinusSrcAlphaFactor;

/** Idle nameplate sprite blendDst. Ctor SpriteMaterial.blendDst THREE.OneMinusSrcAlphaFactor (205) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_DST_SPAWN = THREE.OneMinusSrcAlphaFactor;

/**
 * BlendDst que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.OneMinusSrcAlphaFactor / 205).
 * syncLootFocus / applyLootNameplateLook no escriben blendDst (ctor constant).
 */
export function lootNameplateBlendDstFromLook(blendDst: number): number {
  return blendDst;
}

/**
 * R / softReset: blendDst fresco (idle THREE.OneMinusSrcAlphaFactor / 205).
 * WorldView nace SpriteMaterial.blendDst AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben blendDst (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateBlendDstAfterRestart(): number {
  return lootNameplateBlendDstFromLook(LOOT_NAMEPLATE_BLEND_DST_SPAWN);
}

/** BlendEquation del nameplate sprite. Ctor SpriteMaterial.blendEquation THREE.AddEquation (100) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_EQUATION = THREE.AddEquation;

/** Idle nameplate sprite blendEquation. Ctor SpriteMaterial.blendEquation THREE.AddEquation (100) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_EQUATION_SPAWN = THREE.AddEquation;

/**
 * BlendEquation que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.AddEquation / 100).
 * syncLootFocus / applyLootNameplateLook no escriben blendEquation (ctor constant).
 */
export function lootNameplateBlendEquationFromLook(blendEquation: number): number {
  return blendEquation;
}

/**
 * R / softReset: blendEquation fresco (idle THREE.AddEquation / 100).
 * WorldView nace SpriteMaterial.blendEquation AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben blendEquation (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateBlendEquationAfterRestart(): number {
  return lootNameplateBlendEquationFromLook(LOOT_NAMEPLATE_BLEND_EQUATION_SPAWN);
}

/** BlendSrcAlpha del nameplate sprite. Ctor SpriteMaterial.blendSrcAlpha null = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_SRC_ALPHA = null;

/** Idle nameplate sprite blendSrcAlpha. Ctor SpriteMaterial.blendSrcAlpha null = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_SRC_ALPHA_SPAWN = null;

/**
 * BlendSrcAlpha que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle null).
 * syncLootFocus / applyLootNameplateLook no escriben blendSrcAlpha (ctor constant).
 */
export function lootNameplateBlendSrcAlphaFromLook(
  blendSrcAlpha: number | null,
): number | null {
  return blendSrcAlpha;
}

/**
 * R / softReset: blendSrcAlpha fresco (idle null).
 * WorldView nace SpriteMaterial.blendSrcAlpha AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben blendSrcAlpha (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateBlendSrcAlphaAfterRestart(): number | null {
  return lootNameplateBlendSrcAlphaFromLook(LOOT_NAMEPLATE_BLEND_SRC_ALPHA_SPAWN);
}

/** BlendDstAlpha del nameplate sprite. Ctor SpriteMaterial.blendDstAlpha null = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_DST_ALPHA = null;

/** Idle nameplate sprite blendDstAlpha. Ctor SpriteMaterial.blendDstAlpha null = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_DST_ALPHA_SPAWN = null;

/**
 * BlendDstAlpha que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle null).
 * syncLootFocus / applyLootNameplateLook no escriben blendDstAlpha (ctor constant).
 */
export function lootNameplateBlendDstAlphaFromLook(
  blendDstAlpha: number | null,
): number | null {
  return blendDstAlpha;
}

/**
 * R / softReset: blendDstAlpha fresco (idle null).
 * WorldView nace SpriteMaterial.blendDstAlpha AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben blendDstAlpha (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateBlendDstAlphaAfterRestart(): number | null {
  return lootNameplateBlendDstAlphaFromLook(LOOT_NAMEPLATE_BLEND_DST_ALPHA_SPAWN);
}

/** BlendEquationAlpha del nameplate sprite. Ctor SpriteMaterial.blendEquationAlpha null = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_EQUATION_ALPHA = null;

/** Idle nameplate sprite blendEquationAlpha. Ctor SpriteMaterial.blendEquationAlpha null = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_EQUATION_ALPHA_SPAWN = null;

/**
 * BlendEquationAlpha que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle null).
 * syncLootFocus / applyLootNameplateLook no escriben blendEquationAlpha (ctor constant).
 */
export function lootNameplateBlendEquationAlphaFromLook(
  blendEquationAlpha: number | null,
): number | null {
  return blendEquationAlpha;
}

/**
 * R / softReset: blendEquationAlpha fresco (idle null).
 * WorldView nace SpriteMaterial.blendEquationAlpha AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben blendEquationAlpha (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateBlendEquationAlphaAfterRestart(): number | null {
  return lootNameplateBlendEquationAlphaFromLook(LOOT_NAMEPLATE_BLEND_EQUATION_ALPHA_SPAWN);
}

/** BlendColor del nameplate sprite. Ctor SpriteMaterial.blendColor 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_COLOR = 0x000000;

/** Idle nameplate sprite blendColor. Ctor SpriteMaterial.blendColor 0x000000 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_COLOR_SPAWN = 0x000000;

/**
 * BlendColor que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0x000000).
 * syncLootFocus / applyLootNameplateLook no escriben blendColor (ctor constant).
 */
export function lootNameplateBlendColorFromLook(blendColor: number): number {
  return blendColor;
}

/**
 * R / softReset: blendColor fresco (idle 0x000000).
 * WorldView nace SpriteMaterial.blendColor AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben blendColor (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateBlendColorAfterRestart(): number {
  return lootNameplateBlendColorFromLook(LOOT_NAMEPLATE_BLEND_COLOR_SPAWN);
}

/** BlendAlpha del nameplate sprite. Ctor SpriteMaterial.blendAlpha 0 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_ALPHA = 0;

/** Idle nameplate sprite blendAlpha. Ctor SpriteMaterial.blendAlpha 0 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_BLEND_ALPHA_SPAWN = 0;

/**
 * BlendAlpha que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * syncLootFocus / applyLootNameplateLook no escriben blendAlpha (ctor constant).
 */
export function lootNameplateBlendAlphaFromLook(blendAlpha: number): number {
  return blendAlpha;
}

/**
 * R / softReset: blendAlpha fresco (idle 0).
 * WorldView nace SpriteMaterial.blendAlpha AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben blendAlpha (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateBlendAlphaAfterRestart(): number {
  return lootNameplateBlendAlphaFromLook(LOOT_NAMEPLATE_BLEND_ALPHA_SPAWN);
}

/** DepthFunc del nameplate sprite. Ctor SpriteMaterial.depthFunc THREE.LessEqualDepth (3) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_DEPTH_FUNC = THREE.LessEqualDepth;

/** Idle nameplate sprite depthFunc. Ctor SpriteMaterial.depthFunc THREE.LessEqualDepth (3) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_DEPTH_FUNC_SPAWN = THREE.LessEqualDepth;

/**
 * DepthFunc que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.LessEqualDepth / 3).
 * syncLootFocus / applyLootNameplateLook no escriben depthFunc (ctor constant).
 */
export function lootNameplateDepthFuncFromLook(depthFunc: number): number {
  return depthFunc;
}

/**
 * R / softReset: depthFunc fresco (idle THREE.LessEqualDepth / 3).
 * WorldView nace SpriteMaterial.depthFunc AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben depthFunc (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateDepthFuncAfterRestart(): number {
  return lootNameplateDepthFuncFromLook(LOOT_NAMEPLATE_DEPTH_FUNC_SPAWN);
}

/** StencilWrite del nameplate sprite. Ctor SpriteMaterial.stencilWrite false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_WRITE = false;

/** Idle nameplate sprite stencilWrite. Ctor SpriteMaterial.stencilWrite false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_WRITE_SPAWN = false;

/**
 * StencilWrite que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * syncLootFocus / applyLootNameplateLook no escriben stencilWrite (ctor constant).
 */
export function lootNameplateStencilWriteFromLook(stencilWrite: boolean): boolean {
  return stencilWrite;
}

/**
 * R / softReset: stencilWrite fresco (idle false).
 * WorldView nace SpriteMaterial.stencilWrite AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben stencilWrite (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateStencilWriteAfterRestart(): boolean {
  return lootNameplateStencilWriteFromLook(LOOT_NAMEPLATE_STENCIL_WRITE_SPAWN);
}

/** StencilFunc del nameplate sprite. Ctor SpriteMaterial.stencilFunc THREE.AlwaysStencilFunc (519) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_FUNC = THREE.AlwaysStencilFunc;

/** Idle nameplate sprite stencilFunc. Ctor SpriteMaterial.stencilFunc THREE.AlwaysStencilFunc (519) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_FUNC_SPAWN = THREE.AlwaysStencilFunc;

/**
 * StencilFunc que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.AlwaysStencilFunc / 519).
 * syncLootFocus / applyLootNameplateLook no escriben stencilFunc (ctor constant).
 */
export function lootNameplateStencilFuncFromLook(stencilFunc: number): number {
  return stencilFunc;
}

/**
 * R / softReset: stencilFunc fresco (idle THREE.AlwaysStencilFunc / 519).
 * WorldView nace SpriteMaterial.stencilFunc AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben stencilFunc (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateStencilFuncAfterRestart(): number {
  return lootNameplateStencilFuncFromLook(LOOT_NAMEPLATE_STENCIL_FUNC_SPAWN);
}

/** StencilRef del nameplate sprite. Ctor SpriteMaterial.stencilRef 0 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_REF = 0;

/** Idle nameplate sprite stencilRef. Ctor SpriteMaterial.stencilRef 0 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_REF_SPAWN = 0;

/**
 * StencilRef que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * syncLootFocus / applyLootNameplateLook no escriben stencilRef (ctor constant).
 */
export function lootNameplateStencilRefFromLook(stencilRef: number): number {
  return stencilRef;
}

/**
 * R / softReset: stencilRef fresco (idle 0).
 * WorldView nace SpriteMaterial.stencilRef AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben stencilRef (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateStencilRefAfterRestart(): number {
  return lootNameplateStencilRefFromLook(LOOT_NAMEPLATE_STENCIL_REF_SPAWN);
}

/** StencilWriteMask del nameplate sprite. Ctor SpriteMaterial.stencilWriteMask 0xff = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_WRITE_MASK = 0xff;

/** Idle nameplate sprite stencilWriteMask. Ctor SpriteMaterial.stencilWriteMask 0xff = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_WRITE_MASK_SPAWN = 0xff;

/**
 * StencilWriteMask que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0xff).
 * syncLootFocus / applyLootNameplateLook no escriben stencilWriteMask (ctor constant).
 */
export function lootNameplateStencilWriteMaskFromLook(stencilWriteMask: number): number {
  return stencilWriteMask;
}

/**
 * R / softReset: stencilWriteMask fresco (idle 0xff).
 * WorldView nace SpriteMaterial.stencilWriteMask AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben stencilWriteMask (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateStencilWriteMaskAfterRestart(): number {
  return lootNameplateStencilWriteMaskFromLook(LOOT_NAMEPLATE_STENCIL_WRITE_MASK_SPAWN);
}

/** StencilFuncMask del nameplate sprite. Ctor SpriteMaterial.stencilFuncMask 0xff = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_FUNC_MASK = 0xff;

/** Idle nameplate sprite stencilFuncMask. Ctor SpriteMaterial.stencilFuncMask 0xff = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_FUNC_MASK_SPAWN = 0xff;

/**
 * StencilFuncMask que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0xff).
 * syncLootFocus / applyLootNameplateLook no escriben stencilFuncMask (ctor constant).
 */
export function lootNameplateStencilFuncMaskFromLook(stencilFuncMask: number): number {
  return stencilFuncMask;
}

/**
 * R / softReset: stencilFuncMask fresco (idle 0xff).
 * WorldView nace SpriteMaterial.stencilFuncMask AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben stencilFuncMask (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateStencilFuncMaskAfterRestart(): number {
  return lootNameplateStencilFuncMaskFromLook(LOOT_NAMEPLATE_STENCIL_FUNC_MASK_SPAWN);
}

/** StencilFail del nameplate sprite. Ctor SpriteMaterial.stencilFail THREE.KeepStencilOp (7680) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_FAIL = THREE.KeepStencilOp;

/** Idle nameplate sprite stencilFail. Ctor SpriteMaterial.stencilFail THREE.KeepStencilOp (7680) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_FAIL_SPAWN = THREE.KeepStencilOp;

/**
 * StencilFail que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.KeepStencilOp / 7680).
 * syncLootFocus / applyLootNameplateLook no escriben stencilFail (ctor constant).
 */
export function lootNameplateStencilFailFromLook(stencilFail: number): number {
  return stencilFail;
}

/**
 * R / softReset: stencilFail fresco (idle THREE.KeepStencilOp / 7680).
 * WorldView nace SpriteMaterial.stencilFail AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben stencilFail (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateStencilFailAfterRestart(): number {
  return lootNameplateStencilFailFromLook(LOOT_NAMEPLATE_STENCIL_FAIL_SPAWN);
}

/** StencilZFail del nameplate sprite. Ctor SpriteMaterial.stencilZFail THREE.KeepStencilOp (7680) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_Z_FAIL = THREE.KeepStencilOp;

/** Idle nameplate sprite stencilZFail. Ctor SpriteMaterial.stencilZFail THREE.KeepStencilOp (7680) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_Z_FAIL_SPAWN = THREE.KeepStencilOp;

/**
 * StencilZFail que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.KeepStencilOp / 7680).
 * syncLootFocus / applyLootNameplateLook no escriben stencilZFail (ctor constant).
 */
export function lootNameplateStencilZFailFromLook(stencilZFail: number): number {
  return stencilZFail;
}

/**
 * R / softReset: stencilZFail fresco (idle THREE.KeepStencilOp / 7680).
 * WorldView nace SpriteMaterial.stencilZFail AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben stencilZFail (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateStencilZFailAfterRestart(): number {
  return lootNameplateStencilZFailFromLook(LOOT_NAMEPLATE_STENCIL_Z_FAIL_SPAWN);
}

/** StencilZPass del nameplate sprite. Ctor SpriteMaterial.stencilZPass THREE.KeepStencilOp (7680) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_Z_PASS = THREE.KeepStencilOp;

/** Idle nameplate sprite stencilZPass. Ctor SpriteMaterial.stencilZPass THREE.KeepStencilOp (7680) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_Z_PASS_SPAWN = THREE.KeepStencilOp;

/**
 * StencilZPass que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.KeepStencilOp / 7680).
 * syncLootFocus / applyLootNameplateLook no escriben stencilZPass (ctor constant).
 */
export function lootNameplateStencilZPassFromLook(stencilZPass: number): number {
  return stencilZPass;
}

/**
 * R / softReset: stencilZPass fresco (idle THREE.KeepStencilOp / 7680).
 * WorldView nace SpriteMaterial.stencilZPass AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben stencilZPass (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateStencilZPassAfterRestart(): number {
  return lootNameplateStencilZPassFromLook(LOOT_NAMEPLATE_STENCIL_Z_PASS_SPAWN);
}

/** StencilPass del nameplate sprite. Ctor SpriteMaterial.stencilPass THREE.KeepStencilOp (7680) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_PASS = THREE.KeepStencilOp;

/** Idle nameplate sprite stencilPass. Ctor SpriteMaterial.stencilPass THREE.KeepStencilOp (7680) = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_STENCIL_PASS_SPAWN = THREE.KeepStencilOp;

/**
 * StencilPass que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle THREE.KeepStencilOp / 7680).
 * syncLootFocus / applyLootNameplateLook no escriben stencilPass (ctor constant).
 */
export function lootNameplateStencilPassFromLook(stencilPass: number): number {
  return stencilPass;
}

/**
 * R / softReset: stencilPass fresco (idle THREE.KeepStencilOp / 7680).
 * WorldView nace SpriteMaterial.stencilPass AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben stencilPass (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateStencilPassAfterRestart(): number {
  return lootNameplateStencilPassFromLook(LOOT_NAMEPLATE_STENCIL_PASS_SPAWN);
}

/** ClipIntersection del nameplate sprite. Ctor SpriteMaterial.clipIntersection false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CLIP_INTERSECTION = false;

/** Idle nameplate sprite clipIntersection. Ctor SpriteMaterial.clipIntersection false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CLIP_INTERSECTION_SPAWN = false;

/**
 * ClipIntersection que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * syncLootFocus / applyLootNameplateLook no escriben clipIntersection (ctor constant).
 */
export function lootNameplateClipIntersectionFromLook(
  clipIntersection: boolean,
): boolean {
  return clipIntersection;
}

/**
 * R / softReset: clipIntersection fresco (idle false).
 * WorldView nace SpriteMaterial.clipIntersection AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben clipIntersection (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateClipIntersectionAfterRestart(): boolean {
  return lootNameplateClipIntersectionFromLook(
    LOOT_NAMEPLATE_CLIP_INTERSECTION_SPAWN,
  );
}

/** ClipShadows del nameplate sprite. Ctor SpriteMaterial.clipShadows false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CLIP_SHADOWS = false;

/** Idle nameplate sprite clipShadows. Ctor SpriteMaterial.clipShadows false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CLIP_SHADOWS_SPAWN = false;

/**
 * ClipShadows que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * syncLootFocus / applyLootNameplateLook no escriben clipShadows (ctor constant).
 */
export function lootNameplateClipShadowsFromLook(
  clipShadows: boolean,
): boolean {
  return clipShadows;
}

/**
 * R / softReset: clipShadows fresco (idle false).
 * WorldView nace SpriteMaterial.clipShadows AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben clipShadows (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateClipShadowsAfterRestart(): boolean {
  return lootNameplateClipShadowsFromLook(LOOT_NAMEPLATE_CLIP_SHADOWS_SPAWN);
}

/** ClippingPlanes del nameplate sprite. Ctor SpriteMaterial.clippingPlanes null = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CLIPPING_PLANES: THREE.Plane[] | null = null;

/** Idle nameplate sprite clippingPlanes. Ctor SpriteMaterial.clippingPlanes null = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CLIPPING_PLANES_SPAWN: THREE.Plane[] | null = null;

/**
 * ClippingPlanes que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle null).
 * syncLootFocus / applyLootNameplateLook no escriben clippingPlanes (ctor constant).
 */
export function lootNameplateClippingPlanesFromLook(
  clippingPlanes: THREE.Plane[] | null,
): THREE.Plane[] | null {
  return clippingPlanes;
}

/**
 * R / softReset: clippingPlanes fresco (idle null).
 * WorldView nace SpriteMaterial.clippingPlanes AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben clippingPlanes (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateClippingPlanesAfterRestart(): THREE.Plane[] | null {
  return lootNameplateClippingPlanesFromLook(
    LOOT_NAMEPLATE_CLIPPING_PLANES_SPAWN,
  );
}

/** Clipping del nameplate sprite. Ctor SpriteMaterial.clipping false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CLIPPING = false;

/** Idle nameplate sprite clipping. Ctor SpriteMaterial.clipping false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CLIPPING_SPAWN = false;

/**
 * Clipping que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * syncLootFocus / applyLootNameplateLook no escriben clipping (ctor constant).
 */
export function lootNameplateClippingFromLook(clipping: boolean): boolean {
  return clipping;
}

/**
 * R / softReset: clipping fresco (idle false).
 * WorldView nace SpriteMaterial.clipping AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben clipping (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateClippingAfterRestart(): boolean {
  return lootNameplateClippingFromLook(LOOT_NAMEPLATE_CLIPPING_SPAWN);
}

/** ShadowSide del nameplate sprite. Ctor SpriteMaterial.shadowSide null = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_SHADOW_SIDE: THREE.Side | null = null;

/** Idle nameplate sprite shadowSide. Ctor SpriteMaterial.shadowSide null = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_SHADOW_SIDE_SPAWN: THREE.Side | null = null;

/**
 * ShadowSide que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle null).
 * syncLootFocus / applyLootNameplateLook no escriben shadowSide (ctor constant).
 */
export function lootNameplateShadowSideFromLook(
  shadowSide: THREE.Side | null,
): THREE.Side | null {
  return shadowSide;
}

/**
 * R / softReset: shadowSide fresco (idle null).
 * WorldView nace SpriteMaterial.shadowSide AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben shadowSide (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateShadowSideAfterRestart(): THREE.Side | null {
  return lootNameplateShadowSideFromLook(LOOT_NAMEPLATE_SHADOW_SIDE_SPAWN);
}

/** AlphaMap del nameplate sprite. Ctor SpriteMaterial.alphaMap null = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_ALPHA_MAP: THREE.Texture | null = null;

/** Idle nameplate sprite alphaMap. Ctor SpriteMaterial.alphaMap null = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_ALPHA_MAP_SPAWN: THREE.Texture | null = null;

/**
 * AlphaMap que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle null).
 * syncLootFocus / applyLootNameplateLook no escriben alphaMap (ctor constant).
 */
export function lootNameplateAlphaMapFromLook(
  alphaMap: THREE.Texture | null,
): THREE.Texture | null {
  return alphaMap;
}

/**
 * R / softReset: alphaMap fresco (idle null).
 * WorldView nace SpriteMaterial.alphaMap AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben alphaMap (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateAlphaMapAfterRestart(): THREE.Texture | null {
  return lootNameplateAlphaMapFromLook(LOOT_NAMEPLATE_ALPHA_MAP_SPAWN);
}

/** Material.visible del nameplate sprite. Ctor SpriteMaterial.visible true = fresco. Mid-life leftover ≠ fresco. Object3D.visible es live write. */
export const LOOT_NAMEPLATE_MATERIAL_VISIBLE = true;

/** Idle nameplate sprite Material.visible. Ctor SpriteMaterial.visible true = fresco. Mid-life leftover ≠ fresco. Object3D.visible es live write. */
export const LOOT_NAMEPLATE_MATERIAL_VISIBLE_SPAWN = true;

/**
 * Material.visible que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * syncLootFocus / applyLootNameplateLook no escriben material.visible (ctor constant).
 * Object3D.visible (sprite.visible) es live write; no es este leftover.
 */
export function lootNameplateMaterialVisibleFromLook(visible: boolean): boolean {
  return visible;
}

/**
 * R / softReset: Material.visible fresco (idle true).
 * WorldView nace SpriteMaterial.visible AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben material.visible (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateMaterialVisibleAfterRestart(): boolean {
  return lootNameplateMaterialVisibleFromLook(LOOT_NAMEPLATE_MATERIAL_VISIBLE_SPAWN);
}

/** Material.name del nameplate sprite. Ctor SpriteMaterial.name '' = fresco. Mid-life leftover ≠ fresco. Object3D.name es otro campo. */
export const LOOT_NAMEPLATE_MATERIAL_NAME = "";

/** Idle nameplate sprite Material.name. Ctor SpriteMaterial.name '' = fresco. Mid-life leftover ≠ fresco. Object3D.name es otro campo. */
export const LOOT_NAMEPLATE_MATERIAL_NAME_SPAWN = "";

/**
 * Material.name que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle '').
 * syncLootFocus / applyLootNameplateLook no escriben material.name (ctor constant).
 * Object3D.name (sprite.name) es otro campo; no es este leftover.
 */
export function lootNameplateMaterialNameFromLook(name: string): string {
  return name;
}

/**
 * R / softReset: Material.name fresco (idle '').
 * WorldView nace SpriteMaterial.name AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben material.name (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateMaterialNameAfterRestart(): string {
  return lootNameplateMaterialNameFromLook(LOOT_NAMEPLATE_MATERIAL_NAME_SPAWN);
}

/** Material.userData del nameplate sprite. Ctor SpriteMaterial.userData {} = fresco. Mid-life leftover ≠ fresco. Object3D.userData es otro campo. */
export const LOOT_NAMEPLATE_MATERIAL_USER_DATA: Record<string, unknown> = {};

/** Idle nameplate sprite Material.userData. Ctor SpriteMaterial.userData {} = fresco. Mid-life leftover ≠ fresco. Object3D.userData es otro campo. */
export const LOOT_NAMEPLATE_MATERIAL_USER_DATA_SPAWN: Record<string, unknown> = {};

/**
 * Material.userData que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle {}).
 * syncLootFocus / applyLootNameplateLook no escriben material.userData (ctor constant).
 * Object3D.userData (sprite.userData) es otro campo; no es este leftover.
 */
export function lootNameplateMaterialUserDataFromLook(
  userData: Record<string, unknown>,
): Record<string, unknown> {
  return userData;
}

/**
 * R / softReset: Material.userData fresco (idle {}).
 * WorldView nace SpriteMaterial.userData AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben material.userData (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateMaterialUserDataAfterRestart(): Record<string, unknown> {
  return lootNameplateMaterialUserDataFromLook({
    ...LOOT_NAMEPLATE_MATERIAL_USER_DATA_SPAWN,
  });
}

/** Center X del nameplate sprite. Ctor SpriteMaterial.center.x 0.5 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CENTER_X = 0.5;

/** Center Y del nameplate sprite. Ctor SpriteMaterial.center.y 0.5 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CENTER_Y = 0.5;

/** Idle nameplate sprite center X. Ctor SpriteMaterial.center.x 0.5 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CENTER_SPAWN_X = 0.5;

/** Idle nameplate sprite center Y. Ctor SpriteMaterial.center.y 0.5 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CENTER_SPAWN_Y = 0.5;

/**
 * Center que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0.5, 0.5).
 * syncLootFocus / applyLootNameplateLook no escriben center (ctor constant).
 * No muta el leftover.
 */
export function lootNameplateCenterFromLook(center: THREE.Vector2): THREE.Vector2 {
  return center;
}

/**
 * R / softReset: center fresco (idle 0.5, 0.5).
 * WorldView nace SpriteMaterial.center AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben center (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateCenterAfterRestart(): THREE.Vector2 {
  return lootNameplateCenterFromLook(
    new THREE.Vector2(LOOT_NAMEPLATE_CENTER_SPAWN_X, LOOT_NAMEPLATE_CENTER_SPAWN_Y),
  );
}

/** AllowOverride del nameplate sprite. Ctor SpriteMaterial.allowOverride true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_ALLOW_OVERRIDE = true;

/** Idle nameplate sprite allowOverride. Ctor SpriteMaterial.allowOverride true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_ALLOW_OVERRIDE_SPAWN = true;

/**
 * AllowOverride que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * syncLootFocus / applyLootNameplateLook no escriben allowOverride (ctor constant).
 */
export function lootNameplateAllowOverrideFromLook(
  allowOverride: boolean,
): boolean {
  return allowOverride;
}

/**
 * R / softReset: allowOverride fresco (idle true).
 * WorldView nace SpriteMaterial.allowOverride AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben allowOverride (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateAllowOverrideAfterRestart(): boolean {
  return lootNameplateAllowOverrideFromLook(LOOT_NAMEPLATE_ALLOW_OVERRIDE_SPAWN);
}

/** frustumCulled del nameplate sprite. Ctor sprite.frustumCulled true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_FRUSTUM_CULLED = true;

/** Idle nameplate sprite frustumCulled. Ctor sprite.frustumCulled true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_FRUSTUM_CULLED_SPAWN = true;

/**
 * frustumCulled que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * syncLootFocus / applyLootNameplateLook no escriben frustumCulled (ctor constant).
 */
export function lootNameplateFrustumCulledFromLook(
  frustumCulled: boolean,
): boolean {
  return frustumCulled;
}

/**
 * R / softReset: frustumCulled fresco (idle true).
 * WorldView nace sprite.frustumCulled AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben frustumCulled (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateFrustumCulledAfterRestart(): boolean {
  return lootNameplateFrustumCulledFromLook(LOOT_NAMEPLATE_FRUSTUM_CULLED_SPAWN);
}

/** castShadow del nameplate sprite. Ctor sprite.castShadow false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CAST_SHADOW = false;

/** Idle nameplate sprite castShadow. Ctor sprite.castShadow false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_CAST_SHADOW_SPAWN = false;

/**
 * castShadow que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * syncLootFocus / applyLootNameplateLook no escriben castShadow (ctor constant).
 */
export function lootNameplateCastShadowFromLook(
  castShadow: boolean,
): boolean {
  return castShadow;
}

/**
 * R / softReset: castShadow fresco (idle false).
 * WorldView nace sprite.castShadow AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben castShadow (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateCastShadowAfterRestart(): boolean {
  return lootNameplateCastShadowFromLook(LOOT_NAMEPLATE_CAST_SHADOW_SPAWN);
}

/** receiveShadow del nameplate sprite. Ctor sprite.receiveShadow false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_RECEIVE_SHADOW = false;

/** Idle nameplate sprite receiveShadow. Ctor sprite.receiveShadow false = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_RECEIVE_SHADOW_SPAWN = false;

/**
 * receiveShadow que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle false).
 * syncLootFocus / applyLootNameplateLook no escriben receiveShadow (ctor constant).
 */
export function lootNameplateReceiveShadowFromLook(
  receiveShadow: boolean,
): boolean {
  return receiveShadow;
}

/**
 * R / softReset: receiveShadow fresco (idle false).
 * WorldView nace sprite.receiveShadow AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben receiveShadow (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateReceiveShadowAfterRestart(): boolean {
  return lootNameplateReceiveShadowFromLook(LOOT_NAMEPLATE_RECEIVE_SHADOW_SPAWN);
}

/** matrixAutoUpdate del nameplate sprite. Ctor sprite.matrixAutoUpdate true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_MATRIX_AUTO_UPDATE = true;

/** Idle nameplate sprite matrixAutoUpdate. Ctor sprite.matrixAutoUpdate true = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_MATRIX_AUTO_UPDATE_SPAWN = true;

/**
 * matrixAutoUpdate que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * syncLootFocus / applyLootNameplateLook no escriben matrixAutoUpdate (ctor constant).
 */
export function lootNameplateMatrixAutoUpdateFromLook(
  matrixAutoUpdate: boolean,
): boolean {
  return matrixAutoUpdate;
}

/**
 * R / softReset: matrixAutoUpdate fresco (idle true).
 * WorldView nace sprite.matrixAutoUpdate AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben matrixAutoUpdate (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateMatrixAutoUpdateAfterRestart(): boolean {
  return lootNameplateMatrixAutoUpdateFromLook(
    LOOT_NAMEPLATE_MATRIX_AUTO_UPDATE_SPAWN,
  );
}

/** layers.mask del nameplate sprite. Ctor sprite.layers.mask 1 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_LAYERS_MASK = 1;

/** Idle nameplate sprite layers.mask. Ctor sprite.layers.mask 1 = fresco. Mid-life leftover ≠ fresco. */
export const LOOT_NAMEPLATE_LAYERS_MASK_SPAWN = 1;

/**
 * layers.mask que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * syncLootFocus / applyLootNameplateLook no escriben layers.mask (ctor constant).
 */
export function lootNameplateLayersMaskFromLook(layersMask: number): number {
  return layersMask;
}

/**
 * R / softReset: layers.mask fresco (idle 1).
 * WorldView nace sprite.layers.mask AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben layers.mask (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateLayersMaskAfterRestart(): number {
  return lootNameplateLayersMaskFromLook(LOOT_NAMEPLATE_LAYERS_MASK_SPAWN);
}

/** Object3D.userData del nameplate sprite. Ctor sprite.userData {} = fresco. Mid-life leftover ≠ fresco. Material.userData es otro campo. */
export const LOOT_NAMEPLATE_OBJECT_USER_DATA: Record<string, unknown> = {};

/** Idle nameplate sprite Object3D.userData. Ctor sprite.userData {} = fresco. Mid-life leftover ≠ fresco. Material.userData es otro campo. */
export const LOOT_NAMEPLATE_OBJECT_USER_DATA_SPAWN: Record<string, unknown> = {};

/**
 * Object3D.userData que leería syncLootFocus (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle {}).
 * syncLootFocus / applyLootNameplateLook no escriben sprite.userData (ctor constant).
 * Material.userData (SpriteMaterial.userData) es otro campo; no es este leftover.
 */
export function lootNameplateObjectUserDataFromLook(
  userData: Record<string, unknown>,
): Record<string, unknown> {
  return userData;
}

/**
 * R / softReset: Object3D.userData fresco (idle {}).
 * WorldView nace sprite.userData AfterRestart; leftover mid-life no filtra.
 * syncLootFocus / applyLootNameplateLook no escriben sprite.userData (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function lootNameplateObjectUserDataAfterRestart(): Record<string, unknown> {
  return lootNameplateObjectUserDataFromLook({
    ...LOOT_NAMEPLATE_OBJECT_USER_DATA_SPAWN,
  });
}

/**
 * True si no hay stacks o todos qty<=0.
 * null / undefined / slots vacíos / agujeros → true.
 */
export function lootNameplateInvEmpty(
  inv:
    | { slots: ReadonlyArray<{ id: string; qty: number } | null | undefined> }
    | null
    | undefined,
): boolean {
  const slots = inv?.slots;
  if (!Array.isArray(slots) || slots.length === 0) return true;
  for (const s of slots) {
    if (s && s.qty > 0) return false;
  }
  return true;
}

/** Primer stack con qty>0 e id string. Vacío / null / agujeros qty<=0 → null. */
export function lootNameplateLeadId(
  inv:
    | { slots: ReadonlyArray<{ id: string; qty: number } | null | undefined> }
    | null
    | undefined,
): string | null {
  const slots = inv?.slots;
  if (!Array.isArray(slots) || slots.length === 0) return null;
  for (const s of slots) {
    if (!s || !(s.qty > 0)) continue;
    if (typeof s.id !== "string" || s.id.length === 0) continue;
    return s.id;
  }
  return null;
}

export type LootNameplateIconKind =
  | "bottle"
  | "can"
  | "wood"
  | "ammo"
  | "pistol"
  | "flashlight"
  | "diamond";

/** Stroke gold de la silueta del icono. #e8c36a ×1.15 por canal (r clamp) para leer de noche. */
export const LOOT_NAMEPLATE_GOLD_STROKE = "#ffe07a";
/** Fill gold de la silueta del icono. 0.368 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_GOLD_FILL = "rgba(232,195,106,0.4232)";

/** Silueta gold del stack: botella / lata / madera / munición / pistola / linterna; resto diamante. */
export function lootNameplateIconKind(id: string): LootNameplateIconKind {
  switch (id) {
    case "water_bottle":
    case "empty_bottle":
      return "bottle";
    case "canned_food":
      return "can";
    case "wood":
      return "wood";
    case "ammo":
      return "ammo";
    case "pistol":
      return "pistol";
    case "flashlight":
      return "flashlight";
    default:
      return "diamond";
  }
}

/**
 * Dibuja la silueta gold en canvas 2d (coords 32×32, scale size/32, origin x,y).
 * Id desconocido → diamante. Nunca tira.
 */
export function paintLootNameplateIcon(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  size: number,
): void {
  try {
    const kind = lootNameplateIconKind(typeof id === "string" ? id : "");
    const s = Number.isFinite(size) && size > 0 ? size : 32;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 32, s / 32);
    ctx.strokeStyle = LOOT_NAMEPLATE_GOLD_STROKE;
    ctx.fillStyle = LOOT_NAMEPLATE_GOLD_FILL;
    ctx.lineWidth = LOOT_NAMEPLATE_ICON_STROKE;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    paintIconKind(ctx, kind);
    ctx.restore();
  } catch {
    // Headless / ctx incompleto: no romper el nameplate.
  }
}

function paintIconKind(
  ctx: CanvasRenderingContext2D,
  kind: LootNameplateIconKind,
): void {
  switch (kind) {
    case "bottle":
      fillStrokeRect(ctx, 13, 3, 6, 4);
      fillStrokeRect(ctx, 14, 7, 4, 5);
      fillStrokeRect(ctx, 10, 12, 12, 16);
      return;
    case "can":
      fillStrokeRect(ctx, 8, 8, 16, 16);
      strokeLine(ctx, 8, 14, 24, 14);
      return;
    case "wood":
      fillStrokeRect(ctx, 4, 8, 24, 5);
      fillStrokeRect(ctx, 4, 15, 24, 5);
      fillStrokeRect(ctx, 4, 22, 24, 5);
      return;
    case "ammo":
      fillStrokeRect(ctx, 5, 12, 22, 14);
      fillStrokeRect(ctx, 8, 6, 4, 8);
      fillStrokeRect(ctx, 14, 6, 4, 8);
      fillStrokeRect(ctx, 20, 6, 4, 8);
      return;
    case "pistol":
      fillStrokeRect(ctx, 4, 12, 20, 5);
      fillStrokeRect(ctx, 10, 17, 5, 10);
      return;
    case "flashlight":
      fillStrokeRect(ctx, 3, 12, 16, 8);
      fillStrokeRect(ctx, 19, 10, 4, 12);
      strokeLine(ctx, 24, 12, 29, 8);
      strokeLine(ctx, 24, 16, 30, 16);
      strokeLine(ctx, 24, 20, 29, 24);
      return;
    default:
      paintDiamond(ctx);
  }
}

function fillStrokeRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
}

function strokeLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function paintDiamond(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(16, 3.5);
  ctx.lineTo(28.5, 16);
  ctx.lineTo(16, 28.5);
  ctx.lineTo(3.5, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
