/**
 * Swing melee procedural (fallback) — headless.
 * Si el GLB no tiene clip `primary-attack` (Soldier), worldView aplica
 * pitch / yawBias a locoRoot.rotation.x / .z.
 * Envelope ease-out sine: sin(π t) = 0→1→0 en MELEE_SWING_DURATION.
 */

/** Duración del swing (s). 0.2875 × 1.15 para leer de noche. */
export const MELEE_SWING_DURATION = 0.330625;
/** Ángulo pico de pitch (rad). yawBias usa MELEE_SWING_YAW_RATIO. 0.4 × 1.15 para leer de noche. */
export const MELEE_SWING_ANGLE = 0.46;

/** yawBias = pitch * este ratio (sesgo, no un yaw completo). 0.5 × 1.15 para leer de noche. */
export const MELEE_SWING_YAW_RATIO = 0.575;

/** Idle swing pitch. Ctor locoRoot.rotation.x 0 = fresco. Mid-swing leftover ≠ 0. */
export const MELEE_SWING_PITCH_SPAWN = 0;
/** Idle swing yawBias. Ctor locoRoot.rotation.z 0 = fresco. Mid-swing leftover ≠ 0. */
export const MELEE_SWING_YAW_SPAWN = 0;

/**
 * Pitch que lee apply/tick (look fresco o vivo).
 * leftover mid-swing / leftover ctor non-zero ≠ fresco (idle 0).
 */
export function meleeSwingPitchFromLook(pitch: number): number {
  return pitch;
}

/**
 * yawBias que lee apply/tick (look fresco o vivo).
 * leftover mid-swing / leftover ctor non-zero ≠ fresco (idle 0).
 */
export function meleeSwingYawBiasFromLook(yawBias: number): number {
  return yawBias;
}

/**
 * Active que lee apply/tick (look fresco o vivo).
 * leftover mid-swing active ≠ fresco (idle).
 */
export function meleeSwingActiveFromLook(active: boolean): boolean {
  return active;
}

/**
 * R / softReset: pitch fresco (idle 0).
 * WorldView nace locoRoot.rotation.x AfterRestart; leftover mid-swing no filtra.
 * apply/tick lee meleeSwingPitchFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function meleeSwingPitchAfterRestart(): number {
  return meleeSwingPitchFromLook(MELEE_SWING_PITCH_SPAWN);
}

/**
 * R / softReset: yawBias fresco (idle 0).
 * WorldView nace locoRoot.rotation.z AfterRestart; leftover mid-swing no filtra.
 * apply/tick lee meleeSwingYawBiasFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function meleeSwingYawBiasAfterRestart(): number {
  return meleeSwingYawBiasFromLook(MELEE_SWING_YAW_SPAWN);
}

/**
 * R / softReset: active fresco (false).
 * leftover mid-swing no filtra.
 */
export function meleeSwingActiveAfterRestart(): boolean {
  return meleeSwingActiveFromLook(false);
}

export interface MeleeSwingState {
  /** Segundos transcurridos del swing actual. */
  age: number;
  /** True mientras el swing no ha terminado. */
  active: boolean;
}

export interface MeleeSwingOutput {
  /** Pitch (rotation.x) en radianes. */
  pitch: number;
  /** Sesgo de yaw aplicado en rotation.z (rad). */
  yawBias: number;
  active: boolean;
}

export function createMeleeSwingState(): MeleeSwingState {
  return { age: 0, active: false };
}

/**
 * HAS MUERTO / F9 load-muerto: no avanzar el swing ni aplicar lean overlay.
 * Vivo (incl. F9 load-vivo): tick/pose de hoy.
 * Ya en reposo = no-op; gameOver no inventa swing.
 */
export function swingPoseApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/** Reinicia el swing desde t=0 (re-trigger a mitad de golpe = nuevo golpe). */
export function triggerMeleeSwing(state: MeleeSwingState): void {
  state.age = 0;
  state.active = true;
}

/**
 * Ease-out sine 0→1: sin(t · π / 2).
 * El lóbulo completo 0→1→0 del swing es sin(π t) = ping-pong de esto.
 */
function easeOutSine(t: number): number {
  const x = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
  return Math.sin((x * Math.PI) / 2);
}

/**
 * Avanza el swing y devuelve offsets puros (deterministas para tests).
 * Mutates `state`. dt≤0 no avanza age.
 * gameOver → skip tick / reset overlay pose (ceros); no inventa swing.
 */
export function tickMeleeSwing(
  state: MeleeSwingState,
  dt: number,
  gameOver = false,
): MeleeSwingOutput {
  if (!swingPoseApplies(gameOver)) {
    return { pitch: 0, yawBias: 0, active: false };
  }
  const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
  if (state.active) {
    state.age += safeDt;
    if (state.age >= MELEE_SWING_DURATION) {
      state.age = MELEE_SWING_DURATION;
      state.active = false;
      return { pitch: 0, yawBias: 0, active: false };
    }
  }
  if (!state.active) {
    return { pitch: 0, yawBias: 0, active: false };
  }

  const t = state.age / MELEE_SWING_DURATION;
  // Primera mitad: ease-out sine de 2t; segunda: espejo → sin(π t).
  const envelope = easeOutSine(t <= 0.5 ? t * 2 : (1 - t) * 2);
  const pitch = envelope * MELEE_SWING_ANGLE;
  const yawBias = pitch * MELEE_SWING_YAW_RATIO;
  return { pitch, yawBias, active: true };
}
