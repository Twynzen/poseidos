/**
 * Relleno de botella vacía con lluvia (survival agua/sed).
 * Headless: raining + outdoor + empty_bottle → water_bottle.
 * Tecla Q prioriza refill sobre consumir (ver game.ts).
 */

import { addItem, findSlot, removeFromSlot, type Inventory } from "./inventory";

export type RefillFailReason = "no_rain" | "indoor" | "no_bottle" | "inv_full";

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

export function diagnoseRefill(
  weatherIsRaining: boolean,
  outdoor: boolean,
  inv: Inventory,
): RefillFailReason | null {
  if (!weatherIsRaining) return "no_rain";
  if (!outdoor) return "indoor";
  const i = findSlot(inv, "empty_bottle");
  if (i < 0 || (inv.slots[i]?.qty ?? 0) < 1) return "no_bottle";
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
 * Consume 1 empty_bottle → añade 1 water_bottle.
 * Rollback si el add falla (peso/slots). Devuelve true si ok.
 */
export function tryRefillFromRain(
  weatherIsRaining: boolean,
  outdoor: boolean,
  inv: Inventory,
): boolean {
  if (!canRefillFromRain(weatherIsRaining, outdoor, inv)) return false;
  const slot = findSlot(inv, "empty_bottle");
  if (slot < 0) return false;
  if (removeFromSlot(inv, slot, 1) < 1) return false;
  if (addItem(inv, "water_bottle", 1) < 1) {
    // Inventario lleno / sin peso: devolver la vacía
    addItem(inv, "empty_bottle", 1);
    return false;
  }
  return true;
}
