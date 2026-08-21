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
 * HAS MUERTO / F9 load-muerto: no cono/luz ni bonus FOV de linterna sobre el cadáver.
 * Vivo (incl. F9 load-vivo): on && hasItem igual que hoy.
 * Ya apagado = no-op; gameOver no inventa restore del flag.
 */
export function torchLightApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/**
 * HAS MUERTO / F9 load-muerto: L no aplica (se drena, el flag no flippea).
 * Vivo (incl. F9 load-vivo): L togglea si hay item, igual que hoy.
 * No esconde el cono; solo gate de input. gameOver no fuerza off.
 */
export function flashlightToggleApplies(gameOver: boolean): boolean {
  return torchLightApplies(gameOver);
}

/**
 * HAS MUERTO / F9 load-muerto: current sin cambio (on queda on, off queda off).
 * Vivo + wantsToggle + hasItem → flip. Vivo + sin item → off.
 * !wantsToggle → current. No inventa HUD copy.
 */
export function nextFlashlightOn(
  gameOver: boolean,
  current: boolean,
  wantsToggle: boolean,
  hasItem: boolean,
): boolean {
  if (!flashlightToggleApplies(gameOver)) return current;
  if (!hasItem) return false;
  if (wantsToggle) return !current;
  return current;
}

/**
 * Radio FOV efectivo: base+bonus si on && hasItem; si no, base.
 * gameOver → base (HAS MUERTO / F9 load-muerto; no extra tiles al cadáver).
 */
export function fovRadiusWithFlashlight(
  base: number,
  on: boolean,
  hasItem: boolean,
  gameOver = false,
): number {
  if (!torchLightApplies(gameOver)) return base;
  if (on && hasItem) return base + FLASHLIGHT_FOV_BONUS;
  return base;
}

/**
 * Intensidad PointLight linterna.
 * 0 si off o sin item o gameOver; de noche ~1.2–1.8; de día ~0.35 si on.
 * `daylight` del GameClock (noche baja ~0.08, mediodía 1).
 */
export function torchLightIntensity(
  on: boolean,
  hasItem: boolean,
  daylight: number,
  gameOver = false,
): number {
  if (!torchLightApplies(gameOver)) return 0;
  if (!on || !hasItem) return 0;
  const d = Math.max(0, Math.min(1, daylight));
  // daylight bajo → noche fuerte; alto → día flojo
  const night = Math.max(0, 1 - d / 0.45);
  // 0.35 (día) … ~1.2–1.7 (noche)
  return 0.35 + night * 1.35;
}
