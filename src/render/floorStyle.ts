/**
 * Estilo de suelo outdoor: tint seeded (pasto estilizado barato) + fake AO.
 * Headless — sin Three. worldView aplica el color a materiales de floor.
 * Ideas: three-stylized (variación determinista) + little-landscapes (AO bake barato).
 */

import type { TileKind } from "../world/tile";
import { INDOOR_SOLID_THRESHOLD } from "../world/indoor";

/** Piso indoor / base gris frío (histórico FLOOR_COLOR). */
export const INDOOR_FLOOR_COLOR = 0x303540;

/** Base de pasto outdoor (verde-gris apagado, legible en iso). */
export const OUTDOOR_GRASS_BASE = 0x465b3d;

/** Muro / bloque de edificio (histórico WALL_COLOR en worldView). */
export const WALL_COLOR = 0x685f53;

/** Base bajo el muro (suelo del tile wall). */
export const WALL_BASE_COLOR = 0x1e2027;

/** Puerta cerrada (histórico DOOR_CLOSED en worldView). */
export const DOOR_CLOSED = 0xa06831;

/** Puerta abierta (histórico DOOR_OPEN en worldView). */
export const DOOR_OPEN = 0xe1bb68;

/** Mueble / crate genérico (histórico FURNITURE_COLOR en worldView). */
export const FURNITURE_COLOR = 0x6b4f2a;

/** Cama (histórico BED_COLOR en worldView). */
export const BED_COLOR = 0x4a1f3d;

/** Barricada: madera clara (histórico BARRICADE_COLOR en worldView). */
export const BARRICADE_COLOR = 0xc49a6c;

/** Cruz de barricada (histórico BARRICADE_EDGE en worldView). */
export const BARRICADE_EDGE = 0x8a6239;

/**
 * Multiply de albedo de suelo de noche (día = 1). 1.45 × 1.15 para leer el suelo de noche.
 * Paleta day queda igual; de noche el pasto se lee sin irse a negro/gris.
 */
export const GROUND_NIGHT_LIFT = 1.6675;

/** Máximo oscurecimiento por fake AO (fracción RGB). 0.3 × 0.87 para leer el suelo de noche. */
export const AO_MAX_DARKEN = 0.261;

/** Umbral de sólidos cercanos para tratar un floor como outdoor (misma idea que indoor). */
export const OUTDOOR_SOLID_THRESHOLD = INDOOR_SOLID_THRESHOLD;

/**
 * Hash determinista tile → [0, 1).
 * Estable entre sesiones; no depende de Math.random.
 */
export function tileSeed01(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return (h % 10000) / 10000;
}

/** ¿Este kind proyecta AO de contacto sobre el floor vecino? */
export function isAoOccluder(kind: TileKind | undefined): boolean {
  return kind === "wall" || kind === "furniture" || kind === "barricade";
}

/**
 * Outdoor floor si hay pocos sólidos en vecindario (calle / patio).
 * `solidNearby` = walls+furniture+barricade en radio Chebyshev (como isIndoor).
 */
export function floorIsOutdoor(solidNearby: number): boolean {
  return solidNearby < OUTDOOR_SOLID_THRESHOLD;
}

/**
 * Tint de suelo: indoor = gris fijo; outdoor = verdes/grises seeded por tile.
 */
export function tintFromTile(x: number, y: number, outdoor: boolean): number {
  if (!outdoor) return INDOOR_FLOOR_COLOR;
  const t = tileSeed01(x, y);
  // Paleta corta de pasto estilizado (R,G,B 0..255)
  const palettes: ReadonlyArray<readonly [number, number, number]> = [
    [
      (OUTDOOR_GRASS_BASE >> 16) & 0xff,
      (OUTDOOR_GRASS_BASE >> 8) & 0xff,
      OUTDOOR_GRASS_BASE & 0xff,
    ], // verde musgo
    [0x45, 0x58, 0x38], // verde medio
    [0x34, 0x42, 0x2e], // verde oscuro
    [0x4a, 0x52, 0x3a], // verde-gris
    [0x3e, 0x4a, 0x36], // gris verdoso
    [0x52, 0x5a, 0x40], // seco / rastrojo
    [0x2e, 0x3c, 0x2a], // sombra natural
    [0x48, 0x5e, 0x3c], // verde vivo suave
  ];
  const idx = Math.min(palettes.length - 1, Math.floor(t * palettes.length));
  const [r0, g0, b0] = palettes[idx]!;
  // Micro-jitter (±6) con el mismo seed invertido — sigue determinista
  const j = tileSeed01(y, x);
  const dr = Math.floor((j - 0.5) * 12);
  const dg = Math.floor((t - 0.5) * 10);
  const db = Math.floor((j * t - 0.25) * 8);
  const r = clampByte(r0 + dr);
  const g = clampByte(g0 + dg);
  const b = clampByte(b0 + db);
  return (r << 16) | (g << 8) | b;
}

/**
 * Fake AO [0,1] a partir de vecinos oclusores.
 * Ortho pesan 1; diagonales 0.5. Se satura ~4 ortho.
 */
export function aoFactor(orthoOccluders: number, diagOccluders = 0): number {
  const o = Math.max(0, orthoOccluders);
  const d = Math.max(0, diagOccluders);
  const raw = o + d * 0.5;
  return Math.min(1, raw / 4);
}

/**
 * Cuenta oclusores en anillo 8 alrededor de (x,y).
 * `getKind` puede devolver undefined fuera de mapa.
 */
export function countAoNeighbors(
  getKind: (nx: number, ny: number) => TileKind | undefined,
  x: number,
  y: number,
): { ortho: number; diag: number } {
  let ortho = 0;
  let diag = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (!isAoOccluder(getKind(x + dx, y + dy))) continue;
      if (dx === 0 || dy === 0) ortho++;
      else diag++;
    }
  }
  return { ortho, diag };
}

/** Oscurece un color hex según ao ∈ [0,1]. */
export function applyAo(color: number, ao: number): number {
  const a = Math.max(0, Math.min(1, ao));
  if (a <= 0) return color & 0xffffff;
  const factor = 1 - a * AO_MAX_DARKEN;
  const r = Math.round(((color >> 16) & 0xff) * factor);
  const g = Math.round(((color >> 8) & 0xff) * factor);
  const b = Math.round((color & 0xff) * factor);
  return (clampByte(r) << 16) | (clampByte(g) << 8) | clampByte(b);
}

/** Multiply de albedo: noche `GROUND_NIGHT_LIFT`; noon 1. */
export function nightGroundLift(daylight: number): number {
  const n = 1 - clamp01(daylight);
  return 1 + (GROUND_NIGHT_LIFT - 1) * n;
}

/**
 * Aplica el lift de noche a un hex (suelo, muro o props).
 * Día (d=1) = color intacto; noche aclara el albedo.
 */
export function applyNightGroundLift(color: number, daylight: number): number {
  const lift = nightGroundLift(daylight);
  if (lift === 1) return color & 0xffffff;
  const r = clampByte(Math.round(((color >> 16) & 0xff) * lift));
  const g = clampByte(Math.round(((color >> 8) & 0xff) * lift));
  const b = clampByte(Math.round((color & 0xff) * lift));
  return (r << 16) | (g << 8) | b;
}

/**
 * Color final de un tile floor (tint + AO) listo para MeshStandardMaterial.
 */
export function floorColorAt(
  x: number,
  y: number,
  outdoor: boolean,
  orthoOccluders: number,
  diagOccluders = 0,
): number {
  const tint = tintFromTile(x, y, outdoor);
  return applyAo(tint, aoFactor(orthoOccluders, diagOccluders));
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, n | 0));
}
