/**
 * Footsteps SFX stub headless — nivel 0–1, sin assets ni AudioContext.
 * HUD: "pisadas" cuando hay movimiento reciente. Respeta mute (mismo flag que ambient).
 */

export type FootstepsState = {
  /** Distancia recorrida este frame (tiles). */
  moved: number;
  /** Sprint → target un poco más alto. */
  sprint?: boolean;
  /** Si se pasa, sincroniza el flag del bus. */
  muted?: boolean;
};

export type FootstepsBus = {
  muted: boolean;
  /** Nivel suavizado (pre-mute). */
  level: number;
  /** Acumulado de fase de paso (determinista). */
  phase: number;
};

/** Velocidad de fade hacia target (~6 → settle rápido). */
const LERP_RATE = 6;
/** Umbral HUD para mostrar "pisadas". */
const DESCRIBE_THRESHOLD = 0.18;

export function createFootstepsBus(muted = false): FootstepsBus {
  return {
    muted,
    level: 0,
    phase: 0,
  };
}

/**
 * R / softReset: pisadas frescas (level 0, phase 0). Mute se queda.
 * Game.footsteps debe coincidir (stride / HUD de la vida anterior no filtra).
 * F9 load no usa esto — el bus persiste (misma carrera).
 */
export function resetFootstepsAfterRestart(bus: FootstepsBus): void {
  const fresh = createFootstepsBus(bus.muted);
  bus.level = fresh.level;
  bus.phase = fresh.phase;
}

/** Target 0–1 a partir de movimiento (sin suavizado). */
export function footstepsTarget(state: FootstepsState): number {
  if (state.moved <= 0) return 0;
  const base = Math.min(1, state.moved * 8);
  return state.sprint ? Math.min(1, base * 1.15) : base;
}

/**
 * Avanza nivel hacia target. Determinista (sin RNG).
 * `state.muted` sincroniza el flag del bus si se pasa.
 */
export function tickFootsteps(
  bus: FootstepsBus,
  state: FootstepsState,
  dt: number,
): void {
  if (state.muted !== undefined) bus.muted = state.muted;
  if (dt < 0) dt = 0;

  if (state.moved > 0) {
    const rate = state.sprint ? 14 : 10;
    bus.phase += state.moved * rate;
  }

  const target = footstepsTarget(state);
  const k = dt <= 0 ? 0 : 1 - Math.exp(-dt * LERP_RATE);
  const next = bus.level + (target - bus.level) * k;
  bus.level = Math.abs(next - target) < 0.002 ? target : next;
}

/** Nivel audible: 0 si muted. */
export function footstepsLevel(bus: FootstepsBus): number {
  return bus.muted ? 0 : bus.level;
}

/**
 * Hint compacto HUD: "pisadas" | null.
 * Mute → null (el ambient stub ya muestra "mute").
 */
export function describeFootsteps(bus: FootstepsBus): string | null {
  if (bus.muted) return null;
  return footstepsLevel(bus) >= DESCRIBE_THRESHOLD ? "pisadas" : null;
}
