/**
 * Nameplate flotante del contenedor — headless.
 * worldView aplica label/opacity al Sprite canvas hijo del grupo loot.
 */

/** Máximo de caracteres del label. */
export const LOOT_NAMEPLATE_MAX_CHARS = 20;

/** Distancia a la que el nameplate llega a opacity 0. */
export const LOOT_NAMEPLATE_FADE_DIST = 10;

/** Altura local Y del sprite sobre el grupo loot. */
export const LOOT_NAMEPLATE_Y = 1.55;

/** Escala world del sprite (canvas 384×80). */
export const LOOT_NAMEPLATE_SCALE_X = 2.6;
export const LOOT_NAMEPLATE_SCALE_Y = 0.65;

/** Padding izquierdo del canvas para la silueta gold. */
export const LOOT_NAMEPLATE_ICON_PAD = 56;
/** Tamaño de la silueta gold en el atlas (px). */
export const LOOT_NAMEPLATE_ICON_SIZE = 52;

export function lootNameplateScale(): { x: number; y: number } {
  return { x: LOOT_NAMEPLATE_SCALE_X, y: LOOT_NAMEPLATE_SCALE_Y };
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
 * 1 en dist 0 · 0 en fade dist 10.
 * Lerp lineal. Fuera / no finito → 0. Dist negativa se clampa a 0.
 */
export function lootNameplateOpacity(dist: number): number {
  if (!Number.isFinite(dist)) return 0;
  if (dist >= LOOT_NAMEPLATE_FADE_DIST) return 0;
  const d = Math.max(0, dist);
  return 1 - d / LOOT_NAMEPLATE_FADE_DIST;
}

/**
 * Visible si opacity > 0 y el contenedor no está vacío.
 * dist >= 10 / no finito / empty → false.
 */
export function lootNameplateVisible(
  dist: number,
  empty = false,
): boolean {
  if (empty) return false;
  return lootNameplateOpacity(dist) > 0;
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

const GOLD_STROKE = "#e8c36a";
const GOLD_FILL = "rgba(232,195,106,0.32)";

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
    ctx.strokeStyle = GOLD_STROKE;
    ctx.fillStyle = GOLD_FILL;
    ctx.lineWidth = 1.5;
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
