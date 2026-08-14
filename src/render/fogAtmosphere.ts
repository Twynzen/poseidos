/**
 * Atmósfera fog / cielo / luces día-noche (headless, sin Three).
 * Idea little-landscapes: distance fog + tinte según hora.
 *
 * `phase` en [0, 1) como GameClock:
 *   0    = medianoche
 *   0.25 = amanecer (sol en horizonte)
 *   0.5  = mediodía
 *   0.75 = atardecer
 *
 * Bandas de tinte cálido (además de `daylight`):
 *   Amanecer: phase ~0.20–0.35 (pico ~0.275)
 *   Atardecer: phase ~0.65–0.80 (pico ~0.725)
 *
 * Fuera de esas bandas, el look lo marca sobre todo `daylight`
 * (noche azul/violeta, día cielo frío claro).
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface FogNearFar {
  near: number;
  far: number;
}

export interface FogAtmosphere {
  near: number;
  far: number;
  sky: Rgb;
  ambient: Rgb;
  sun: Rgb;
}

/** Peso triangular en [start, end]; 0 fuera. */
export function bandWeight(phase: number, start: number, end: number): number {
  if (phase <= start || phase >= end) return 0;
  const mid = (start + end) * 0.5;
  const half = (end - start) * 0.5;
  if (half <= 0) return 0;
  return Math.max(0, 1 - Math.abs(phase - mid) / half);
}

/** Peso amanecer [0,1] en banda 0.20–0.35. */
export function dawnWarmth(phase: number): number {
  return bandWeight(phase, 0.2, 0.35);
}

/** Peso atardecer [0,1] en banda 0.65–0.80. */
export function duskWarmth(phase: number): number {
  return bandWeight(phase, 0.65, 0.8);
}

/**
 * Near/far del Fog de distancia.
 * Noche: fog más cerca (horizonte corto). Día: abre el horizonte.
 * Curva cercana a la histórica (22+16d / 52+48d), ligeramente retocada.
 */
export function fogNearFar(daylight: number): FogNearFar {
  const d = clamp01(daylight);
  const near = 20 + d * 18;
  const far = 50 + d * 50;
  return { near, far };
}

/**
 * Color de cielo / fog (0..1).
 * Noche oscura azul-violeta; dawn naranja/rosa; día frío claro; dusk ámbar/rojo.
 */
export function skyRgb(phase: number, daylight: number): Rgb {
  const d = clamp01(daylight);
  const p = wrap01(phase);
  const dawn = dawnWarmth(p);
  const dusk = duskWarmth(p);

  // Base: noche azul-violeta → día cielo frío más claro.
  const base: Rgb = {
    r: 0.04 + d * 0.22,
    g: 0.05 + d * 0.28,
    b: 0.09 + d * 0.38,
  };

  // Amanecer: naranja / rosa suave.
  const dawnTint: Rgb = { r: 0.72, g: 0.38, b: 0.28 };
  // Atardecer: ámbar / rojo suave.
  const duskTint: Rgb = { r: 0.78, g: 0.32, b: 0.18 };

  const warm = Math.max(dawn, dusk);
  const tint = dawn >= dusk ? dawnTint : duskTint;
  // Mezcla acotada para no lavar el cielo.
  const w = warm * (0.35 + (1 - d) * 0.25);

  return clampRgb({
    r: base.r * (1 - w) + tint.r * w,
    g: base.g * (1 - w) + tint.g * w,
    b: base.b * (1 - w) + tint.b * w,
  });
}

/** Ambient coherente con cielo (más suave, menos saturado). */
export function ambientRgb(daylight: number, phase: number): Rgb {
  const d = clamp01(daylight);
  const p = wrap01(phase);
  const dawn = dawnWarmth(p);
  const dusk = duskWarmth(p);
  const warm = Math.max(dawn, dusk);

  // Histórico: noche más azul; día gris-lila.
  const nightMix = 1 - d;
  let r = 0x6a / 255 - nightMix * 0.18;
  let g = 0x6a / 255 - nightMix * 0.06;
  let b = 0x78 / 255 + nightMix * 0.14;

  // Toque cálido en dawn/dusk (sin tocar warm indoor).
  const warmPush = warm * 0.12;
  r += warmPush * 0.2;
  g += warmPush * 0.05;
  b -= warmPush * 0.08;

  return clampRgb({ r, g, b });
}

/** Color del sol / directional: día cálido suave; noche frío; dawn/dusk ámbar. */
export function sunRgb(daylight: number, phase: number): Rgb {
  const d = clamp01(daylight);
  const p = wrap01(phase);
  const dawn = dawnWarmth(p);
  const dusk = duskWarmth(p);
  const warm = Math.max(dawn, dusk);
  const nightMix = 1 - d;

  let r = 0.91 - nightMix * 0.15;
  let g = 0.88 - nightMix * 0.2;
  let b = 0.82 + nightMix * 0.12;

  // Dawn/dusk: más ámbar en el sol.
  r += warm * 0.12;
  g += warm * 0.02;
  b -= warm * 0.14;

  return clampRgb({ r, g, b });
}

/**
 * Intensidad AmbientLight / DirectionalLight (headless).
 * Floor de noche más alto para que albedo survivor/possessed/mute se lea;
 * pico de mediodía igual que el histórico (0.70 / 1.20).
 */
export const AMBIENT_INTENSITY_NIGHT = 0.24;
export const AMBIENT_INTENSITY_GAIN = 0.46;
export const SUN_INTENSITY_NIGHT = 0.16;
export const SUN_INTENSITY_GAIN = 1.04;

/** Ambient: 0.24 + d * 0.46 (noche ~0.277 @ d=0.08; noon 0.70). */
export function nightAmbientIntensity(daylight: number): number {
  return AMBIENT_INTENSITY_NIGHT + clamp01(daylight) * AMBIENT_INTENSITY_GAIN;
}

/** Sol: 0.16 + d * 1.04 (noche ~0.243 @ d=0.08; noon 1.20). */
export function nightSunIntensity(daylight: number): number {
  return SUN_INTENSITY_NIGHT + clamp01(daylight) * SUN_INTENSITY_GAIN;
}

/** Snapshot completo para syncDayNight. */
export function atmosphereFor(phase: number, daylight: number): FogAtmosphere {
  const { near, far } = fogNearFar(daylight);
  return {
    near,
    far,
    sky: skyRgb(phase, daylight),
    ambient: ambientRgb(daylight, phase),
    sun: sunRgb(daylight, phase),
  };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function wrap01(phase: number): number {
  if (!Number.isFinite(phase)) return 0;
  const t = phase % 1;
  return t < 0 ? t + 1 : t;
}

function clampRgb(c: Rgb): Rgb {
  return {
    r: clamp01(c.r),
    g: clamp01(c.g),
    b: clamp01(c.b),
  };
}
