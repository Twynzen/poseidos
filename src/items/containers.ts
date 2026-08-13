/**
 * Contenedores del mundo (muebles / chests) con inventario propio.
 */

import { getItemDef } from "./defs";
import {
  createInventory,
  totalQty,
  transferOne,
  transferStack,
  type Inventory,
  type ItemStack,
} from "./inventory";
import { lootPileLabel } from "./lootLabel";
import { rollLoot, type LootEntry } from "./loot";

export interface WorldContainer {
  id: string;
  /** Tile X. */
  x: number;
  /** Tile Y. */
  y: number;
  name: string;
  inv: Inventory;
}

export const CONTAINER_REACH = 1.6;

/** Tile preferido para loot (facing); null/omitido = solo distancia. */
export type LootPreferTile = { tx: number; ty: number } | null;

/** Distancia al centro del tile del contenedor. */
function distToCenter(wx: number, wy: number, c: WorldContainer): number {
  return Math.hypot(wx - (c.x + 0.5), wy - (c.y + 0.5));
}

/** True si hay al menos un slot y qty total > 0. */
export function containerHasLoot(c: WorldContainer): boolean {
  return c.inv.slots.length > 0 && totalQty(c.inv) > 0;
}

export function createWorldContainer(
  id: string,
  x: number,
  y: number,
  name: string,
  initial: ItemStack[] = [],
  maxSlots = 6,
  maxWeight = 40,
): WorldContainer {
  return {
    id,
    x,
    y,
    name,
    inv: createInventory(maxSlots, maxWeight, initial),
  };
}

export function createContainerFromLoot(
  id: string,
  x: number,
  y: number,
  name: string,
  table: readonly LootEntry[],
  rng: () => number,
): WorldContainer {
  const stacks = rollLoot(table, rng);
  return createWorldContainer(id, x, y, name, stacks);
}

/** Registro headless de contenedores en el mapa. */
export class ContainerRegistry {
  readonly list: WorldContainer[];

  constructor(list: WorldContainer[] = []) {
    this.list = list;
  }

  add(c: WorldContainer): void {
    this.list.push(c);
  }

  at(tx: number, ty: number): WorldContainer | null {
    return this.list.find((c) => c.x === tx && c.y === ty) ?? null;
  }

  /**
   * Contenedor más cercano al punto mundo dentro de `reach`.
   * Si `prefer` apunta a un tile con loot en reach, ese gana (facing / drop).
   */
  nearest(
    wx: number,
    wy: number,
    reach = CONTAINER_REACH,
    prefer?: LootPreferTile,
  ): WorldContainer | null {
    if (prefer) {
      const preferred = this.at(prefer.tx, prefer.ty);
      if (
        preferred &&
        containerHasLoot(preferred) &&
        distToCenter(wx, wy, preferred) <= reach
      ) {
        return preferred;
      }
    }
    let best: { c: WorldContainer; d: number } | null = null;
    for (const c of this.list) {
      if (!containerHasLoot(c)) continue;
      const d = distToCenter(wx, wy, c);
      if (d <= reach && (!best || d < best.d)) best = { c, d };
    }
    return best?.c ?? null;
  }

  /**
   * Toma 1 unidad del primer stack del contenedor cercano → inventario destino.
   * Devuelve el stack transferido o null.
   */
  lootOne(
    wx: number,
    wy: number,
    dest: Inventory,
    reach = CONTAINER_REACH,
    prefer?: LootPreferTile,
  ): ItemStack | null {
    const c = this.nearest(wx, wy, reach, prefer);
    if (!c || c.inv.slots.length === 0) return null;
    const taken = transferOne(c.inv, dest, 0);
    if (taken && containerHasLoot(c)) {
      refreshContainerLabel(c, getItemDef(taken.id).name);
    }
    return taken;
  }

  /**
   * Toma el primer stack entero del contenedor cercano → inventario destino.
   * Devuelve `{ id, qty }` transferido o null.
   */
  lootStack(
    wx: number,
    wy: number,
    dest: Inventory,
    reach = CONTAINER_REACH,
    prefer?: LootPreferTile,
  ): ItemStack | null {
    const c = this.nearest(wx, wy, reach, prefer);
    if (!c || c.inv.slots.length === 0) return null;
    const id = c.inv.slots[0]!.id;
    const added = transferStack(c.inv, dest, 0);
    if (added <= 0) return null;
    if (containerHasLoot(c)) {
      refreshContainerLabel(c, getItemDef(id).name);
    }
    return { id, qty: added };
  }
}

/**
 * Actualiza `c.name` tras loot. 1 stack restante usa el def name
 * (ignora fallback sucio con ×N). 2+ usa el fallback limpio del contenedor.
 */
function refreshContainerLabel(c: WorldContainer, itemName: string): void {
  const fallback =
    typeof c.name === "string" ? c.name.replace(/ ×\d+$/, "") : "";
  c.name = lootPileLabel(c.inv, fallback || itemName);
}
