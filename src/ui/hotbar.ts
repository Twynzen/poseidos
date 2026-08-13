/**
 * Hotbar display-only (5 slots, estilo PZ). Headless: no DOM.
 * Lee `inv.slots[0..4]` y rellena vacíos; no muta el inventario (salvo swap).
 * `hotbarIndexFromKey` mapea Digit/Numpad 1–5 → índice; el bind vive en Input.
 * `stepHotbarIndex` cicla con rueda (wrap 0..4).
 * Clic en slot: HotbarHud.consumeClick → Game.hotbarSelected.
 * Doble clic: HotbarHud.consumeDblClick → Game.useHotbarSlot (usar / lluvia).
 * Arrastrar: `swapHotbarStacks` intercambia dos índices ocupados (packed, sin huecos).
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
 * Intercambia dos stacks ocupados en la hotbar (primeros 5, packed).
 * No-op si el índice clampa al mismo, o si falta alguno de los dos slots.
 * `swap(0, 99)` con 5 stacks → intercambia 0 y 4.
 */
export function swapHotbarStacks(
  inv: { slots: Array<{ id: string; qty: number }> },
  from: number,
  to: number,
): boolean {
  const a = clampHotbarIndex(from);
  const b = clampHotbarIndex(to);
  if (a === b) return false;
  const sa = inv.slots[a];
  const sb = inv.slots[b];
  if (!sa || !sb) return false;
  inv.slots[a] = sb;
  inv.slots[b] = sa;
  return true;
}

/**
 * Avanza/retrocede el slot con wrap 0..HOTBAR_SIZE-1.
 * Clamp `current`; `Math.trunc(delta)`; módulo para wrap.
 * NaN current → 0; delta 0 → sin cambio; NaN delta → current (ya clamp).
 */
export function stepHotbarIndex(current: number, delta: number): number {
  const i = clampHotbarIndex(current);
  if (!Number.isFinite(delta)) return i;
  const d = Math.trunc(delta);
  if (d === 0) return i;
  return ((i + d) % HOTBAR_SIZE + HOTBAR_SIZE) % HOTBAR_SIZE;
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

/**
 * True solo si el slot está lleno y el ítem es food/drink/heal.
 * Vacío, linterna, pistola, munición → false.
 */
export function hotbarSlotIsConsumable(slot: HotbarSlot): boolean {
  if (slot.empty) return false;
  const use = getItemDef(slot.id).use;
  return use === "food" || use === "drink" || use === "heal";
}
