/**
 * Kit inicial al spawn (1P polish): agua + lata + linterna + pistola + ammo.
 * Headless; PlayerSim lo aplica por defecto si no pasan inventario.
 * Load save NO lo sobrescribe: applySave reemplaza el inventario del save.
 */

import type { ItemId } from "./defs";
import {
  addItem,
  createInventory,
  type Inventory,
} from "./inventory";

export const STARTER_KIT: readonly { id: ItemId; qty: number }[] = [
  { id: "water_bottle", qty: 1 },
  { id: "canned_food", qty: 1 },
  { id: "flashlight", qty: 1 },
  { id: "pistol", qty: 1 },
  { id: "ammo", qty: 8 },
];

/** Añade cada entrada del kit al inventario (respeta slots/peso). */
export function applyStarterKit(inv: Inventory): void {
  for (const entry of STARTER_KIT) {
    addItem(inv, entry.id, entry.qty);
  }
}

/**
 * Inventario fresco con kit inicial.
 * Defaults iguales a createInventory (8 slots / 20 peso).
 */
export function createStarterInventory(
  maxSlots = 8,
  maxWeight = 20,
): Inventory {
  const inv = createInventory(maxSlots, maxWeight);
  applyStarterKit(inv);
  return inv;
}
