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

import { clockAfterRestart } from "../core/clock";

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
 * Noche un poco más fina (near 30.4175 = 26.45 × 1.15 / far 78.0275 = 67.85 × 1.15) para que tiles y personajes se lean;
 * día near un poco más lejos (43.7 = 38 × 1.15) y far un poco más lejos (115 = 100 × 1.15) para que la escena se lea.
 */
export const FOG_NEAR_NIGHT = 30.4175;
export const FOG_NEAR_DAY = 43.7;
export const FOG_FAR_NIGHT = 78.0275;
export const FOG_FAR_DAY = 115;

export function fogNearFar(daylight: number): FogNearFar {
  const d = clamp01(daylight);
  const near = FOG_NEAR_NIGHT + d * (FOG_NEAR_DAY - FOG_NEAR_NIGHT);
  const far = FOG_FAR_NIGHT + d * (FOG_FAR_DAY - FOG_FAR_NIGHT);
  return { near, far };
}

/**
 * Color de cielo / fog (0..1).
 * Noche azul-gris un poco más clara (r 0.092575 = 0.0805 × 1.15; g 0.119025 = 0.1035 × 1.15; b 0.18515 = 0.161 × 1.15)
 * para que el horizonte se lea; día r un poco más claro (r 0.299 = 0.26 × 1.15), g un poco más brillante (g 0.3795 = 0.33 × 1.15) y b un poco más brillante (b 0.5405 = 0.47 × 1.15).
 * Dawn naranja/rosa un poco más cálido (r 0.828 = 0.72 × 1.15; g 0.437 = 0.38 × 1.15; b 0.322 = 0.28 × 1.15); dusk ámbar/rojo un poco más cálido (r 0.897 = 0.78 × 1.15; g 0.368 = 0.32 × 1.15; b 0.207 = 0.18 × 1.15).
 * Mezcla cálida un poco más fuerte (SKY_WARM_MIX 0.4025 = 0.35 × 1.15) para que sunrise/sunset se lean.
 * Extra nocturno un poco más fuerte (SKY_WARM_NIGHT_ADD 0.2875 = 0.25 × 1.15) para que dawn/dusk se lean de noche.
 */
export const SKY_NIGHT: Rgb = { r: 0.092575, g: 0.119025, b: 0.18515 };
export const SKY_DAY: Rgb = { r: 0.299, g: 0.3795, b: 0.5405 };
/** Canal r del tinte amanecer (0.72 × 1.15) para que el sunrise se lea. */
export const DAWN_TINT_R = 0.828;
/** Canal g del tinte amanecer (0.38 × 1.15) para que el sunrise se lea. */
export const DAWN_TINT_G = 0.437;
/** Canal b del tinte amanecer (0.28 × 1.15) para que el sunrise se lea. */
export const DAWN_TINT_B = 0.322;
/** Canal r del tinte atardecer (0.78 × 1.15) para que el sunset se lea. */
export const DUSK_TINT_R = 0.897;
/** Canal g del tinte atardecer (0.32 × 1.15) para que el sunset se lea. */
export const DUSK_TINT_G = 0.368;
/** Canal b del tinte atardecer (0.18 × 1.15) para que el sunset se lea. */
export const DUSK_TINT_B = 0.207;
/** Mezcla cálida base del cielo (0.35 × 1.15) para que sunrise/sunset se lean. */
export const SKY_WARM_MIX = 0.4025;
/** Extra de mezcla cálida de noche (0.25 × 1.15) para que dawn/dusk se lean. */
export const SKY_WARM_NIGHT_ADD = 0.2875;

export function skyRgb(phase: number, daylight: number): Rgb {
  const d = clamp01(daylight);
  const p = wrap01(phase);
  const dawn = dawnWarmth(p);
  const dusk = duskWarmth(p);

  // Base: noche azul-gris → día cielo frío más claro (día r/g/b un poco más brillante).
  const base: Rgb = {
    r: SKY_NIGHT.r + d * (SKY_DAY.r - SKY_NIGHT.r),
    g: SKY_NIGHT.g + d * (SKY_DAY.g - SKY_NIGHT.g),
    b: SKY_NIGHT.b + d * (SKY_DAY.b - SKY_NIGHT.b),
  };

  // Amanecer: naranja / rosa suave.
  const dawnTint: Rgb = { r: DAWN_TINT_R, g: DAWN_TINT_G, b: DAWN_TINT_B };
  // Atardecer: ámbar / rojo suave.
  const duskTint: Rgb = { r: DUSK_TINT_R, g: DUSK_TINT_G, b: DUSK_TINT_B };

  const warm = Math.max(dawn, dusk);
  const tint = dawn >= dusk ? dawnTint : duskTint;
  // Mezcla acotada para no lavar el cielo.
  const w = warm * (SKY_WARM_MIX + (1 - d) * SKY_WARM_NIGHT_ADD);

  return clampRgb({
    r: base.r * (1 - w) + tint.r * w,
    g: base.g * (1 - w) + tint.g * w,
    b: base.b * (1 - w) + tint.b * w,
  });
}

/** Subtract r del ambient de noche (0.18 × 0.87) para que el ambient se lea más cálido. */
export const AMBIENT_NIGHT_R_SUB = 0.1566;

/** Subtract g del ambient de noche (0.06 × 0.87) para que el ambient se lea. */
export const AMBIENT_NIGHT_G_SUB = 0.0522;

/** Add b del ambient de noche (0.14 × 1.15) para que el ambient se lea más azul. */
export const AMBIENT_NIGHT_B_ADD = 0.161;

/** Toque cálido dawn/dusk del ambient (0.12 × 1.15) para que sunrise/sunset se lean. */
export const AMBIENT_WARM_PUSH = 0.138;

/** Add r cálido dawn/dusk del ambient (0.2 × 1.15) para que sunrise/sunset se lean. */
export const AMBIENT_WARM_R = 0.23;

/** Add g cálido dawn/dusk del ambient (0.05 × 1.15) para que sunrise/sunset se lean. */
export const AMBIENT_WARM_G = 0.0575;

/** Subtract b cálido dawn/dusk del ambient (0.08 × 1.15) para que sunrise/sunset se lean. */
export const AMBIENT_WARM_B = 0.092;

/** Canal r del ambient de día (0x6a/255 × 1.15) para que el ambient se lea más brillante. */
export const AMBIENT_DAY_R = (0x6a / 255) * 1.15;

/** Canal g del ambient de día (0x6a/255 × 1.15) para que el ambient se lea más brillante. */
export const AMBIENT_DAY_G = (0x6a / 255) * 1.15;

/** Canal b del ambient de día (0x78/255 × 1.15) para que el ambient se lea más brillante. */
export const AMBIENT_DAY_B = (0x78 / 255) * 1.15;

/** Ambient coherente con cielo (más suave, menos saturado). */
export function ambientRgb(daylight: number, phase: number): Rgb {
  const d = clamp01(daylight);
  const p = wrap01(phase);
  const dawn = dawnWarmth(p);
  const dusk = duskWarmth(p);
  const warm = Math.max(dawn, dusk);

  // Histórico: noche más azul; día gris-lila.
  const nightMix = 1 - d;
  let r = AMBIENT_DAY_R - nightMix * AMBIENT_NIGHT_R_SUB;
  let g = AMBIENT_DAY_G - nightMix * AMBIENT_NIGHT_G_SUB;
  let b = AMBIENT_DAY_B + nightMix * AMBIENT_NIGHT_B_ADD;

  // Toque cálido en dawn/dusk (sin tocar warm indoor).
  const warmPush = warm * AMBIENT_WARM_PUSH;
  r += warmPush * AMBIENT_WARM_R;
  g += warmPush * AMBIENT_WARM_G;
  b -= warmPush * AMBIENT_WARM_B;

  return clampRgb({ r, g, b });
}

/** Subtract r del sol de noche (0.15 × 0.87) para que el sol se lea más cálido. */
export const SUN_NIGHT_R_SUB = 0.1305;

/** Subtract g del sol de noche (0.2 × 0.87) para que el sol se lea. */
export const SUN_NIGHT_G_SUB = 0.174;

/** Add b del sol de noche (0.12 × 1.15) para que el sol se lea más azul. */
export const SUN_NIGHT_B_ADD = 0.138;

/** Add r cálido dawn/dusk del sol (0.12 × 1.15) para que sunrise/sunset se lean. */
export const SUN_WARM_R = 0.138;

/** Add g cálido dawn/dusk del sol (0.02 × 1.15) para que sunrise/sunset se lean. */
export const SUN_WARM_G = 0.023;

/** Subtract b cálido dawn/dusk del sol (0.14 × 1.15) para que sunrise/sunset se lean. */
export const SUN_WARM_B = 0.161;

/** Canal r del sol de día (0.91 × 1.15) para que el sol se lea más brillante. */
export const SUN_DAY_R = 0.91 * 1.15;

/** Canal g del sol de día (0.88 × 1.15) para que el sol se lea más brillante. */
export const SUN_DAY_G = 0.88 * 1.15;

/** Canal b del sol de día (0.82 × 1.15) para que el sol se lea más brillante. */
export const SUN_DAY_B = 0.82 * 1.15;

/** Color del sol / directional: día cálido suave; noche frío; dawn/dusk ámbar. */
export function sunRgb(daylight: number, phase: number): Rgb {
  const d = clamp01(daylight);
  const p = wrap01(phase);
  const dawn = dawnWarmth(p);
  const dusk = duskWarmth(p);
  const warm = Math.max(dawn, dusk);
  const nightMix = 1 - d;

  let r = SUN_DAY_R - nightMix * SUN_NIGHT_R_SUB;
  let g = SUN_DAY_G - nightMix * SUN_NIGHT_G_SUB;
  let b = SUN_DAY_B + nightMix * SUN_NIGHT_B_ADD;

  // Dawn/dusk: más ámbar en el sol.
  r += warm * SUN_WARM_R;
  g += warm * SUN_WARM_G;
  b -= warm * SUN_WARM_B;

  return clampRgb({ r, g, b });
}

/**
 * Intensidad AmbientLight / DirectionalLight (headless).
 * Floor de noche más alto para que albedo survivor/possessed/mute se lea;
 * floor de sol (0.2116 = 0.184 × 1.15) un poco más alto para que noche se lea;
 * gain de ambient un poco más fuerte (0.60835 = 0.529 × 1.15) para que noon se lea;
 * gain de sol un poco más fuerte (1.3754 = 1.196 × 1.15) para que noon se lea;
 * floor ambient (0.3174) sin cambio (noon 0.92575 / 1.587).
 */
export const AMBIENT_INTENSITY_NIGHT = 0.3174;
export const AMBIENT_INTENSITY_GAIN = 0.60835;
export const SUN_INTENSITY_NIGHT = 0.2116;
export const SUN_INTENSITY_GAIN = 1.3754;

/** Ambient: 0.3174 + d * 0.60835 (noche ~0.366 @ d=0.08; noon 0.92575). */
export function nightAmbientIntensity(daylight: number): number {
  return AMBIENT_INTENSITY_NIGHT + clamp01(daylight) * AMBIENT_INTENSITY_GAIN;
}

/** Sol: 0.2116 + d * 1.3754 (noche ~0.322 @ d=0.08; noon 1.587). */
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

/**
 * Snapshot sky/fog/ambient/sun que lee syncDayNight (clock fresco o vivo).
 * Weather no tintea cielo — leftover storm es leftover clock, no rain 0.85.
 */
export function atmosphereFromClock(clock: {
  phase: number;
  daylight: number;
}): FogAtmosphere {
  return atmosphereFor(clock.phase, clock.daylight);
}

/**
 * R / softReset: atmósfera del clock fresco (medianoche, daylight 0.08).
 * leftover noon (d=1 / lastDaylight ctor) / dusk no filtra.
 * F9 / enterGameOver / freeze death no assign — leen this.clock al pintar.
 */
export function atmosphereAfterRestart(): FogAtmosphere {
  return atmosphereFromClock(clockAfterRestart());
}

/** Color del fog de tiles fuera de LOS. Ctor fogMat.color FOG_COLOR 0x050508 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_COLOR = 0x050508;

/** Idle fog mesh color. Ctor fogMat.color FOG_COLOR 0x050508 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_COLOR_SPAWN = 0x050508;

/**
 * Color que leería chunk/FOV (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle FOG_COLOR 0x050508).
 * chunk/FOV no escribe color (ctor constant).
 */
export function fogColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle FOG_COLOR 0x050508).
 * WorldView nace fogMat.color AfterRestart; leftover mid-life no filtra.
 * chunk/FOV no escribe color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function fogColorAfterRestart(): number {
  return fogColorFromLook(FOG_COLOR_SPAWN);
}

/** Opacity del fog de tiles fuera de LOS. Ctor fogMat.opacity FOG_OPACITY 0.92 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_OPACITY = 0.92;

/** Idle fog mesh opacity. Ctor fogMat.opacity FOG_OPACITY 0.92 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_OPACITY_SPAWN = 0.92;

/**
 * Opacity que leería chunk/FOV (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle FOG_OPACITY 0.92).
 * chunk/FOV no escribe opacity (ctor constant).
 */
export function fogOpacityFromLook(opacity: number): number {
  return opacity;
}

/**
 * R / softReset: opacity fresco (idle FOG_OPACITY 0.92).
 * WorldView nace fogMat.opacity AfterRestart; leftover mid-life no filtra.
 * chunk/FOV no escribe opacity (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function fogOpacityAfterRestart(): number {
  return fogOpacityFromLook(FOG_OPACITY_SPAWN);
}

/** Y del fog de tiles fuera de LOS. Ctor fog.position.y FOG_Y 0.02 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_Y = 0.02;

/** Idle fog mesh Y. Ctor fog.position.y FOG_Y 0.02 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_Y_SPAWN = 0.02;

/**
 * Y que leería chunk/FOV (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle FOG_Y 0.02).
 * chunk/FOV no escribe Y (ctor constant).
 */
export function fogYFromLook(y: number): number {
  return y;
}

/**
 * R / softReset: Y fresco (idle FOG_Y 0.02).
 * WorldView nace fog.position.y AfterRestart; leftover mid-life no filtra.
 * chunk/FOV no escribe Y (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function fogYAfterRestart(): number {
  return fogYFromLook(FOG_Y_SPAWN);
}

/** Rot X del fog de tiles fuera de LOS. Ctor fog.rotation.x -Math.PI / 2 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_ROT_X = -Math.PI / 2;

/** Idle fog mesh rot X. Ctor fog.rotation.x -Math.PI / 2 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_ROT_X_SPAWN = -Math.PI / 2;

/**
 * Rot X que leería chunk/FOV (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle -Math.PI / 2).
 * chunk/FOV no escribe rot (ctor constant).
 */
export function fogRotXFromLook(rotX: number): number {
  return rotX;
}

/**
 * R / softReset: rot X fresco (idle -Math.PI / 2).
 * WorldView nace fog.rotation.x AfterRestart; leftover mid-life no filtra.
 * chunk/FOV no escribe rot (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function fogRotXAfterRestart(): number {
  return fogRotXFromLook(FOG_ROT_X_SPAWN);
}

/** Rot Y del fog de tiles fuera de LOS. Ctor fog.rotation.y 0 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_ROT_Y = 0;

/** Idle fog mesh rot Y. Ctor fog.rotation.y 0 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_ROT_Y_SPAWN = 0;

/**
 * Rot Y que leería chunk/FOV (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * chunk/FOV no escribe rot Y (ctor constant).
 */
export function fogRotYFromLook(rotY: number): number {
  return rotY;
}

/**
 * R / softReset: rot Y fresco (idle 0).
 * WorldView nace fog.rotation.y AfterRestart; leftover mid-life no filtra.
 * chunk/FOV no escribe rot Y (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function fogRotYAfterRestart(): number {
  return fogRotYFromLook(FOG_ROT_Y_SPAWN);
}

/** Rot Z del fog de tiles fuera de LOS. Ctor fog.rotation.z 0 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_ROT_Z = 0;

/** Idle fog mesh rot Z. Ctor fog.rotation.z 0 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_ROT_Z_SPAWN = 0;

/**
 * Rot Z que leería chunk/FOV (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 0).
 * chunk/FOV no escribe rot Z (ctor constant).
 */
export function fogRotZFromLook(rotZ: number): number {
  return rotZ;
}

/**
 * R / softReset: rot Z fresco (idle 0).
 * WorldView nace fog.rotation.z AfterRestart; leftover mid-life no filtra.
 * chunk/FOV no escribe rot Z (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function fogRotZAfterRestart(): number {
  return fogRotZFromLook(FOG_ROT_Z_SPAWN);
}

/** Scale X del fog de tiles fuera de LOS. Ctor fog.scale.x 1 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_SCALE_X = 1;

/** Idle fog mesh scale X. Ctor fog.scale.x 1 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_SCALE_X_SPAWN = 1;

/**
 * Scale X que leería chunk/FOV (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * chunk/FOV no escribe scale (ctor constant).
 */
export function fogScaleXFromLook(scaleX: number): number {
  return scaleX;
}

/**
 * R / softReset: scale X fresco (idle 1).
 * WorldView nace fog.scale.x AfterRestart; leftover mid-life no filtra.
 * chunk/FOV no escribe scale (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function fogScaleXAfterRestart(): number {
  return fogScaleXFromLook(FOG_SCALE_X_SPAWN);
}

/** Scale Y del fog de tiles fuera de LOS. Ctor fog.scale.y 1 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_SCALE_Y = 1;

/** Idle fog mesh scale Y. Ctor fog.scale.y 1 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_SCALE_Y_SPAWN = 1;

/**
 * Scale Y que leería chunk/FOV (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * chunk/FOV no escribe scale (ctor constant).
 */
export function fogScaleYFromLook(scaleY: number): number {
  return scaleY;
}

/**
 * R / softReset: scale Y fresco (idle 1).
 * WorldView nace fog.scale.y AfterRestart; leftover mid-life no filtra.
 * chunk/FOV no escribe scale (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function fogScaleYAfterRestart(): number {
  return fogScaleYFromLook(FOG_SCALE_Y_SPAWN);
}

/** Scale Z del fog de tiles fuera de LOS. Ctor fog.scale.z 1 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_SCALE_Z = 1;

/** Idle fog mesh scale Z. Ctor fog.scale.z 1 = fresco. Mid-life leftover ≠ fresco. */
export const FOG_SCALE_Z_SPAWN = 1;

/**
 * Scale Z que leería chunk/FOV (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle 1).
 * chunk/FOV no escribe scale (ctor constant).
 */
export function fogScaleZFromLook(scaleZ: number): number {
  return scaleZ;
}

/**
 * R / softReset: scale Z fresco (idle 1).
 * WorldView nace fog.scale.z AfterRestart; leftover mid-life no filtra.
 * chunk/FOV no escribe scale (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function fogScaleZAfterRestart(): number {
  return fogScaleZFromLook(FOG_SCALE_Z_SPAWN);
}

/** Transparent del fog de tiles fuera de LOS. Ctor fogMat.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const FOG_TRANSPARENT = true;

/** Idle fog mesh transparent. Ctor fogMat.transparent true = fresco. Mid-life leftover ≠ fresco. */
export const FOG_TRANSPARENT_SPAWN = true;

/**
 * Transparent que leería chunk/FOV (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle true).
 * chunk/FOV no escribe transparent (ctor constant).
 */
export function fogTransparentFromLook(transparent: boolean): boolean {
  return transparent;
}

/**
 * R / softReset: transparent fresco (idle true).
 * WorldView nace fogMat.transparent AfterRestart; leftover mid-life no filtra.
 * chunk/FOV no escribe transparent (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function fogTransparentAfterRestart(): boolean {
  return fogTransparentFromLook(FOG_TRANSPARENT_SPAWN);
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
