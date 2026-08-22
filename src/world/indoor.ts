/**
 * Heurística indoor/outdoor (headless).
 * Indoor ≈ cerca de walls/furniture o de pie en furniture;
 * outdoor = calle abierta con pocos muros cercanos.
 */

import { clockAfterRestart } from "../core/clock";
import type { TileMap } from "./tilemap";

/** Radio Chebyshev para muestrear vecindario. */
export const INDOOR_RADIUS = 2;

/** Mínimo de tiles wall/furniture en radio para considerar indoor. */
export const INDOOR_SOLID_THRESHOLD = 3;

export interface WarmLightAnchor {
  x: number;
  y: number;
  /** true si ancló a furniture; false = player. */
  fromFurniture: boolean;
}

/**
 * ¿El player está indoor?
 * - tile actual furniture → sí
 * - en radio: walls + furniture >= umbral → sí
 */
export function isIndoor(map: TileMap, wx: number, wy: number): boolean {
  const tx = Math.floor(wx);
  const ty = Math.floor(wy);
  const here = map.getTile(tx, ty);
  if (here?.kind === "furniture") return true;

  let solids = 0;
  for (let dy = -INDOOR_RADIUS; dy <= INDOOR_RADIUS; dy++) {
    for (let dx = -INDOOR_RADIUS; dx <= INDOOR_RADIUS; dx++) {
      const t = map.getTile(tx + dx, ty + dy);
      if (!t) continue;
      if (t.kind === "wall" || t.kind === "furniture" || t.kind === "barricade") {
        solids++;
      }
    }
  }
  return solids >= INDOOR_SOLID_THRESHOLD;
}

/**
 * Ancla de luz cálida: furniture más cercano en radio, si no player.
 * Coords de mundo (centro tile).
 */
export function warmLightAnchor(
  map: TileMap,
  wx: number,
  wy: number,
  radius = INDOOR_RADIUS + 1,
): WarmLightAnchor {
  const tx = Math.floor(wx);
  const ty = Math.floor(wy);
  let best: { x: number; y: number; d: number } | null = null;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const t = map.getTile(tx + dx, ty + dy);
      if (t?.kind !== "furniture") continue;
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      if (!best || d < best.d) {
        best = { x: tx + dx + 0.5, y: ty + dy + 0.5, d };
      }
    }
  }
  if (best) return { x: best.x, y: best.y, fromFurniture: true };
  return { x: wx, y: wy, fromFurniture: false };
}

/**
 * Intensidad de luz cálida [0,1] según daylight + indoor.
 * Día o outdoor → 0; noche indoor → hasta 1.
 */
export function warmLightIntensity(indoor: boolean, daylight: number): number {
  if (!indoor) return 0;
  // daylight 0.08 noche … 1 mediodía; arranca a ~0.45
  const night = Math.max(0, 1 - daylight / 0.45);
  return Math.min(1, night * night);
}

/**
 * Intensidad warm que lee syncLighting (clock fresco o vivo).
 * Outdoor / día → 0; noche indoor → night².
 */
export function warmLightFromClock(
  indoor: boolean,
  clock: { daylight: number },
): number {
  return warmLightIntensity(indoor, clock.daylight);
}

/**
 * R / softReset: luz cálida del clock fresco (medianoche).
 * leftover noon indoor no filtra. F9 / enterGameOver / freeze no assign.
 */
export function warmLightAfterRestart(indoor: boolean): number {
  return warmLightFromClock(indoor, clockAfterRestart());
}

/** Idle warm origin X. Ctor warmLight position.x 0 + visible false = fresco. Mid-life leftover ≠ 0. */
export const WARM_LIGHT_ORIGIN_X_SPAWN = 0;

/** Idle warm origin Z. Ctor warmLight position.z 0 + visible false = fresco. Mid-life leftover ≠ 0. */
export const WARM_LIGHT_ORIGIN_Z_SPAWN = 0;

/** Idle warm visible. Ctor warmLight.visible false = fresco. Vivo on ≠ boot. */
export const WARM_LIGHT_VISIBLE_SPAWN = false;

/**
 * Origin X que lee syncWarmLight (look fresco o vivo).
 * leftover mid-life / far 40 ≠ fresco (idle 0).
 */
export function warmLightOriginXFromLook(x: number): number {
  return x;
}

/**
 * Origin Z que lee syncWarmLight (look fresco o vivo).
 * leftover mid-life / far 30 ≠ fresco (idle 0).
 */
export function warmLightOriginZFromLook(z: number): number {
  return z;
}

/**
 * Visible que lee syncWarmLight (look fresco o vivo).
 * leftover mid-life on ≠ fresco (idle false).
 */
export function warmLightVisibleFromLook(visible: boolean): boolean {
  return visible;
}

/**
 * R / softReset: origin X fresco (idle 0).
 * WorldView nace warmLight.position.x AfterRestart; leftover mid-life / far no filtra.
 * syncWarmLight lee warmLightOriginXFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function warmLightOriginXAfterRestart(): number {
  return warmLightOriginXFromLook(WARM_LIGHT_ORIGIN_X_SPAWN);
}

/**
 * R / softReset: origin Z fresco (idle 0).
 * WorldView nace warmLight.position.z AfterRestart; leftover mid-life / far no filtra.
 * syncWarmLight lee warmLightOriginZFromLook.
 */
export function warmLightOriginZAfterRestart(): number {
  return warmLightOriginZFromLook(WARM_LIGHT_ORIGIN_Z_SPAWN);
}

/**
 * R / softReset: visible fresco (idle false).
 * WorldView nace warmLight.visible AfterRestart; leftover mid-life on no filtra.
 * syncWarmLight lee warmLightVisibleFromLook.
 */
export function warmLightVisibleAfterRestart(): boolean {
  return warmLightVisibleFromLook(WARM_LIGHT_VISIBLE_SPAWN);
}

/** Idle warm distance. Ctor warmLight.distance 7.5 leftover vs idle BASE 7.475. Mid-life leftover ≠ 7.475. */
export const WARM_LIGHT_DISTANCE_SPAWN = 7.475;

/**
 * Distance que lee syncWarmLight (look fresco o vivo).
 * leftover mid-life / ctor 7.5 ≠ fresco (idle BASE 7.475).
 */
export function warmLightDistanceFromLook(distance: number): number {
  return distance;
}

/**
 * R / softReset: distance fresco (idle BASE 7.475 / intensity-0).
 * WorldView nace warmLight.distance AfterRestart; leftover ctor 7.5 / mid-life no filtra.
 * syncWarmLight lee warmLightDistanceFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function warmLightDistanceAfterRestart(): number {
  return warmLightDistanceFromLook(WARM_LIGHT_DISTANCE_SPAWN);
}

/** Idle warm intensity. Ctor warmLight.intensity 0 = fresco. Vivo on ≠ boot. */
export const WARM_LIGHT_INTENSITY_SPAWN = 0;

/**
 * Intensity que lee syncWarmLight (look fresco o vivo).
 * leftover mid-life on ≠ fresco (idle 0).
 */
export function warmLightIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * R / softReset: intensity fresco (idle 0).
 * WorldView nace warmLight.intensity AfterRestart; leftover mid-life on no filtra.
 * syncWarmLight lee warmLightIntensityFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function warmLightIntensityAfterRestart(): number {
  return warmLightIntensityFromLook(WARM_LIGHT_INTENSITY_SPAWN);
}

/** Idle warm Y. Ctor warmLight.position.y 1.6 leftover vs idle WARM_LIGHT_Y 1.7825. Mid-life leftover ≠ 1.7825. */
export const WARM_LIGHT_Y_SPAWN = 1.7825;

/**
 * Y que lee syncWarmLight (look fresco o vivo).
 * leftover mid-life / ctor 1.6 ≠ fresco (idle 1.7825).
 */
export function warmLightYFromLook(y: number): number {
  return y;
}

/**
 * R / softReset: Y fresco (idle WARM_LIGHT_Y 1.7825).
 * WorldView nace warmLight.position.y AfterRestart; leftover ctor 1.6 / mid-life no filtra.
 * syncWarmLight lee warmLightYFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function warmLightYAfterRestart(): number {
  return warmLightYFromLook(WARM_LIGHT_Y_SPAWN);
}

/** Idle warm color G. Ctor warmLight.color hex 0xffca81 leftover vs idle AMBER_G 0.759. Mid-life leftover ≠ 0.759. */
export const WARM_LIGHT_COLOR_G_SPAWN = 0.759;

/** Idle warm color B. Ctor warmLight.color hex 0xffca81 leftover vs idle AMBER_B 0.437. Mid-life leftover ≠ 0.437. */
export const WARM_LIGHT_COLOR_B_SPAWN = 0.437;

/**
 * Color G que lee syncWarmLight (look fresco o vivo).
 * leftover mid-life / ctor 0xffca81 ≠ fresco (idle 0.759).
 */
export function warmLightColorGFromLook(g: number): number {
  return g;
}

/**
 * Color B que lee syncWarmLight (look fresco o vivo).
 * leftover mid-life / ctor 0xffca81 ≠ fresco (idle 0.437).
 */
export function warmLightColorBFromLook(b: number): number {
  return b;
}

/**
 * R / softReset: color G fresco (idle AMBER_G 0.759).
 * WorldView nace warmLight.color.g AfterRestart; leftover ctor 0xffca81 / mid-life no filtra.
 * syncWarmLight lee warmLightColorGFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function warmLightColorGAfterRestart(): number {
  return warmLightColorGFromLook(WARM_LIGHT_COLOR_G_SPAWN);
}

/**
 * R / softReset: color B fresco (idle AMBER_B 0.437).
 * WorldView nace warmLight.color.b AfterRestart; leftover ctor 0xffca81 / mid-life no filtra.
 * syncWarmLight lee warmLightColorBFromLook.
 * F9 / enterGameOver / freeze death no assign.
 */
export function warmLightColorBAfterRestart(): number {
  return warmLightColorBFromLook(WARM_LIGHT_COLOR_B_SPAWN);
}
