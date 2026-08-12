/**
 * Combate cuerpo a cuerpo (F3). Headless — sin Three.
 * Espacio/V: daño a hostil adyacente (prioriza facing).
 * Variedad: manos vacías vs armas melee del inventario (mejor daño).
 */

import { getItemDef, isMeleeWeapon, type ItemId } from "../items/defs";
import type { Inventory } from "../items/inventory";

/** Daño a puños (manos vacías). */
export const MELEE_DAMAGE = 15;
/** Alcance melee en unidades de mundo (~tile adyacente). */
export const MELEE_RANGE = 1.15;
/** Cooldown entre golpes del player (puños). */
export const MELEE_COOLDOWN = 0.5;

export interface MeleeTarget {
  id: string;
  x: number;
  y: number;
}

export interface MeleePick {
  id: string;
  dist: number;
  /** True si está en el arco/tile de facing. */
  facing: boolean;
}

/** Arma resuelta o puños. */
export interface MeleeWeaponChoice {
  /** null = puños. */
  id: ItemId | null;
  /** Etiqueta HUD: "puños" | "cuchillo" | … */
  label: string;
  damage: number;
  reach: number;
  cooldown: number;
}

export const BARE_HANDS: MeleeWeaponChoice = {
  id: null,
  label: "puños",
  damage: MELEE_DAMAGE,
  reach: MELEE_RANGE,
  cooldown: MELEE_COOLDOWN,
};

/**
 * Elige la mejor arma melee del inventario (mayor daño).
 * Sin arma → puños.
 */
export function resolveMeleeWeapon(inv: Inventory): MeleeWeaponChoice {
  let best: MeleeWeaponChoice | null = null;
  for (const slot of inv.slots) {
    const def = getItemDef(slot.id);
    if (!isMeleeWeapon(def) || slot.qty <= 0) continue;
    const choice: MeleeWeaponChoice = {
      id: def.id,
      label: def.name,
      damage: def.meleeDamage!,
      reach: def.meleeReach ?? MELEE_RANGE,
      cooldown: def.meleeCooldown ?? MELEE_COOLDOWN,
    };
    if (!best || choice.damage > best.damage) best = choice;
  }
  return best ?? BARE_HANDS;
}

/**
 * Elige hostil para melee: prioriza el que está en la dirección
 * de facing (adyacente), si no el más cercano dentro de rango.
 */
export function pickMeleeTarget(
  ax: number,
  ay: number,
  facingX: number,
  facingY: number,
  targets: ReadonlyArray<MeleeTarget>,
  range = MELEE_RANGE,
): MeleePick | null {
  let bestFacing: MeleePick | null = null;
  let bestAny: MeleePick | null = null;

  const fx = facingX === 0 && facingY === 0 ? 0 : facingX;
  const fy = facingX === 0 && facingY === 0 ? 1 : facingY;

  for (const t of targets) {
    const dist = Math.hypot(t.x - ax, t.y - ay);
    if (dist > range) continue;

    // Facing: hostil en el semiplano / tile delante del atacante
    const dx = t.x - ax;
    const dy = t.y - ay;
    const facing =
      fx !== 0 || fy !== 0
        ? dx * fx + dy * fy >= -0.15 &&
          Math.abs(dx * fy - dy * fx) <= range * 0.85
        : false;

    const pick: MeleePick = { id: t.id, dist, facing };
    if (facing) {
      if (!bestFacing || dist < bestFacing.dist) bestFacing = pick;
    }
    if (!bestAny || dist < bestAny.dist) bestAny = pick;
  }

  return bestFacing ?? bestAny;
}
