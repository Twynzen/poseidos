/**
 * Combate a distancia stub (F3). Headless — sin proyectiles Three.
 * Tecla X: disparo con pistola + ammo; raycast/LOS en facing.
 */

import { getItemDef, type ItemId } from "../items/defs";
import {
  findSlot,
  removeFromSlot,
  type Inventory,
} from "../items/inventory";
import { hasLineOfSight } from "../world/los";
import type { TileMap } from "../world/tilemap";

/** Daño base pistola (mayor que cuchillo melee 25). */
export const RANGED_DAMAGE = 45;
/** Alcance en tiles. */
export const RANGED_RANGE = 7;
/** Cooldown entre disparos (s). */
export const RANGED_COOLDOWN = 0.85;
/** Cono de facing: cos(ángulo) mínimo aprox. */
export const RANGED_FACING_DOT = 0.55;

export const RANGED_WEAPON_ID: ItemId = "pistol";
export const RANGED_AMMO_ID: ItemId = "ammo";

export interface RangedTarget {
  id: string;
  x: number;
  y: number;
}

export interface RangedPick {
  id: string;
  dist: number;
}

export type RangedReady =
  | { ok: true; damage: number; range: number; cooldown: number }
  | { ok: false; message: string };

/**
 * ¿Inventario listo para disparar? Mensajes HUD claros si falta arma/munición.
 */
export function checkRangedReady(inv: Inventory): RangedReady {
  const gunSlot = findSlot(inv, RANGED_WEAPON_ID);
  if (gunSlot < 0 || inv.slots[gunSlot]!.qty <= 0) {
    return { ok: false, message: "sin pistola" };
  }
  const ammoSlot = findSlot(inv, RANGED_AMMO_ID);
  if (ammoSlot < 0 || inv.slots[ammoSlot]!.qty <= 0) {
    return { ok: false, message: "sin munición" };
  }
  const def = getItemDef(RANGED_WEAPON_ID);
  return {
    ok: true,
    damage: def.rangedDamage ?? RANGED_DAMAGE,
    range: def.rangedRange ?? RANGED_RANGE,
    cooldown: def.rangedCooldown ?? RANGED_COOLDOWN,
  };
}

/** Gasta 1 ammo. Devuelve true si se consumió. */
export function consumeAmmo(inv: Inventory): boolean {
  const slot = findSlot(inv, RANGED_AMMO_ID);
  if (slot < 0) return false;
  return removeFromSlot(inv, slot, 1) === 1;
}

/**
 * Hostil en cono de facing + rango + LOS (tiles). Prioriza el más cercano.
 */
export function pickRangedTarget(
  ax: number,
  ay: number,
  facingX: number,
  facingY: number,
  targets: ReadonlyArray<RangedTarget>,
  map: TileMap,
  range = RANGED_RANGE,
): RangedPick | null {
  let fx = facingX;
  let fy = facingY;
  if (fx === 0 && fy === 0) {
    fx = 0;
    fy = 1;
  }
  const flen = Math.hypot(fx, fy) || 1;
  fx /= flen;
  fy /= flen;

  const atx = Math.floor(ax);
  const aty = Math.floor(ay);

  let best: RangedPick | null = null;
  for (const t of targets) {
    const dx = t.x - ax;
    const dy = t.y - ay;
    const dist = Math.hypot(dx, dy);
    if (dist > range || dist < 0.2) continue;

    const nx = dx / dist;
    const ny = dy / dist;
    const dot = nx * fx + ny * fy;
    if (dot < RANGED_FACING_DOT) continue;

    const ttx = Math.floor(t.x);
    const tty = Math.floor(t.y);
    if (!hasLineOfSight(map, atx, aty, ttx, tty)) continue;

    if (!best || dist < best.dist) best = { id: t.id, dist };
  }
  return best;
}

/**
 * Punto a `range` tiles en la dirección de facing.
 * Facing (0,0) → sur (0,1), igual que pickRangedTarget.
 */
export function aimAlongFacing(
  x: number,
  y: number,
  facingX: number,
  facingY: number,
  range: number,
): { x: number; y: number } {
  let fx = facingX;
  let fy = facingY;
  if (fx === 0 && fy === 0) {
    fx = 0;
    fy = 1;
  }
  const len = Math.hypot(fx, fy) || 1;
  fx /= len;
  fy /= len;
  const r = Math.max(0, range);
  return { x: x + fx * r, y: y + fy * r };
}

