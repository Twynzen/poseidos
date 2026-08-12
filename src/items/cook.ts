/**
 * Cooking stub (F2 survival): canned_food → hot_meal.
 * Requiere indoor o cerca de furniture; tecla H.
 */

import type { TileMap } from "../world/tilemap";
import { isIndoor } from "../world/indoor";
import { addItem, findSlot, removeFromSlot, type Inventory } from "./inventory";

/** Input crudo/enlatado. */
export const COOK_INPUT_ID = "canned_food" as const;
/** Resultado cocinado. */
export const COOK_OUTPUT_ID = "hot_meal" as const;

/** Radio Chebyshev para “cerca de furniture”. */
export const COOK_FURNITURE_RADIUS = 1;

export type CookFailReason = "no_food" | "bad_place";

export interface CookAttempt {
  ok: true;
}

export interface CookFail {
  ok: false;
  reason: CookFailReason;
  message: string;
}

/** ¿Hay furniture en radio Chebyshev? */
export function nearFurniture(
  map: TileMap,
  wx: number,
  wy: number,
  radius = COOK_FURNITURE_RADIUS,
): boolean {
  const tx = Math.floor(wx);
  const ty = Math.floor(wy);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const t = map.getTile(tx + dx, ty + dy);
      if (t?.kind === "furniture") return true;
    }
  }
  return false;
}

/** Indoor o junto a furniture → se puede cocinar. */
export function canCookHere(map: TileMap, wx: number, wy: number): boolean {
  return isIndoor(map, wx, wy) || nearFurniture(map, wx, wy);
}

/** ¿Hay comida enlatada para cocinar? */
export function hasCookIngredients(inv: Inventory): boolean {
  const i = findSlot(inv, COOK_INPUT_ID);
  return i >= 0 && (inv.slots[i]?.qty ?? 0) >= 1;
}

/**
 * Diagnóstico HUD. Prioriza falta de comida (feedback más útil).
 */
export function diagnoseCook(
  map: TileMap,
  inv: Inventory,
  wx: number,
  wy: number,
): CookFailReason | null {
  if (!hasCookIngredients(inv)) return "no_food";
  if (!canCookHere(map, wx, wy)) return "bad_place";
  return null;
}

export function cookFailMessage(reason: CookFailReason): string {
  if (reason === "no_food") return "falta comida";
  return "no puedes cocinar aquí";
}

/**
 * Consume 1 canned_food → añade 1 hot_meal.
 * Devuelve true si ok.
 */
export function tryCook(
  map: TileMap,
  inv: Inventory,
  wx: number,
  wy: number,
): boolean {
  if (!canCookHere(map, wx, wy)) return false;
  if (!hasCookIngredients(inv)) return false;
  const slot = findSlot(inv, COOK_INPUT_ID);
  if (slot < 0) return false;
  if (removeFromSlot(inv, slot, 1) < 1) return false;
  if (addItem(inv, COOK_OUTPUT_ID, 1) < 1) {
    // Inventario lleno: devolver la lata
    addItem(inv, COOK_INPUT_ID, 1);
    return false;
  }
  return true;
}

/** Intento con mensaje HUD (éxito o fallo). */
export function attemptCook(
  map: TileMap,
  inv: Inventory,
  wx: number,
  wy: number,
): CookAttempt | CookFail {
  const fail = diagnoseCook(map, inv, wx, wy);
  if (fail) {
    return { ok: false, reason: fail, message: cookFailMessage(fail) };
  }
  if (!tryCook(map, inv, wx, wy)) {
    const again = diagnoseCook(map, inv, wx, wy) ?? "bad_place";
    return { ok: false, reason: again, message: cookFailMessage(again) };
  }
  return { ok: true };
}
