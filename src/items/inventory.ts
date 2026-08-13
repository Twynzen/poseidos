/**
 * Inventario genérico (player o contenedor): stacks con peso y slots.
 */

import { getItemDef, type ItemId } from "./defs";

export interface ItemStack {
  id: ItemId;
  qty: number;
}

export interface Inventory {
  slots: ItemStack[];
  maxSlots: number;
  maxWeight: number;
}

export function createInventory(
  maxSlots = 8,
  maxWeight = 20,
  initial: ItemStack[] = [],
): Inventory {
  const inv: Inventory = { slots: [], maxSlots, maxWeight };
  for (const s of initial) {
    addItem(inv, s.id, s.qty);
  }
  return inv;
}

export function totalWeight(inv: Inventory): number {
  let w = 0;
  for (const s of inv.slots) {
    w += getItemDef(s.id).weight * s.qty;
  }
  return w;
}

export function totalQty(inv: Inventory): number {
  let n = 0;
  for (const s of inv.slots) n += s.qty;
  return n;
}

/** Resumen corto para HUD: "lata×2, agua×1". */
export function inventorySummary(inv: Inventory): string {
  if (inv.slots.length === 0) return "(vacío)";
  return inv.slots
    .map((s) => {
      const short =
        s.id === "canned_food"
          ? "lata"
          : s.id === "hot_meal"
            ? "plato"
            : s.id === "water_bottle"
            ? "agua"
            : s.id === "empty_bottle"
              ? "vacía"
              : s.id === "wood"
              ? "madera"
              : s.id === "cloth"
                ? "tela"
                : s.id === "bandage"
                  ? "vendaje"
                  : s.id === "knife"
                    ? "cuchillo"
                    : s.id === "crowbar"
                      ? "palanca"
                      : s.id === "pistol"
                        ? "pistola"
                        : s.id === "ammo"
                          ? "balas"
                          : s.id === "flashlight"
                            ? "linterna"
                            : "chatarra";
      return `${short}×${s.qty}`;
    })
    .join(", ");
}

/**
 * Añade qty del item. Respeta stack, slots y peso.
 * Devuelve cuántas unidades entraron realmente.
 */
export function addItem(inv: Inventory, id: ItemId, qty: number): number {
  if (qty <= 0) return 0;
  const def = getItemDef(id);
  let left = qty;
  let added = 0;

  // Completar stacks existentes
  if (def.stackable) {
    for (const slot of inv.slots) {
      if (slot.id !== id || left <= 0) continue;
      const room = def.maxStack - slot.qty;
      if (room <= 0) continue;
      const n = Math.min(room, left, maxFitByWeight(inv, id));
      if (n <= 0) break;
      slot.qty += n;
      left -= n;
      added += n;
    }
  }

  // Nuevos slots
  while (left > 0 && inv.slots.length < inv.maxSlots) {
    const fit = maxFitByWeight(inv, id);
    if (fit <= 0) break;
    const n = Math.min(def.stackable ? def.maxStack : 1, left, fit);
    if (n <= 0) break;
    inv.slots.push({ id, qty: n });
    left -= n;
    added += n;
  }

  return added;
}

function maxFitByWeight(inv: Inventory, id: ItemId): number {
  const unit = getItemDef(id).weight;
  if (unit <= 0) return Infinity;
  const free = inv.maxWeight - totalWeight(inv);
  if (free <= 0) return 0;
  return Math.floor(free / unit + 1e-9);
}

/** Quita hasta qty del slot; elimina slot si queda 0. Devuelve quitados. */
export function removeFromSlot(
  inv: Inventory,
  slotIndex: number,
  qty: number,
): number {
  const slot = inv.slots[slotIndex];
  if (!slot || qty <= 0) return 0;
  const n = Math.min(slot.qty, qty);
  slot.qty -= n;
  if (slot.qty <= 0) inv.slots.splice(slotIndex, 1);
  return n;
}

/**
 * Inserta `stack` en `slotIndex` sin merge ni chequeo de peso/slots.
 * `slotIndex < 0` → 0; `slotIndex > length` → push.
 */
export function insertStackAt(
  inv: Inventory,
  slotIndex: number,
  stack: ItemStack,
): void {
  const i =
    slotIndex < 0
      ? 0
      : slotIndex > inv.slots.length
        ? inv.slots.length
        : slotIndex;
  inv.slots.splice(i, 0, { id: stack.id, qty: stack.qty });
}

/** Índice del primer stack con id, o -1. */
export function findSlot(inv: Inventory, id: ItemId): number {
  return inv.slots.findIndex((s) => s.id === id);
}

/** Primer slot consumible (food, drink o heal). */
export function findConsumableSlot(
  inv: Inventory,
  prefer?: "food" | "drink" | "heal",
): number {
  if (prefer) {
    const i = inv.slots.findIndex((s) => getItemDef(s.id).use === prefer);
    if (i >= 0) return i;
  }
  return inv.slots.findIndex((s) => {
    const u = getItemDef(s.id).use;
    return u === "food" || u === "drink" || u === "heal";
  });
}

/**
 * Transfiere 1 unidad del stack `fromSlot` (o el primero) de `from` → `to`.
 * Devuelve el stack movido o null si no pudo.
 */
export function transferOne(
  from: Inventory,
  to: Inventory,
  fromSlot = 0,
): ItemStack | null {
  const slot = from.slots[fromSlot];
  if (!slot) return null;
  const added = addItem(to, slot.id, 1);
  if (added <= 0) return null;
  removeFromSlot(from, fromSlot, 1);
  return { id: slot.id, qty: 1 };
}

/** Transfiere todo lo posible del slot (hasta llenar destino). */
export function transferStack(
  from: Inventory,
  to: Inventory,
  fromSlot: number,
): number {
  const slot = from.slots[fromSlot];
  if (!slot) return 0;
  const added = addItem(to, slot.id, slot.qty);
  if (added > 0) removeFromSlot(from, fromSlot, added);
  return added;
}
