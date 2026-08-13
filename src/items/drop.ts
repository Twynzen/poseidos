/**
 * Tirar del slot al tile (pila WorldContainer).
 * U tira 1; Shift+U tira el stack entero (ver game.ts). G/E recogen 1; Shift+G el stack.
 */

import { getItemDef } from "./defs";
import {
  addItem,
  removeFromSlot,
  type Inventory,
  type ItemStack,
} from "./inventory";
import {
  createWorldContainer,
  type ContainerRegistry,
  type WorldContainer,
} from "./containers";
import { lootPileLabel } from "./lootLabel";

/** Cuántas unidades tirar: 1, o el stack entero si `wholeStack`. */
export function dropQty(
  stackQty: number | undefined,
  wholeStack: boolean,
): number {
  if (!wholeStack) return 1;
  if (typeof stackQty === "number" && Number.isFinite(stackQty) && stackQty >= 1) {
    return Math.trunc(stackQty);
  }
  return 1;
}

/** Toast al tirar: `tiraste munición ×8` si qty>1, si no `tiraste <name>`. */
export function dropToastLabel(name: string, qty: number): string {
  if (qty > 1) return `tiraste ${name} ×${qty}`;
  return `tiraste ${name}`;
}

/**
 * Quita hasta `qty` del slot. Devuelve `{id, qty}` o null si el slot no existe.
 */
export function takeFromSlot(
  inv: Inventory,
  slotIndex: number,
  qty = 1,
): ItemStack | null {
  const slot = inv.slots[slotIndex];
  if (!slot) return null;
  const id = slot.id;
  const n = removeFromSlot(inv, slotIndex, qty);
  if (n <= 0) return null;
  return { id, qty: n };
}

/**
 * Deja `stack` en el tile. Si ya hay contenedor, addItem y lo devuelve;
 * si no, crea WorldContainer con el nombre del item y lo registra.
 */
export function dropOnTile(
  containers: ContainerRegistry,
  tx: number,
  ty: number,
  stack: ItemStack,
  id: string,
): WorldContainer {
  let c = containers.at(tx, ty);
  if (c) {
    addItem(c.inv, stack.id, stack.qty);
  } else {
    c = createWorldContainer(
      id,
      tx,
      ty,
      getItemDef(stack.id).name,
      [stack],
    );
    containers.add(c);
  }
  c.name = lootPileLabel(c.inv, getItemDef(stack.id).name);
  return c;
}
