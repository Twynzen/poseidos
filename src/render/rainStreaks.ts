/**
 * Streaks de lluvia (headless, sin Three).
 * worldView aplica BoxGeometry + MeshBasicMaterial; aquí solo knobs + look.
 * WeatherSystem no cambia: intensity / isRaining siguen siendo la sim.
 */

/** Cap de streaks en el pool (era 36). */
export const RAIN_COUNT = 47;

/** Ancho XZ del streak (tiles). */
export const RAIN_STREAK_WIDTH = 0.04959375;

/** Largo Y de día (tiles). Geo base. */
export const RAIN_STREAK_LENGTH_DAY = 0.727375;

/** Largo Y de noche (tiles). worldView aplica scaleY. */
export const RAIN_STREAK_LENGTH_NIGHT = 1.09503;

/** Opacidad base (día). */
export const RAIN_OPACITY_BASE = 0.3345925;

/** Ganancia de opacidad × intensity. */
export const RAIN_OPACITY_GAIN = 0.68439375;

/** Extra de opacidad de noche × nightMix. */
export const RAIN_OPACITY_NIGHT_ADD = 0.39675;

/** Mínimo de streaks activos si visible (era 6). */
export const RAIN_ACTIVE_MIN = 8;

/** Recorte de count de noche (1 − cut × nightMix). */
export const RAIN_NIGHT_COUNT_CUT = 0.16617;

/** Color unlit (azul-gris). */
export const RAIN_COLOR = 0xdeffff;

/** Hide si intensity ≤ este umbral. */
export const RAIN_HIDE_BELOW = 0.0174;

/** Fracción de count por intensity (histórico). */
export const RAIN_ACTIVE_BASE = 0.4025;

/** Ganancia de count × intensity. */
export const RAIN_ACTIVE_GAIN = 0.7475;

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

/** nightMix = 1 − daylight. Medianoche GameClock ~0.92; noon 0. */
export function rainNightMix(daylight: number): number {
  return 1 - clamp01(daylight);
}

/** Largo Y interpolado día→noche. */
export function rainStreakLength(daylight: number): number {
  const n = rainNightMix(daylight);
  return (
    RAIN_STREAK_LENGTH_DAY +
    (RAIN_STREAK_LENGTH_NIGHT - RAIN_STREAK_LENGTH_DAY) * n
  );
}

/** scaleY sobre geo de largo día. Día = 1; noche d=0 → 1.09503/0.727375. */
export function rainStreakScaleY(daylight: number): number {
  return rainStreakLength(daylight) / RAIN_STREAK_LENGTH_DAY;
}

/**
 * HAS MUERTO / F9 load-muerto: no avanzar caída ni drift de streaks.
 * Vivo (incl. F9 load-vivo): dt/animación de hoy.
 * No esconde el clima; solo gate de dt. gameOver no inventa hide.
 */
export function rainVisualApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/**
 * Avanza Y del streak si aplica; gameOver no muta (congela caída).
 * dt no finito / ≤0 no avanza (igual que un tick vacío).
 */
export function tickRainStreakY(
  y: number,
  vy: number,
  dt: number,
  intensity = 1,
  gameOver = false,
): number {
  if (!rainVisualApplies(gameOver)) return y;
  if (!Number.isFinite(dt) || dt <= 0) return y;
  const i = clamp01(intensity);
  return y - vy * dt * (0.7 + i * 0.5);
}

/**
 * Y de spawn que lee WorldView al nacer (phase fresco [0,1]).
 * leftover Y de la vida anterior ≠ spawn fresco.
 */
export function rainStreakYFromPhase(phase: number): number {
  return 2 + clamp01(phase) * 6;
}

/**
 * R / softReset: Y de caída fresca (spawn).
 * WorldView nace con rainStreakYFromPhase; leftover mid-fall no filtra.
 * F9 / enterGameOver / freeze death no assign — view.dispose + createWorldView.
 */
export function rainStreakYAfterRestart(phase = 0): number {
  return rainStreakYFromPhase(phase);
}

/**
 * Y que lee syncRain (caída fresca o viva).
 */
export function rainStreakYFromFall(
  y: number,
  vy: number,
  dt: number,
  intensity = 1,
  gameOver = false,
): number {
  return tickRainStreakY(y, vy, dt, intensity, gameOver);
}

/**
 * Drift X del streak si aplica; gameOver no muta (congela viento).
 * dt no finito / ≤0 no avanza.
 */
export function tickRainStreakVx(
  vx: number,
  dt: number,
  gameOver = false,
): number {
  if (!rainVisualApplies(gameOver)) return vx;
  if (!Number.isFinite(dt) || dt <= 0) return vx;
  return vx + dt * 0.4;
}

/**
 * vx de spawn que lee WorldView al nacer (phase fresco [0,1]).
 * leftover mid-drift de la vida anterior ≠ spawn fresco ([-7, 7]).
 */
export function rainStreakVxFromPhase(phase: number): number {
  return (clamp01(phase) - 0.5) * 14;
}

/**
 * R / softReset: vx de viento fresco (spawn).
 * WorldView nace con rainStreakVxFromPhase; leftover mid-drift no filtra.
 * F9 / enterGameOver / freeze death no assign — view.dispose + createWorldView.
 */
export function rainStreakVxAfterRestart(phase = 0): number {
  return rainStreakVxFromPhase(phase);
}

/**
 * vx que lee syncRain (viento fresco o vivo).
 */
export function rainStreakVxFromDrift(
  vx: number,
  dt: number,
  gameOver = false,
): number {
  return tickRainStreakVx(vx, dt, gameOver);
}

/**
 * vy de spawn que lee WorldView al nacer (phase fresco [0,1]).
 * leftover mid-life speed de la vida anterior ≠ spawn fresco ([9, 15]).
 */
export function rainStreakVyFromPhase(phase: number): number {
  return 9 + clamp01(phase) * 6;
}

/**
 * R / softReset: vy de speed fresco (spawn).
 * WorldView nace con rainStreakVyFromPhase; leftover mid-life no filtra.
 * F9 / enterGameOver / freeze death no assign — view.dispose + createWorldView.
 */
export function rainStreakVyAfterRestart(phase = 0): number {
  return rainStreakVyFromPhase(phase);
}

/**
 * vy que lee syncRain (speed fresco o vivo).
 * vy no muta mid-life; leftover de la vida anterior muere con dispose.
 */
export function rainStreakVyFromSpeed(vy: number): number {
  return vy;
}

/**
 * vz de spawn que lee WorldView al nacer (phase fresco [0,1]).
 * leftover mid-life Z de la vida anterior ≠ spawn fresco ([-7, 7]).
 */
export function rainStreakVzFromPhase(phase: number): number {
  return (clamp01(phase) - 0.5) * 14;
}

/**
 * R / softReset: vz de deriva Z fresca (spawn).
 * WorldView nace con rainStreakVzFromPhase; leftover mid-life no filtra.
 * F9 / enterGameOver / freeze death no assign — view.dispose + createWorldView.
 */
export function rainStreakVzAfterRestart(phase = 0): number {
  return rainStreakVzFromPhase(phase);
}

/**
 * vz que lee syncRain (deriva Z fresca o viva).
 * vz no muta mid-life; leftover de la vida anterior muere con dispose.
 */
export function rainStreakVzFromZ(vz: number): number {
  return vz;
}

/** Floor Y: wrap/respawn si la racha cae debajo (era 0.15). */
export const RAIN_WRAP_BELOW = 0.15;

/**
 * ¿Wrap/respawn mid-fall? leftover Y < 0.15 de la vida anterior ≠ spawn fresco ([2, 8]).
 */
export function rainStreakNeedsWrap(y: number): boolean {
  if (!Number.isFinite(y)) return false;
  return y < RAIN_WRAP_BELOW;
}

/**
 * Y de wrap/respawn mid-fall (phase fresco [0,1]).
 * leftover wrap [2.2, 7.7] ≠ spawn fresco ([2, 8]).
 */
export function rainStreakYFromWrap(phase: number): number {
  return 2.2 + clamp01(phase) * 5.5;
}

/**
 * R / softReset: wrap/respawn fresco (no leftover mid-fall wrap).
 * WorldView nace con rainStreakYAfterRestart (spawn); leftover wrap no filtra.
 * Wrap mid-life lee rainStreakYFromWrap. F9 / enterGameOver / freeze death no assign.
 */
export function rainStreakYWrapAfterRestart(phase = 0): number {
  return rainStreakYFromWrap(phase);
}

/** ¿Grupo oculto? Mismo umbral que syncRain (intensity ≤ RAIN_HIDE_BELOW). */
export function rainStreaksHidden(intensity: number): boolean {
  return !Number.isFinite(intensity) || intensity <= RAIN_HIDE_BELOW;
}

/** Opacidad: 0.3345925 + i×0.68439375; noche suma +0.39675 × nightMix. */
export function rainStreakOpacity(intensity: number, daylight: number): number {
  const i = clamp01(intensity);
  return (
    RAIN_OPACITY_BASE +
    i * RAIN_OPACITY_GAIN +
    RAIN_OPACITY_NIGHT_ADD * rainNightMix(daylight)
  );
}

/**
 * Opacity de look que lee syncRain (intensity + daylight fresco o vivo).
 * leftover mid-life (storm noon / ctor 0.45) ≠ look fresco (drizzle medianoche).
 */
export function rainStreakOpacityFromLook(
  intensity: number,
  daylight: number,
): number {
  return rainStreakOpacity(intensity, daylight);
}

/**
 * R / softReset: opacity de look fresco (drizzle 0.4 + medianoche 0.08).
 * WorldView nace con rainStreakOpacityAfterRestart; leftover mid-life no filtra.
 * syncRain lee rainStreakOpacityFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function rainStreakOpacityAfterRestart(
  intensity = 0.4,
  daylight = 0.08,
): number {
  return rainStreakOpacityFromLook(intensity, daylight);
}

/**
 * Streaks activos: max(min, floor(COUNT × (0.4025 + i×0.7475) × (1 − cut×nightMix))).
 */
export function rainActiveCount(intensity: number, daylight: number): number {
  const i = clamp01(intensity);
  const nightCut = 1 - RAIN_NIGHT_COUNT_CUT * rainNightMix(daylight);
  return Math.max(
    RAIN_ACTIVE_MIN,
    Math.floor(RAIN_COUNT * (RAIN_ACTIVE_BASE + i * RAIN_ACTIVE_GAIN) * nightCut),
  );
}
