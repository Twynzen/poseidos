/**
 * Flash de hocico al disparar — headless.
 * Envelope ease-out sine: cos(u · π / 2) = 1→0 en MUZZLE_FLASH_DURATION
 * (el complemento del ease-out sine sin(t · π / 2) de meleeSwing).
 * worldView aplica intensidad a esfera aditiva + PointLight.
 */

/** Duración del flash (s). */
export const MUZZLE_FLASH_DURATION = 0.12;
/** Intensidad pico (u=0). Opacity del mesh = intensity (ya 1 al trigger). */
export const MUZZLE_FLASH_PEAK = 1;
/** Radio de la esfera aditiva (tiles). 0.11 × 1.25 para leer de noche. */
export const MUZZLE_FLASH_RADIUS = 0.1375;
/** Pico de PointLight en worldView. 2.2 × 1.25 para leer de noche. */
export const MUZZLE_LIGHT_PEAK = 2.75;

export interface MuzzleFlashState {
  /** Segundos transcurridos del flash actual. */
  age: number;
  /** True mientras el flash no ha terminado. */
  active: boolean;
}

export interface MuzzleFlashOutput {
  /** 0–1. Pico 1 al trigger; ease-out sine hasta 0. */
  intensity: number;
  active: boolean;
}

export function createMuzzleFlash(): MuzzleFlashState {
  return { age: 0, active: false };
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
 */
export function tickMuzzleFlash(
  state: MuzzleFlashState,
  dt: number,
): MuzzleFlashOutput {
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
