/**
 * Craft/build mínimo (F2): madera → barricada; tela+chatarra → vendaje.
 * Headless: consume inventario y muta TileMap / stacks.
 */

import type { TileMap } from "../world/tilemap";
import { makeBarricade } from "../world/tile";
import { addItem, findSlot, removeFromSlot, type Inventory } from "./inventory";

/** Unidades de madera por barricada. */
export const BARRICADE_WOOD_COST = 1;

/** Receta vendaje: 1 tela + 1 chatarra → 1 vendaje. */
export const BANDAGE_CLOTH_COST = 1;
export const BANDAGE_SCRAP_COST = 1;

export interface BuildResult {
  x: number;
  y: number;
}

/** Motivo legible si no se puede colocar barricada. */
export type BarricadeFailReason = "no_wood" | "bad_tile";

export interface BarricadeAttempt {
  ok: true;
  result: BuildResult;
}

export interface BarricadeFail {
  ok: false;
  reason: BarricadeFailReason;
  /** Mensaje HUD corto en español. */
  message: string;
}

/** ¿El tile admite una barricada nueva? Solo suelo vacío. */
export function canPlaceBarricade(map: TileMap, tx: number, ty: number): boolean {
  const t = map.getTile(tx, ty);
  return !!t && t.kind === "floor";
}

/** ¿Hay madera suficiente en el inventario? */
export function hasBarricadeMaterials(inv: Inventory): boolean {
  const i = findSlot(inv, "wood");
  if (i < 0) return false;
  return (inv.slots[i]?.qty ?? 0) >= BARRICADE_WOOD_COST;
}

/** ¿Hay tela + chatarra para un vendaje? */
export function hasBandageMaterials(inv: Inventory): boolean {
  const cloth = findSlot(inv, "cloth");
  const scrap = findSlot(inv, "scrap");
  if (cloth < 0 || scrap < 0) return false;
  return (
    (inv.slots[cloth]?.qty ?? 0) >= BANDAGE_CLOTH_COST &&
    (inv.slots[scrap]?.qty ?? 0) >= BANDAGE_SCRAP_COST
  );
}

/**
 * Diagnóstico HUD: por qué fallaría B en (tx,ty).
 * Prioriza falta de madera sobre tile inválido (feedback más útil).
 */
export function diagnoseBarricade(
  map: TileMap,
  inv: Inventory,
  tx: number,
  ty: number,
): BarricadeFailReason | null {
  if (!hasBarricadeMaterials(inv)) return "no_wood";
  if (!canPlaceBarricade(map, tx, ty)) return "bad_tile";
  return null;
}

export function barricadeFailMessage(reason: BarricadeFailReason): string {
  if (reason === "no_wood") return "falta madera";
  return "no se puede aquí (puerta/mueble/muro)";
}

/**
 * Coloca barricada en (tx,ty) consumiendo madera.
 * Devuelve coords si ok; null si tile inválido o falta material.
 */
export function tryBuildBarricade(
  map: TileMap,
  inv: Inventory,
  tx: number,
  ty: number,
): BuildResult | null {
  if (!canPlaceBarricade(map, tx, ty)) return null;
  if (!hasBarricadeMaterials(inv)) return null;
  const slot = findSlot(inv, "wood");
  if (slot < 0) return null;
  const taken = removeFromSlot(inv, slot, BARRICADE_WOOD_COST);
  if (taken < BARRICADE_WOOD_COST) return null;
  map.setTile(tx, ty, makeBarricade());
  return { x: tx, y: ty };
}

/**
 * Intento de barricada con mensaje HUD claro (éxito o fallo).
 */
export function attemptBuildBarricade(
  map: TileMap,
  inv: Inventory,
  tx: number,
  ty: number,
): BarricadeAttempt | BarricadeFail {
  const fail = diagnoseBarricade(map, inv, tx, ty);
  if (fail) {
    return { ok: false, reason: fail, message: barricadeFailMessage(fail) };
  }
  const result = tryBuildBarricade(map, inv, tx, ty);
  if (!result) {
    const again = diagnoseBarricade(map, inv, tx, ty) ?? "bad_tile";
    return { ok: false, reason: again, message: barricadeFailMessage(again) };
  }
  return { ok: true, result };
}

/**
 * HAS MUERTO / F9 load-muerto: B no aplica (se drena, no coloca).
 * Vivo (incl. F9 load-vivo): madera + tile adyacente, igual que hoy.
 * No cambia receta ni toast; solo gate de input.
 */
export function buildInputApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/**
 * HAS MUERTO / F9 load-muerto: no llama apply (inventario / tiles iguales).
 * Vivo + wants → apply(). !wants → null.
 */
export function applyBuildInput<T>(
  gameOver: boolean,
  wants: boolean,
  apply: () => T | null,
): T | null {
  if (!buildInputApplies(gameOver) || !wants) return null;
  return apply();
}

/** Resultado de craft vendaje (add-first no cabe: mismo inv que las mats). */
export type CraftBandageResult = {
  added: number;
};

/**
 * Craft: 1 tela + 1 chatarra → 1 vendaje en el mismo inventario.
 * Dest lleno: added 0, tela+chatarra intactas (rollback, como cook/refill).
 * add-first de dropOnTile no cabe: las mats ocupan el hueco del vendaje.
 * Receta qty 1 → added 0|1; consume solo si el vendaje entra.
 */
export function tryCraftBandage(inv: Inventory): CraftBandageResult {
  if (!hasBandageMaterials(inv)) return { added: 0 };
  const clothSlot = findSlot(inv, "cloth");
  const scrapSlot = findSlot(inv, "scrap");
  if (clothSlot < 0 || scrapSlot < 0) return { added: 0 };
  // Quitar el de índice mayor primero para no invalidar el menor al splice
  const hiIsCloth = clothSlot > scrapSlot;
  const hiId = hiIsCloth ? "cloth" : "scrap";
  const loId = hiIsCloth ? "scrap" : "cloth";
  const hiCost = hiIsCloth ? BANDAGE_CLOTH_COST : BANDAGE_SCRAP_COST;
  const loCost = hiIsCloth ? BANDAGE_SCRAP_COST : BANDAGE_CLOTH_COST;
  if (removeFromSlot(inv, hiIsCloth ? clothSlot : scrapSlot, hiCost) < hiCost) {
    return { added: 0 };
  }
  const loAgain = findSlot(inv, loId);
  if (loAgain < 0 || removeFromSlot(inv, loAgain, loCost) < loCost) {
    addItem(inv, hiId, hiCost);
    return { added: 0 };
  }
  const added = addItem(inv, "bandage", 1);
  if (added <= 0) {
    addItem(inv, "cloth", BANDAGE_CLOTH_COST);
    addItem(inv, "scrap", BANDAGE_SCRAP_COST);
    return { added: 0 };
  }
  return { added };
}

/**
 * Toast HUD si el vendaje no entró. Reusa el copy existente
 * `inventario lleno` (refill / loot / drop dest lleno).
 * `added` > 0 → null (éxito; leftover tela/chatarra no toastea).
 */
export function craftFullMessage(added: number): string | null {
  if (added > 0) return null;
  return "inventario lleno";
}

/**
 * HAS MUERTO / F9 load-muerto: C no aplica (se drena, no craftea).
 * Vivo (incl. F9 load-vivo): tela + chatarra → vendaje, igual que hoy.
 * No cambia receta ni rollback dest-lleno; solo gate de input.
 */
export function craftInputApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/**
 * HAS MUERTO / F9 load-muerto: no llama apply (inventario igual).
 * Vivo + wants → apply(). !wants → null.
 */
export function applyCraftInput<T>(
  gameOver: boolean,
  wants: boolean,
  apply: () => T | null,
): T | null {
  if (!craftInputApplies(gameOver) || !wants) return null;
  return apply();
}
