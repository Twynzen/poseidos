/**
 * Nameplate flotante del contenedor — headless.
 * worldView aplica label/opacity al Sprite canvas hijo del grupo loot.
 */

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
