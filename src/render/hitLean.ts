/**
 * Recoil hit procedural (fallback) — headless.
 * Si el GLB no tiene clip `hit` (Soldier), worldView aplica
 * pitch negativo a locoRoot.rotation.x (yawBias en .z).
 * Envelope ease-out sine: sin(π t) = 0→1→0 en HIT_LEAN_DURATION.
 */

/** Duración del lean (s). */
export const HIT_LEAN_DURATION = 0.2645;
/** Ángulo pico de pitch (rad). yawBias usa la mitad. Pitch de salida es negativo. */
export const HIT_LEAN_ANGLE = 0.4025;

/** yawBias = pitch * este ratio (sesgo, no un yaw completo). */
const HIT_LEAN_YAW_RATIO = 0.5;

export interface HitLeanState {
  /** Segundos transcurridos del lean actual. */
  age: number;
  /** True mientras el lean no ha terminado. */
  active: boolean;
}

export interface HitLeanOutput {
  /** Pitch (rotation.x) en radianes — negativo (recoil). */
  pitch: number;
  /** Sesgo de yaw aplicado en rotation.z (rad). */
  yawBias: number;
  active: boolean;
}

export function createHitLeanState(): HitLeanState {
  return { age: 0, active: false };
}

/** Reinicia el lean desde t=0 (re-trigger a mitad = nuevo recoil). */
export function triggerHitLean(state: HitLeanState): void {
  state.age = 0;
  state.active = true;
}

/**
 * Ease-out sine 0→1: sin(t · π / 2).
 * El lóbulo completo 0→1→0 del lean es sin(π t) = ping-pong de esto.
 */
function easeOutSine(t: number): number {
  const x = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
  return Math.sin((x * Math.PI) / 2);
}

/**
 * Avanza el lean y devuelve offsets puros (deterministas para tests).
 * Mutates `state`. dt≤0 no avanza age.
 * Pitch es negativo (espejo del melee swing).
 */
export function tickHitLean(state: HitLeanState, dt: number): HitLeanOutput {
  const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
  if (state.active) {
    state.age += safeDt;
    if (state.age >= HIT_LEAN_DURATION) {
      state.age = HIT_LEAN_DURATION;
      state.active = false;
      return { pitch: 0, yawBias: 0, active: false };
    }
  }
  if (!state.active) {
    return { pitch: 0, yawBias: 0, active: false };
  }

  const t = state.age / HIT_LEAN_DURATION;
  // Primera mitad: ease-out sine de 2t; segunda: espejo → sin(π t).
  const envelope = easeOutSine(t <= 0.5 ? t * 2 : (1 - t) * 2);
  const pitch = -envelope * HIT_LEAN_ANGLE;
  const yawBias = pitch * HIT_LEAN_YAW_RATIO;
  return { pitch, yawBias, active: true };
}
