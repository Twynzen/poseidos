/**
 * Streaks de lluvia (headless, sin Three).
 * worldView aplica BoxGeometry + MeshBasicMaterial; aquí solo knobs + look.
 * WeatherSystem no cambia: intensity / isRaining siguen siendo la sim.
 */

/** Cap de streaks en el pool (era 36). */
export const RAIN_COUNT = 41;

/** Ancho XZ del streak (tiles). */
export const RAIN_STREAK_WIDTH = 0.043125;

/** Largo Y de día (tiles). Geo base. */
export const RAIN_STREAK_LENGTH_DAY = 0.6325;

/** Largo Y de noche (tiles). worldView aplica scaleY. */
export const RAIN_STREAK_LENGTH_NIGHT = 1.09503;

/** Opacidad base (día). */
export const RAIN_OPACITY_BASE = 0.29095;

/** Ganancia de opacidad × intensity. */
export const RAIN_OPACITY_GAIN = 0.595125;

/** Extra de opacidad de noche × nightMix. */
export const RAIN_OPACITY_NIGHT_ADD = 0.39675;

/** Mínimo de streaks activos si visible (era 6). */
export const RAIN_ACTIVE_MIN = 7;

/** Recorte de count de noche (1 − cut × nightMix). */
export const RAIN_NIGHT_COUNT_CUT = 0.191;

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

/** scaleY sobre geo de largo día. Día = 1; noche d=0 → 1.09503/0.6325. */
export function rainStreakScaleY(daylight: number): number {
  return rainStreakLength(daylight) / RAIN_STREAK_LENGTH_DAY;
}

/** ¿Grupo oculto? Mismo umbral que syncRain (intensity ≤ RAIN_HIDE_BELOW). */
export function rainStreaksHidden(intensity: number): boolean {
  return !Number.isFinite(intensity) || intensity <= RAIN_HIDE_BELOW;
}

/** Opacidad: 0.29095 + i×0.595125; noche suma +0.39675 × nightMix. */
export function rainStreakOpacity(intensity: number, daylight: number): number {
  const i = clamp01(intensity);
  return (
    RAIN_OPACITY_BASE +
    i * RAIN_OPACITY_GAIN +
    RAIN_OPACITY_NIGHT_ADD * rainNightMix(daylight)
  );
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
