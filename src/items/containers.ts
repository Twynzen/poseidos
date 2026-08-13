/**
 * Contenedores del mundo (muebles / chests) con inventario propio.
 */

import {
  createInventory,
  totalQty,
  transferOne,
  type Inventory,
  type ItemStack,
} from "./inventory";
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

  /** Contenedor más cercano al punto mundo dentro de `reach`. */
  nearest(
    wx: number,
    wy: number,
    reach = CONTAINER_REACH,
  ): WorldContainer | null {
    let best: { c: WorldContainer; d: number } | null = null;
    for (const c of this.list) {
      if (!containerHasLoot(c)) continue;
      const dx = wx - (c.x + 0.5);
      const dy = wy - (c.y + 0.5);
      const d = Math.hypot(dx, dy);
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
  ): ItemStack | null {
    const c = this.nearest(wx, wy, reach);
    if (!c || c.inv.slots.length === 0) return null;
    return transferOne(c.inv, dest, 0);
  }
}
