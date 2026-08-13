/**
 * Tirar 1 unidad del slot al tile (pila WorldContainer).
 * Tecla U (ver game.ts). G/E recogen con lootOne.
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
  const existing = containers.at(tx, ty);
  if (existing) {
    addItem(existing.inv, stack.id, stack.qty);
    return existing;
  }
  const created = createWorldContainer(
    id,
    tx,
    ty,
    getItemDef(stack.id).name,
    [stack],
  );
  containers.add(created);
  return created;
}
