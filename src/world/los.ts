import type { TileMap } from "./tilemap";
import { blocksSight } from "./tile";

/** Radio FOV por defecto (tiles). */
export const DEFAULT_FOV_RADIUS = 12;

export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Bresenham: puntos de la línea de (x0,y0) a (x1,y1), inclusive.
 */
export function bresenhamLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  for (;;) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

/**
 * ¿Hay LOS entre dos tiles (enteros)?
 * Origen no se comprueba. Intermedios que bloquean cortan.
 * El destino es visible aunque bloquee (se ve la pared/puerta).
 */
export function hasLineOfSight(
  map: TileMap,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): boolean {
  if (x0 === x1 && y0 === y1) return true;
  const line = bresenhamLine(x0, y0, x1, y1);
  for (let i = 1; i < line.length - 1; i++) {
    const p = line[i]!;
    if (blocksSight(map.getTile(p.x, p.y))) return false;
  }
  return true;
}

/**
 * Conjunto de tiles visibles desde (ox, oy) world float (se floor).
 * Radio circular en tiles. Incluye el tile del origen.
 */
export function computeVisibleTiles(
  map: TileMap,
  ox: number,
  oy: number,
  radius: number = DEFAULT_FOV_RADIUS,
): Set<string> {
  const visible = new Set<string>();
  const cx = Math.floor(ox);
  const cy = Math.floor(oy);
  const r = Math.max(0, Math.floor(radius));
  const r2 = r * r;

  visible.add(tileKey(cx, cy));

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (dx * dx + dy * dy > r2) continue;
      const tx = cx + dx;
      const ty = cy + dy;
      if (!map.inBounds(tx, ty)) continue;
      if (hasLineOfSight(map, cx, cy, tx, ty)) {
        visible.add(tileKey(tx, ty));
      }
    }
  }
  return visible;
}
