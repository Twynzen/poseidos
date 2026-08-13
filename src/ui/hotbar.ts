/**
 * Hotbar display-only (5 slots, estilo PZ). Headless: no DOM, no keybinds.
 * Lee `inv.slots[0..4]` y rellena vacíos; no muta el inventario.
 */

import { getItemDef, type ItemId } from "../items/defs";
import type { Inventory } from "../items/inventory";

export const HOTBAR_SIZE = 5;

export type HotbarFilledSlot = {
  empty: false;
  index: number;
  key: string;
  id: ItemId;
  name: string;
  qty: number;
};

export type HotbarEmptySlot = {
  empty: true;
  index: number;
  key: string;
};

export type HotbarSlot = HotbarFilledSlot | HotbarEmptySlot;

/** Tecla visual del slot (`0` → `"1"`, … `4` → `"5"`). */
export function hotbarKey(index: number): string {
  return String(index + 1);
}

/**
 * Siempre 5 entradas desde `inv.slots[0..4]`.
 * Stack ausente o qty≤0 → empty. No muta `inv`.
 */
export function hotbarSlots(inv: Inventory): HotbarSlot[] {
  const out: HotbarSlot[] = [];
  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const stack = inv.slots[i];
    const key = hotbarKey(i);
    if (!stack || stack.qty <= 0) {
      out.push({ empty: true, index: i, key });
      continue;
    }
    out.push({
      empty: false,
      index: i,
      key,
      id: stack.id,
      name: getItemDef(stack.id).name,
      qty: stack.qty,
    });
  }
  return out;
}
