/**
 * Heurística indoor/outdoor (headless).
 * Indoor ≈ cerca de walls/furniture o de pie en furniture;
 * outdoor = calle abierta con pocos muros cercanos.
 */

import { clockAfterRestart } from "../core/clock";
import type { TileMap } from "./tilemap";

/** Radio Chebyshev para muestrear vecindario. */
export const INDOOR_RADIUS = 2;

/** Mínimo de tiles wall/furniture en radio para considerar indoor. */
export const INDOOR_SOLID_THRESHOLD = 3;

export interface WarmLightAnchor {
  x: number;
  y: number;
  /** true si ancló a furniture; false = player. */
  fromFurniture: boolean;
}

/**
 * ¿El player está indoor?
 * - tile actual furniture → sí
 * - en radio: walls + furniture >= umbral → sí
 */
export function isIndoor(map: TileMap, wx: number, wy: number): boolean {
  const tx = Math.floor(wx);
  const ty = Math.floor(wy);
  const here = map.getTile(tx, ty);
  if (here?.kind === "furniture") return true;

  let solids = 0;
  for (let dy = -INDOOR_RADIUS; dy <= INDOOR_RADIUS; dy++) {
    for (let dx = -INDOOR_RADIUS; dx <= INDOOR_RADIUS; dx++) {
      const t = map.getTile(tx + dx, ty + dy);
      if (!t) continue;
      if (t.kind === "wall" || t.kind === "furniture" || t.kind === "barricade") {
        solids++;
      }
    }
  }
  return solids >= INDOOR_SOLID_THRESHOLD;
}

/**
 * Ancla de luz cálida: furniture más cercano en radio, si no player.
 * Coords de mundo (centro tile).
 */
export function warmLightAnchor(
  map: TileMap,
  wx: number,
  wy: number,
  radius = INDOOR_RADIUS + 1,
): WarmLightAnchor {
  const tx = Math.floor(wx);
  const ty = Math.floor(wy);
  let best: { x: number; y: number; d: number } | null = null;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const t = map.getTile(tx + dx, ty + dy);
      if (t?.kind !== "furniture") continue;
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      if (!best || d < best.d) {
        best = { x: tx + dx + 0.5, y: ty + dy + 0.5, d };
      }
    }
  }
  if (best) return { x: best.x, y: best.y, fromFurniture: true };
  return { x: wx, y: wy, fromFurniture: false };
}

/**
 * Intensidad de luz cálida [0,1] según daylight + indoor.
 * Día o outdoor → 0; noche indoor → hasta 1.
 */
export function warmLightIntensity(indoor: boolean, daylight: number): number {
  if (!indoor) return 0;
  // daylight 0.08 noche … 1 mediodía; arranca a ~0.45
  const night = Math.max(0, 1 - daylight / 0.45);
  return Math.min(1, night * night);
}

/**
 * Intensidad warm que lee syncLighting (clock fresco o vivo).
 * Outdoor / día → 0; noche indoor → night².
 */
export function warmLightFromClock(
  indoor: boolean,
  clock: { daylight: number },
): number {
  return warmLightIntensity(indoor, clock.daylight);
}

/**
 * R / softReset: luz cálida del clock fresco (medianoche).
 * leftover noon indoor no filtra. F9 / enterGameOver / freeze no assign.
 */
export function warmLightAfterRestart(indoor: boolean): number {
  return warmLightFromClock(indoor, clockAfterRestart());
}
