/**
 * Sleep / safehouse mínimo (F2) + camas (cama-item).
 * Tecla Z: si indoor y sin hostiles cercanos → baja cansancio y avanza el reloj.
 * Cerca de cama → descanso pleno; indoor sin cama → “siesta de suelo” más débil.
 * Headless — sin Three / DOM.
 */

import type { NeedsState } from "./needs";
import { rest } from "./needs";
import type { GameClock } from "../core/clock";
import type { TileMap } from "../world/tilemap";
import { isIndoor, warmLightAnchor } from "../world/indoor";
import { isBedTile } from "../world/tile";

/** Radio Chebyshev: hostil más cerca → no se puede dormir. */
export const SLEEP_HOSTILE_RADIUS = 6;

/** Radio Chebyshev para detectar cama cercana. */
export const BED_RADIUS = 1;

/** Horas de ciclo día/noche con cama (~7h de 24). */
export const SLEEP_HOURS = 7;

/** Baja cansancio con cama (clamp a 0). */
export const SLEEP_FATIGUE_RELIEF = 60;

/** Siesta en suelo indoor (sin cama): menos relief / menos horas. */
export const SLEEP_FLOOR_HOURS = 4;
export const SLEEP_FLOOR_FATIGUE_RELIEF = 30;

/**
 * Umbral de cansancio para “sugerir” dormir.
 * Con Z (confirmación) se permite siempre si indoor + sin amenaza.
 */
export const SLEEP_FATIGUE_HINT = 40;

export type SleepFailReason = "outdoor" | "hostile" | "dead";

export type SleepResult =
  | {
      ok: true;
      message: string;
      hours: number;
      elapsedBefore: number;
      elapsedAfter: number;
      fatigueBefore: number;
      fatigueAfter: number;
      /** true si había cama en radio BED_RADIUS. */
      onBed: boolean;
    }
  | {
      ok: false;
      reason: SleepFailReason;
      message: string;
    };

export interface HostilePos {
  x: number;
  y: number;
  health?: number;
}

/** ¿Hay hostil vivo en radio Chebyshev < radius? */
export function hostileNearby(
  hostiles: readonly HostilePos[],
  wx: number,
  wy: number,
  radius: number = SLEEP_HOSTILE_RADIUS,
): boolean {
  for (const h of hostiles) {
    if (h.health !== undefined && h.health <= 0) continue;
    const d = Math.max(Math.abs(h.x - wx), Math.abs(h.y - wy));
    if (d < radius) return true;
  }
  return false;
}

/**
 * ¿Hay tile cama en radio Chebyshev (default BED_RADIUS=1)?
 */
export function nearBed(
  map: TileMap,
  wx: number,
  wy: number,
  radius: number = BED_RADIUS,
): boolean {
  const tx = Math.floor(wx);
  const ty = Math.floor(wy);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (isBedTile(map.getTile(tx + dx, ty + dy))) return true;
    }
  }
  return false;
}

/**
 * Hint HUD: furniture cercano o cama cuenta como safehouse.
 */
export function isSafehouseHint(map: TileMap, wx: number, wy: number): boolean {
  if (!isIndoor(map, wx, wy)) return false;
  if (nearBed(map, wx, wy)) return true;
  return warmLightAnchor(map, wx, wy).fromFurniture;
}

/** Etiqueta corta según fase del día [0,1). */
export function sleepWakeLabel(phase: number): string {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.18 || p >= 0.88) return "la madrugada";
  if (p < 0.32) return "el amanecer";
  if (p < 0.45) return "la mañana";
  if (p < 0.58) return "el mediodía";
  if (p < 0.72) return "la tarde";
  return "la noche";
}

/**
 * Intento de dormir (confirmación Z).
 * Mutates needs + clock si ok.
 * Indoor sin cama = siesta de suelo (más débil); con cama = descanso pleno.
 * No hay fail "no_bed" — el suelo indoor sigue permitido.
 */
export function trySleep(
  needs: NeedsState,
  clock: GameClock,
  map: TileMap,
  wx: number,
  wy: number,
  hostiles: readonly HostilePos[],
  opts?: { alive?: boolean; hours?: number; fatigueRelief?: number },
): SleepResult {
  if (opts?.alive === false) {
    return { ok: false, reason: "dead", message: "no puedes dormir aquí" };
  }
  if (!isIndoor(map, wx, wy)) {
    return { ok: false, reason: "outdoor", message: "no puedes dormir aquí" };
  }
  if (hostileNearby(hostiles, wx, wy, SLEEP_HOSTILE_RADIUS)) {
    return {
      ok: false,
      reason: "hostile",
      message: "no puedes dormir aquí (amenaza cerca)",
    };
  }

  const onBed = nearBed(map, wx, wy);
  const hours =
    opts?.hours ?? (onBed ? SLEEP_HOURS : SLEEP_FLOOR_HOURS);
  const relief =
    opts?.fatigueRelief ??
    (onBed ? SLEEP_FATIGUE_RELIEF : SLEEP_FLOOR_FATIGUE_RELIEF);
  const fatigueBefore = needs.fatigue;
  const elapsedBefore = clock.elapsed;

  rest(needs, relief);
  const advanceSec = (hours / 24) * clock.dayLengthSec;
  clock.advance(advanceSec);

  const label = sleepWakeLabel(clock.phase);
  const place = onBed ? "en la cama" : "en el suelo";
  return {
    ok: true,
    message: `dormiste ${place} hasta ${label}`,
    hours,
    elapsedBefore,
    elapsedAfter: clock.elapsed,
    fatigueBefore,
    fatigueAfter: needs.fatigue,
    onBed,
  };
}

/**
 * HAS MUERTO / F9 load-muerto: Z no aplica (se drena, no duerme).
 * Vivo (incl. F9 load-vivo): indoor / cama / suelo, igual que hoy.
 * No cambia reglas de safehouse ni toast; solo gate de input.
 */
export function sleepInputApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/**
 * HAS MUERTO / F9 load-muerto: no llama apply (needs / reloj iguales).
 * Vivo + wants → apply(). !wants → null.
 */
export function applySleepInput<T>(
  gameOver: boolean,
  wants: boolean,
  apply: () => T | null,
): T | null {
  if (!sleepInputApplies(gameOver) || !wants) return null;
  return apply();
}
