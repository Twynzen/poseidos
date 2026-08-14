/**
 * Nameplate flotante del contenedor — headless.
 * worldView aplica label/opacity al Sprite canvas hijo del grupo loot.
 */

/** Máximo de caracteres del label. */
export const LOOT_NAMEPLATE_MAX_CHARS = 20;

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

/** Tamaño de fuente del label en el canvas. 34 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_FONT_PX = 39.1;

/** Grosor del stroke del label en el canvas. 4.5 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_STROKE_PX = 5.175;

/** Color del fill del label en el canvas. #f0c060 ×1.15 por canal (r clamp) para leer de noche. */
export const LOOT_NAMEPLATE_FILL = "#ffdd6e";

/** Fill del plate backdrop del nameplate. 0.72 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_PLATE_FILL = "rgba(15, 23, 42, 0.828)";

/** Stroke del label en el canvas. 0.7 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_TEXT_STROKE = "rgba(0,0,0,0.805)";

/** Grosor del stroke del icono gold. 1.5 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_ICON_STROKE = 1.725;

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

/** Corta el nombre a 20 chars (sin ellipsis). */
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
 * empty / dist >= 5.5 / no finito → false.
 * Firma igual que `lootRingVisible(empty, dist)`.
 */
export function lootNameplateVisible(empty: boolean, dist: number): boolean {
  if (empty) return false;
  return lootNameplateOpacity(dist) > 0;
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
/** Fill gold de la silueta del icono. 0.32 × 1.15 para leer de noche. */
export const LOOT_NAMEPLATE_GOLD_FILL = "rgba(232,195,106,0.368)";

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
