/**
 * Relleno de botella vacía con lluvia (survival agua/sed).
 * Headless: raining + outdoor + empty_bottle → water_bottle.
 * Tecla Q prioriza refill sobre consumir (ver game.ts).
 * Última del stack: water_bottle en el mismo índice (sticky, como drink);
 * leftover: addItem + rollback.
 * Dest lleno (leftover): botella rollback, reason inv_full.
 */

import {
  addItem,
  findSlot,
  insertStackAt,
  removeFromSlot,
  totalWeight,
  type Inventory,
} from "./inventory";
import { getItemDef } from "./defs";

export type RefillFailReason = "no_rain" | "indoor" | "no_bottle" | "inv_full";

export interface RefillAttempt {
  ok: true;
}

export interface RefillFail {
  ok: false;
  reason: RefillFailReason;
  message: string;
}

/**
 * ¿Se puede intentar recoger lluvia?
 * raining + outdoor + tiene empty_bottle.
 */
export function canRefillFromRain(
  weatherIsRaining: boolean,
  outdoor: boolean,
  inv: Inventory,
): boolean {
  if (!weatherIsRaining || !outdoor) return false;
  const i = findSlot(inv, "empty_bottle");
  return i >= 0 && (inv.slots[i]?.qty ?? 0) >= 1;
}

/**
 * Leftover (qty>1): ¿cabe 1 water_bottle tras quitar 1 vacía
 * (mismos slots; peso −vacía +agua)? Última del stack siempre cabe (sticky).
 */
function canAcceptLeftoverWater(inv: Inventory): boolean {
  const emptyW = getItemDef("empty_bottle").weight;
  const water = getItemDef("water_bottle");
  if (totalWeight(inv) - emptyW + water.weight > inv.maxWeight + 1e-9) {
    return false;
  }
  const wi = findSlot(inv, "water_bottle");
  if (wi >= 0 && (inv.slots[wi]?.qty ?? 0) < water.maxStack) return true;
  return inv.slots.length < inv.maxSlots;
}

export function diagnoseRefill(
  weatherIsRaining: boolean,
  outdoor: boolean,
  inv: Inventory,
): RefillFailReason | null {
  if (!weatherIsRaining) return "no_rain";
  if (!outdoor) return "indoor";
  const i = findSlot(inv, "empty_bottle");
  const qty = inv.slots[i]?.qty ?? 0;
  if (i < 0 || qty < 1) return "no_bottle";
  if (qty > 1 && !canAcceptLeftoverWater(inv)) return "inv_full";
  return null;
}

export function refillFailMessage(reason: RefillFailReason): string {
  switch (reason) {
    case "no_rain":
      return "no llueve";
    case "indoor":
      return "necesitas estar outdoor";
    case "no_bottle":
      return "falta botella vacía";
    case "inv_full":
      return "inventario lleno";
  }
}

/**
 * Toast HUD si el agua no entró. Reusa el copy existente
 * `inventario lleno` (loot / drop / craft / cook dest lleno).
 * `added` > 0 → null (éxito).
 */
export function refillFullMessage(added: number): string | null {
  if (added > 0) return null;
  return "inventario lleno";
}

/**
 * Consume 1 empty_bottle → 1 water_bottle.
 * Última del stack: inserta agua en el mismo índice (sticky).
 * Leftover: addItem + rollback si no cabe. Devuelve true si ok.
 */
export function tryRefillFromRain(
  weatherIsRaining: boolean,
  outdoor: boolean,
  inv: Inventory,
): boolean {
  if (!canRefillFromRain(weatherIsRaining, outdoor, inv)) return false;
  const slot = findSlot(inv, "empty_bottle");
  if (slot < 0) return false;
  const last = (inv.slots[slot]?.qty ?? 0) <= 1;
  if (removeFromSlot(inv, slot, 1) < 1) return false;
  if (last) {
    insertStackAt(inv, slot, { id: "water_bottle", qty: 1 });
    return true;
  }
  if (addItem(inv, "water_bottle", 1) < 1) {
    addItem(inv, "empty_bottle", 1); // rollback leftover case
    return false;
  }
  return true;
}

/** Intento con mensaje HUD (éxito o fallo). */
export function attemptRefill(
  weatherIsRaining: boolean,
  outdoor: boolean,
  inv: Inventory,
): RefillAttempt | RefillFail {
  const fail = diagnoseRefill(weatherIsRaining, outdoor, inv);
  if (fail) {
    return { ok: false, reason: fail, message: refillFailMessage(fail) };
  }
  if (!tryRefillFromRain(weatherIsRaining, outdoor, inv)) {
    // diagnose ya filtró rain / indoor / bottle; rollback deja la vacía.
    return { ok: false, reason: "inv_full", message: refillFailMessage("inv_full") };
  }
  return { ok: true };
}

/**
 * HAS MUERTO / F9 load-muerto: Q no aplica (se drena, no usa ni refill).
 * Vivo (incl. F9 load-vivo): refill bajo lluvia outdoor o usa el slot, igual que hoy.
 * No cambia reglas de consume/refill; solo gate de input.
 */
export function useInputApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/**
 * HAS MUERTO / F9 load-muerto: no llama apply (inventario / needs iguales).
 * Vivo + wants → apply(). !wants → null.
 */
export function applyUseInput<T>(
  gameOver: boolean,
  wants: boolean,
  apply: () => T | null,
): T | null {
  if (!useInputApplies(gameOver) || !wants) return null;
  return apply();
}
