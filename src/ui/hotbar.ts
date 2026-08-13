/**
 * Hotbar display-only (5 slots, estilo PZ). Headless: no DOM.
 * Lee `inv.slots[0..4]` y rellena vacíos; no muta el inventario.
 * `hotbarIndexFromKey` mapea Digit/Numpad 1–5 → índice; el bind vive en Input.
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
 * KeyboardEvent.code → índice hotbar.
 * Digit1/Numpad1 → 0 … Digit5/Numpad5 → 4; cualquier otro código → null.
 */
export function hotbarIndexFromKey(code: string): number | null {
  switch (code) {
    case "Digit1":
    case "Numpad1":
      return 0;
    case "Digit2":
    case "Numpad2":
      return 1;
    case "Digit3":
    case "Numpad3":
      return 2;
    case "Digit4":
    case "Numpad4":
      return 3;
    case "Digit5":
    case "Numpad5":
      return 4;
    default:
      return null;
  }
}

/**
 * Clamp a [0, HOTBAR_SIZE-1]. NaN / no finito → 0.
 * No-positivo (incl. `Math.trunc(-0.2) === -0`) → 0.
 */
export function clampHotbarIndex(index: number): number {
  if (!Number.isFinite(index) || index <= 0) return 0;
  const i = Math.trunc(index);
  return i >= HOTBAR_SIZE ? HOTBAR_SIZE - 1 : i;
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
