/**
 * Linterna (flashlight): FOV bonus + luz fría en worldView.
 * Tecla L toggle (ver input.consumeFlashlightToggle / game.ts).
 * Headless: has item, radio FOV, intensidad día/noche.
 */

import { findSlot, type Inventory } from "./inventory";

/** Bonus de radio FOV (tiles) con linterna encendida. */
export const FLASHLIGHT_FOV_BONUS = 4;

/** ¿Inventario tiene al menos 1 linterna? */
export function hasFlashlight(inv: Inventory): boolean {
  const i = findSlot(inv, "flashlight");
  return i >= 0 && (inv.slots[i]?.qty ?? 0) >= 1;
}

/**
 * Radio FOV efectivo: base+bonus si on && hasItem; si no, base.
 */
export function fovRadiusWithFlashlight(
  base: number,
  on: boolean,
  hasItem: boolean,
): number {
  if (on && hasItem) return base + FLASHLIGHT_FOV_BONUS;
  return base;
}

/**
 * Intensidad PointLight linterna.
 * 0 si off o sin item; de noche ~1.2–1.8; de día ~0.35 si on.
 * `daylight` del GameClock (noche baja ~0.08, mediodía 1).
 */
export function torchLightIntensity(
  on: boolean,
  hasItem: boolean,
  daylight: number,
): number {
  if (!on || !hasItem) return 0;
  const d = Math.max(0, Math.min(1, daylight));
  // daylight bajo → noche fuerte; alto → día flojo
  const night = Math.max(0, 1 - d / 0.45);
  // 0.35 (día) … ~1.2–1.7 (noche)
  return 0.35 + night * 1.35;
}
