/**
 * Empujón al player al recibir daño por toque hostil.
 * Misma colisión que PlayerSim.move: full (nx,ny), si no slide X, si no slide Y.
 */

import { PLAYER_RADIUS } from "../actors/player";
import type { TileMap } from "../world/tilemap";

/** Distancia de knockback por toque (tiles). */
export const TOUCH_KNOCKBACK_DIST = 0.4;

/** Overlap casi cero: vector inestable → fallback +X. */
const OVERLAP_EPS = 1e-8;

export interface KnockbackActor {
  x: number;
  y: number;
}

/**
 * Vector que aleja al player (px,py) del hostil (hx,hy).
 * Si las posiciones coinciden (o casi), empuja +X de forma estable.
 */
export function knockbackFromTouch(
  px: number,
  py: number,
  hx: number,
  hy: number,
  dist = TOUCH_KNOCKBACK_DIST,
): { x: number; y: number } {
  const dx = px - hx;
  const dy = py - hy;
  const len = Math.hypot(dx, dy);
  if (len <= OVERLAP_EPS) {
    return { x: dist, y: 0 };
  }
  const s = dist / len;
  return { x: dx * s, y: dy * s };
}

/**
 * Aplica knockback al player respetando colisión de mapa.
 * Devuelve true si se movió en al menos un eje.
 */
export function tryApplyTouchKnockback(
  player: KnockbackActor,
  hostile: KnockbackActor,
  map: TileMap,
  dist = TOUCH_KNOCKBACK_DIST,
): boolean {
  const ox = player.x;
  const oy = player.y;
  const { x: kx, y: ky } = knockbackFromTouch(ox, oy, hostile.x, hostile.y, dist);
  const nx = ox + kx;
  const ny = oy + ky;
  if (map.canOccupy(nx, ny, PLAYER_RADIUS)) {
    player.x = nx;
    player.y = ny;
  } else if (map.canOccupy(nx, oy, PLAYER_RADIUS)) {
    player.x = nx;
  } else if (map.canOccupy(ox, ny, PLAYER_RADIUS)) {
    player.y = ny;
  }
  return player.x !== ox || player.y !== oy;
}
