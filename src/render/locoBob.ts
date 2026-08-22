/**
 * Bob / lean / sway procedural de silueta — headless.
 * worldView aplica los números a body+head / locoRoot.
 * Sin GLB ni rig: idle suave, walk bob+sway, sprint más rápido/alto.
 */

export interface LocoBobInput {
  moving: boolean;
  sprinting: boolean;
  /** Opcional: magnitud 0..1+ para escalar amplitudes (default 1 si moving). */
  speed?: number;
}

export interface LocoBobState {
  /** Fase angular en radianes (avanza con frecuencia * 2π). */
  phase: number;
}

export interface LocoBobOutput {
  /** Offset vertical local (metros / unidades mundo). */
  bobY: number;
  /** Lean roll (rad) — inclina el torso al correr. */
  leanZ: number;
  /** Sway lateral (rad) — ligero balanceo en X. */
  swayX: number;
  phase: number;
}

/** Idle: casi quieto — respiración suave. 0.35 × 1.15 para leer de noche. */
export const IDLE_FREQ_HZ = 0.4025;
/** Bob vertical idle. 0.0138 × 1.15 para leer de noche. */
export const IDLE_BOB_AMP = 0.01587;
export const IDLE_LEAN_AMP = 0;
/** Sway lateral idle. 0.0092 × 1.15 para leer de noche. */
export const IDLE_SWAY_AMP = 0.01058;

/** Walk. 1.55 × 1.15 para leer de noche. */
export const WALK_FREQ_HZ = 1.7825;
/** Bob vertical walk. 0.06325 × 1.15 para leer de noche. */
export const WALK_BOB_AMP = 0.0727375;
/** Lean roll walk. 0.046 × 1.15 para leer de noche. */
export const WALK_LEAN_AMP = 0.0529;
/** Sway lateral walk. 0.04025 × 1.15 para leer de noche. */
export const WALK_SWAY_AMP = 0.0462875;

/** Sprint: más rápido y alto. 2.35 × 1.15 para leer de noche. */
export const SPRINT_FREQ_HZ = 2.7025;
/** Bob vertical sprint. 0.1035 × 1.15 para leer de noche. */
export const SPRINT_BOB_AMP = 0.119025;
/** Lean roll sprint. 0.0805 × 1.15 para leer de noche. */
export const SPRINT_LEAN_AMP = 0.092575;
/** Sway lateral sprint. 0.0575 × 1.15 para leer de noche. */
export const SPRINT_SWAY_AMP = 0.066125;

/** Idle bobY. Ctor locoRoot.position.y 0 = fresco. Mid-stride leftover ≠ 0. */
export const LOCO_BOB_Y_SPAWN = 0;
/** Idle leanZ. Ctor locoRoot.rotation.z overlay 0 = fresco. Mid-stride leftover ≠ 0. */
export const LOCO_LEAN_Z_SPAWN = 0;
/** Idle swayX. Ctor locoRoot.rotation.x overlay 0 = fresco. Mid-stride leftover ≠ 0. */
export const LOCO_SWAY_X_SPAWN = 0;

/**
 * bobY que lee apply/tick (look fresco o vivo).
 * leftover mid-stride / leftover ctor non-zero ≠ fresco (idle 0).
 */
export function locoBobYFromLook(bobY: number): number {
  return bobY;
}

/**
 * leanZ que lee apply/tick (look fresco o vivo).
 * leftover mid-stride / leftover ctor non-zero ≠ fresco (idle 0).
 */
export function locoBobLeanZFromLook(leanZ: number): number {
  return leanZ;
}

/**
 * swayX que lee apply/tick (look fresco o vivo).
 * leftover mid-stride / leftover ctor non-zero ≠ fresco (idle 0).
 */
export function locoBobSwayXFromLook(swayX: number): number {
  return swayX;
}

/**
 * R / softReset: bobY fresco (idle 0).
 * WorldView nace locoRoot.position.y AfterRestart; leftover mid-stride no filtra.
 * apply/tick lee locoBobYFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function locoBobYAfterRestart(): number {
  return locoBobYFromLook(LOCO_BOB_Y_SPAWN);
}

/**
 * R / softReset: leanZ fresco (idle 0).
 * WorldView nace locoBobOut lean AfterRestart; leftover mid-stride no filtra.
 * apply/tick lee locoBobLeanZFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function locoBobLeanZAfterRestart(): number {
  return locoBobLeanZFromLook(LOCO_LEAN_Z_SPAWN);
}

/**
 * R / softReset: swayX fresco (idle 0).
 * WorldView nace locoBobOut sway AfterRestart; leftover mid-stride no filtra.
 * apply/tick lee locoBobSwayXFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function locoBobSwayXAfterRestart(): number {
  return locoBobSwayXFromLook(LOCO_SWAY_X_SPAWN);
}

const TWO_PI = Math.PI * 2;

export function createLocoBobState(phase = 0): LocoBobState {
  return { phase: Number.isFinite(phase) ? phase : 0 };
}

/**
 * HAS MUERTO / F9 load-muerto: no avanzar el bob ni aplicar idle/walk offsets.
 * Vivo (incl. F9 load-vivo): tick/pose de hoy.
 * Ya en reposo = no-op; gameOver no inventa bob.
 */
export function locoBobApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

function paramsFor(input: LocoBobInput): {
  freq: number;
  bobAmp: number;
  leanAmp: number;
  swayAmp: number;
} {
  if (!input.moving) {
    return {
      freq: IDLE_FREQ_HZ,
      bobAmp: IDLE_BOB_AMP,
      leanAmp: IDLE_LEAN_AMP,
      swayAmp: IDLE_SWAY_AMP,
    };
  }
  if (input.sprinting) {
    return {
      freq: SPRINT_FREQ_HZ,
      bobAmp: SPRINT_BOB_AMP,
      leanAmp: SPRINT_LEAN_AMP,
      swayAmp: SPRINT_SWAY_AMP,
    };
  }
  return {
    freq: WALK_FREQ_HZ,
    bobAmp: WALK_BOB_AMP,
    leanAmp: WALK_LEAN_AMP,
    swayAmp: WALK_SWAY_AMP,
  };
}

function speedScale(input: LocoBobInput): number {
  if (!input.moving) return 1;
  if (input.speed == null || !Number.isFinite(input.speed)) return 1;
  // Clamp suave: 0 → quieto relativo; 1 = nominal; >1 no dispara.
  return Math.max(0, Math.min(1.5, input.speed));
}

/**
 * Avanza phase y devuelve offsets puros (deterministas para tests).
 * Mutates `state.phase`.
 * gameOver → skip tick / zero idle offsets; no inventa bob.
 */
export function tickLocoBob(
  state: LocoBobState,
  input: LocoBobInput,
  dt: number,
  gameOver = false,
): LocoBobOutput {
  if (!locoBobApplies(gameOver)) {
    return { bobY: 0, leanZ: 0, swayX: 0, phase: state.phase };
  }
  const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
  const p = paramsFor(input);
  const scale = speedScale(input);

  state.phase += p.freq * TWO_PI * safeDt;
  // Mantener phase acotada para estabilidad numérica (sin cambiar continuidad).
  if (state.phase > TWO_PI * 64) state.phase %= TWO_PI;
  if (state.phase < 0) state.phase = ((state.phase % TWO_PI) + TWO_PI) % TWO_PI;

  const s = Math.sin(state.phase);
  // Bob vertical ~ |sin| style feel via sin² for soft floor contact, but
  // pure sin is fine and easier to assert; use sin for Y, cos for sway phase offset.
  const bobY = s * p.bobAmp * scale;
  const leanZ = s * p.leanAmp * scale;
  const swayX = Math.cos(state.phase) * p.swayAmp * scale;

  return {
    bobY,
    leanZ,
    swayX,
    phase: state.phase,
  };
}

/** Amplitud |bobY| máxima teórica del modo (sin speed scale). */
export function maxBobAmp(input: Pick<LocoBobInput, "moving" | "sprinting">): number {
  return paramsFor({ moving: input.moving, sprinting: input.sprinting }).bobAmp;
}

/** Frecuencia Hz del modo. */
export function locoFreqHz(input: Pick<LocoBobInput, "moving" | "sprinting">): number {
  return paramsFor({ moving: input.moving, sprinting: input.sprinting }).freq;
}
