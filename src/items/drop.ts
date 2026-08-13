/**
 * Tirar del slot al tile de frente (pila WorldContainer).
 * U tira 1; Shift+U tira el stack entero (ver game.ts). G/E recogen 1; Shift+G el stack.
 * Si el tile de facing no es walkable, cae en el tile del player.
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

/**
 * De qué slot tira U: con I abierto, la última fila ocupada; si no, hotbar.
 * panel cerrado → hotbarSelected.
 * panel abierto + lastInvIndex con qty ≥ 1 → ese índice.
 * null / vacío / ausente → hotbarSelected.
 */
export function dropSourceIndex(
  panelOpen: boolean,
  lastInvIndex: number | null,
  hotbarSelected: number,
  slots: ReadonlyArray<{ qty: number } | null | undefined>,
): number {
  if (!panelOpen) return hotbarSelected;
  if (lastInvIndex === null) return hotbarSelected;
  const stack = slots[lastInvIndex];
  if (!stack || !(stack.qty >= 1)) return hotbarSelected;
  return lastInvIndex;
}

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

function tileOrigin(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.floor(v);
}

/** Trunc facing a cardinal -1..1. No finito → 0. */
function facingStep(v: number): number {
  if (!Number.isFinite(v)) return 0;
  const t = Math.trunc(v);
  if (t > 1) return 1;
  if (t < -1) return -1;
  return t;
}

/**
 * Tile destino al tirar: un paso en facing, o el tile del player.
 * ox/oy = floor(px/py); no finito → 0.
 * fx/fy = trunc facing, clamp -1..1; no finito → 0.
 * candidate = (ox+fx, oy+fy). facing (0,0) → tile del player.
 * Si `walkable` está y `walkable(tx,ty)` es false → (ox, oy).
 */
export function dropTargetTile(
  px: number,
  py: number,
  facingX: number,
  facingY: number,
  walkable?: (tx: number, ty: number) => boolean,
): { tx: number; ty: number } {
  const ox = tileOrigin(px);
  const oy = tileOrigin(py);
  const fx = facingStep(facingX);
  const fy = facingStep(facingY);
  const tx = ox + fx;
  const ty = oy + fy;
  if (walkable && !walkable(tx, ty)) {
    return { tx: ox, ty: oy };
  }
  return { tx, ty };
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
