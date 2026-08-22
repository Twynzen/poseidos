/**
 * Flash de hocico al disparar — headless.
 * Envelope ease-out sine: cos(u · π / 2) = 1→0 en MUZZLE_FLASH_DURATION
 * (el complemento del ease-out sine sin(t · π / 2) de meleeSwing).
 * worldView aplica intensidad a esfera aditiva + PointLight.
 */

import { TRACER_HEIGHT } from "./tracers";

/** Duración del flash (s). 0.12 × 1.15 para leer de noche. */
export const MUZZLE_FLASH_DURATION = 0.138;
/** Intensidad pico (u=0). 1 × 1.15 para leer de noche. Opacity del mesh = intensity. */
export const MUZZLE_FLASH_PEAK = 1.15;
/** Radio de la esfera aditiva (tiles). 0.1375 × 1.15 para leer de noche. */
export const MUZZLE_FLASH_RADIUS = 0.158125;
/** Pico de PointLight en worldView. 2.75 × 1.15 para leer de noche. */
export const MUZZLE_LIGHT_PEAK = 3.1625;

export interface MuzzleFlashState {
  /** Segundos transcurridos del flash actual. */
  age: number;
  /** True mientras el flash no ha terminado. */
  active: boolean;
}

export interface MuzzleFlashOutput {
  /** Pico MUZZLE_FLASH_PEAK al trigger; ease-out sine hasta 0. */
  intensity: number;
  active: boolean;
}

export function createMuzzleFlash(): MuzzleFlashState {
  return { age: 0, active: false };
}

/** Spawn facing yaw 0: local X = sin(0)×forward = 0. Three default origin leftover. */
export const MUZZLE_FLASH_POS_X_SPAWN = 0;
/** Spawn Y = TRACER_HEIGHT. Three default 0 = leftover. */
export const MUZZLE_FLASH_POS_Y_SPAWN = TRACER_HEIGHT;
/** Spawn facing yaw 0: local Z = cos(0)×MUZZLE_FORWARD 0.552. Three default 0 = leftover. */
export const MUZZLE_FLASH_POS_Z_SPAWN = 0.552;

/**
 * Intensity/opacity que lee applyMuzzleFlashVisual (look fresco o vivo).
 * leftover ctor Three opacity 1 / mid-flash ≠ fresco (inactive 0).
 */
export function muzzleFlashIntensityFromLook(intensity: number): number {
  return intensity;
}

/**
 * Active/visible que lee applyMuzzleFlashVisual (look fresco o vivo).
 * leftover mid-flash active ≠ fresco (inactive).
 */
export function muzzleFlashActiveFromLook(active: boolean): boolean {
  return active;
}

/**
 * Pos X local que lee applyMuzzleFlashVisual (ox fresco o vivo).
 * leftover ctor origin 0 / far ≠ pos fresco (spawn yaw 0 → 0).
 */
export function muzzleFlashPosXFromLook(ox: number): number {
  return ox;
}

/**
 * Pos Y local que lee applyMuzzleFlashVisual (TRACER_HEIGHT fresco o vivo).
 * leftover ctor origin 0 ≠ pos fresco (TRACER_HEIGHT).
 */
export function muzzleFlashPosYFromLook(oy: number): number {
  return oy;
}

/**
 * Pos Z local que lee applyMuzzleFlashVisual (oz fresco o vivo).
 * leftover ctor origin 0 / far ≠ pos fresco (spawn yaw 0 → 0.552).
 */
export function muzzleFlashPosZFromLook(oz: number): number {
  return oz;
}

/**
 * R / softReset: intensity fresco (inactive 0).
 * WorldView nace opacity/apply AfterRestart; leftover ctor Three 1 no filtra.
 * apply/tick lee muzzleFlashIntensityFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function muzzleFlashIntensityAfterRestart(): number {
  return muzzleFlashIntensityFromLook(0);
}

/**
 * R / softReset: active fresco (false).
 * WorldView nace visible/apply AfterRestart; leftover mid-flash no filtra.
 */
export function muzzleFlashActiveAfterRestart(): boolean {
  return muzzleFlashActiveFromLook(false);
}

/**
 * R / softReset: pos X fresco (spawn yaw 0 → 0).
 * WorldView nace `muzzleMesh.position.set(muzzleFlashPosXAfterRestart(), …)`;
 * leftover ctor origin 0,0 no filtra.
 * apply lee muzzleFlashPosXFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function muzzleFlashPosXAfterRestart(
  ox = MUZZLE_FLASH_POS_X_SPAWN,
): number {
  return muzzleFlashPosXFromLook(ox);
}

/**
 * R / softReset: pos Y fresco (TRACER_HEIGHT).
 * WorldView nace `muzzleMesh.position.set(…, muzzleFlashPosYAfterRestart(), …)`;
 * leftover ctor origin 0 no filtra.
 */
export function muzzleFlashPosYAfterRestart(
  oy = MUZZLE_FLASH_POS_Y_SPAWN,
): number {
  return muzzleFlashPosYFromLook(oy);
}

/**
 * R / softReset: pos Z fresco (spawn yaw 0 → 0.552).
 * WorldView nace `muzzleMesh.position.set(…, muzzleFlashPosZAfterRestart())`;
 * leftover ctor origin 0 no filtra.
 */
export function muzzleFlashPosZAfterRestart(
  oz = MUZZLE_FLASH_POS_Z_SPAWN,
): number {
  return muzzleFlashPosZFromLook(oz);
}

/** Idle muzzle decay. Ctor muzzleLight.decay MUZZLE_LIGHT_DECAY 1.74 = fresco. Mid-life leftover ≠ fresco. */
export const MUZZLE_LIGHT_DECAY_SPAWN = 1.74;

/**
 * Decay que leería applyMuzzleFlashVisual (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle MUZZLE_LIGHT_DECAY).
 * apply/tick no escribe decay (ctor constant).
 */
export function muzzleLightDecayFromLook(decay: number): number {
  return decay;
}

/**
 * R / softReset: decay fresco (idle MUZZLE_LIGHT_DECAY).
 * WorldView nace muzzleLight.decay AfterRestart; leftover mid-life no filtra.
 * apply/tick no escribe decay (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function muzzleLightDecayAfterRestart(): number {
  return muzzleLightDecayFromLook(MUZZLE_LIGHT_DECAY_SPAWN);
}

/** Idle muzzle color. Ctor muzzleLight.color MUZZLE_LIGHT_COLOR 0xffffb8 = fresco. Mid-life leftover ≠ fresco. */
export const MUZZLE_LIGHT_COLOR_SPAWN = 0xffffb8;

/**
 * Color que leería applyMuzzleFlashVisual (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle MUZZLE_LIGHT_COLOR 0xffffb8).
 * apply/tick no escribe color (ctor constant).
 */
export function muzzleLightColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle MUZZLE_LIGHT_COLOR 0xffffb8).
 * WorldView nace muzzleLight.color AfterRestart; leftover mid-life no filtra.
 * apply/tick no escribe color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function muzzleLightColorAfterRestart(): number {
  return muzzleLightColorFromLook(MUZZLE_LIGHT_COLOR_SPAWN);
}

/** Idle muzzle distance. Ctor muzzleLight.distance MUZZLE_LIGHT_DISTANCE 2.6 = fresco. Mid-life leftover ≠ fresco. */
export const MUZZLE_LIGHT_DISTANCE_SPAWN = 2.6;

/**
 * Distance que leería applyMuzzleFlashVisual (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle MUZZLE_LIGHT_DISTANCE 2.6).
 * apply/tick no escribe distance (ctor constant).
 */
export function muzzleLightDistanceFromLook(distance: number): number {
  return distance;
}

/**
 * R / softReset: distance fresco (idle MUZZLE_LIGHT_DISTANCE 2.6).
 * WorldView nace muzzleLight.distance AfterRestart; leftover mid-life no filtra.
 * apply/tick no escribe distance (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function muzzleLightDistanceAfterRestart(): number {
  return muzzleLightDistanceFromLook(MUZZLE_LIGHT_DISTANCE_SPAWN);
}

/** Idle muzzle flash mesh color. Ctor muzzleMat.color MUZZLE_FLASH_COLOR 0xffffdd = fresco. Mid-life leftover ≠ fresco. */
export const MUZZLE_FLASH_COLOR_SPAWN = 0xffffdd;

/**
 * Color que leería applyMuzzleFlashVisual (look fresco o vivo).
 * leftover mid-life ≠ fresco (idle MUZZLE_FLASH_COLOR 0xffffdd).
 * apply/tick no escribe color (ctor constant).
 */
export function muzzleFlashColorFromLook(color: number): number {
  return color;
}

/**
 * R / softReset: color fresco (idle MUZZLE_FLASH_COLOR 0xffffdd).
 * WorldView nace muzzleMat.color AfterRestart; leftover mid-life no filtra.
 * apply/tick no escribe color (ctor constant).
 * F9 / enterGameOver / freeze death no assign.
 */
export function muzzleFlashColorAfterRestart(): number {
  return muzzleFlashColorFromLook(MUZZLE_FLASH_COLOR_SPAWN);
}

/**
 * HAS MUERTO / F9 load-muerto: no avanzar el flash ni pintarlo.
 * Vivo (incl. F9 load-vivo): tick/intensity de hoy.
 * Ya oculto = no-op; gameOver no inventa flash.
 */
export function muzzleFlashApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/** Reinicia el flash desde t=0 (re-trigger a mitad = nuevo disparo). */
export function triggerMuzzleFlash(state: MuzzleFlashState): void {
  state.age = 0;
  state.active = true;
}

/**
 * Ease-out sine 1→0: cos(u · π / 2).
 * u=0 → 1 (pico); u=1 → 0.
 */
function easeOutSine(u: number): number {
  const x = Number.isFinite(u) ? Math.max(0, Math.min(1, u)) : 0;
  return Math.cos((x * Math.PI) / 2);
}

/**
 * Avanza el flash y devuelve intensidad pura (determinista para tests).
 * Mutates `state`. dt≤0 no avanza age.
 * gameOver → skip tick / hide (intensity 0); no inventa flash.
 */
export function tickMuzzleFlash(
  state: MuzzleFlashState,
  dt: number,
  gameOver = false,
): MuzzleFlashOutput {
  if (!muzzleFlashApplies(gameOver)) {
    return { intensity: 0, active: false };
  }
  const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
  if (state.active) {
    state.age += safeDt;
    if (state.age >= MUZZLE_FLASH_DURATION) {
      state.age = MUZZLE_FLASH_DURATION;
      state.active = false;
      return { intensity: 0, active: false };
    }
  }
  if (!state.active) {
    return { intensity: 0, active: false };
  }

  const u = state.age / MUZZLE_FLASH_DURATION;
  return {
    intensity: easeOutSine(u) * MUZZLE_FLASH_PEAK,
    active: true,
  };
}
