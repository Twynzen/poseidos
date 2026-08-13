/**
 * Label de pila de loot (nameplate / container.name).
 * Headless: 1 stack → nombre del item; 2+ → fallback ×total.
 */

import { getItemDef, type ItemId } from "./defs";

/**
 * Nombre visible de una pila.
 * Ignora qty<=0. 0 stacks → fallback (o ""). 1 stack → def.name,
 * con ` ×qty` si qty>1. 2+ stacks → `${fallback} ×${total}` si total>1.
 * Fallback no-string → "".
 */
export function lootPileLabel(
  inv: { slots: ReadonlyArray<{ id: string; qty: number }> },
  fallbackName: string,
): string {
  const fallback = typeof fallbackName === "string" ? fallbackName : "";
  const slots = inv?.slots;
  if (!Array.isArray(slots)) return fallback;

  const stacks: { id: string; qty: number }[] = [];
  let total = 0;
  for (const s of slots) {
    if (!s || !(s.qty > 0)) continue;
    stacks.push(s);
    total += s.qty;
  }

  if (stacks.length === 0) return fallback;

  if (stacks.length === 1) {
    const s = stacks[0]!;
    const name = getItemDef(s.id as ItemId).name;
    return s.qty > 1 ? `${name} ×${s.qty}` : name;
  }

  return total > 1 ? `${fallback} ×${total}` : fallback;
}
