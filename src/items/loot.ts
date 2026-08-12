/**
 * Loot tables simples (chance + min/max) → stacks.
 */

import type { ItemId } from "./defs";
import type { ItemStack } from "./inventory";

export interface LootEntry {
  id: ItemId;
  /** 0–1 probabilidad de aparecer. */
  chance: number;
  min: number;
  max: number;
}

/** Cocina: comida + agua garantizadas (demo) + cuchillo posible. */
export const LOOT_KITCHEN: LootEntry[] = [
  { id: "canned_food", chance: 1, min: 1, max: 2 },
  { id: "water_bottle", chance: 1, min: 1, max: 2 },
  { id: "wood", chance: 0.4, min: 1, max: 2 },
  { id: "cloth", chance: 0.35, min: 1, max: 2 },
  { id: "knife", chance: 0.45, min: 1, max: 1 },
];

/** Armario: mixto + madera + cuchillo + chance baja pistola/munición. */
export const LOOT_CABINET: LootEntry[] = [
  { id: "canned_food", chance: 0.75, min: 1, max: 1 },
  { id: "water_bottle", chance: 0.6, min: 1, max: 1 },
  { id: "empty_bottle", chance: 0.2, min: 1, max: 1 },
  { id: "scrap", chance: 0.5, min: 1, max: 3 },
  { id: "wood", chance: 0.85, min: 1, max: 3 },
  { id: "cloth", chance: 0.7, min: 1, max: 2 },
  { id: "knife", chance: 0.3, min: 1, max: 1 },
  { id: "ammo", chance: 0.22, min: 2, max: 6 },
  { id: "pistol", chance: 0.12, min: 1, max: 1 },
  { id: "flashlight", chance: 0.4, min: 1, max: 1 },
];

/** Cobertizo / caja: madera + chatarra + palanca + chance baja pistola/munición. */
export const LOOT_SHED: LootEntry[] = [
  { id: "wood", chance: 1, min: 2, max: 4 },
  { id: "scrap", chance: 0.9, min: 1, max: 3 },
  { id: "cloth", chance: 0.55, min: 1, max: 2 },
  { id: "water_bottle", chance: 0.35, min: 1, max: 1 },
  { id: "canned_food", chance: 0.25, min: 1, max: 1 },
  { id: "crowbar", chance: 0.55, min: 1, max: 1 },
  { id: "ammo", chance: 0.28, min: 3, max: 8 },
  { id: "pistol", chance: 0.18, min: 1, max: 1 },
];

/**
 * Tira la tabla. `rng` → [0,1). Determinista si se inyecta seed/rng fijo.
 */
export function rollLoot(
  table: readonly LootEntry[],
  rng: () => number,
): ItemStack[] {
  const out: ItemStack[] = [];
  for (const e of table) {
    if (rng() > e.chance) continue;
    const span = Math.max(0, e.max - e.min);
    const qty = e.min + (span === 0 ? 0 : Math.floor(rng() * (span + 1)));
    if (qty > 0) out.push({ id: e.id, qty });
  }
  return out;
}

/** Loot fijo (sin RNG) — útil para demo/tests. */
export function fixedLoot(stacks: ItemStack[]): ItemStack[] {
  return stacks.map((s) => ({ id: s.id, qty: s.qty }));
}
