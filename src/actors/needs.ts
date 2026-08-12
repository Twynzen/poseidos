/**
 * Needs de supervivencia (F2).
 * Escala 0–100: 0 = ok, 100 = crítico. Suben con el tiempo de juego.
 *
 * - `eat()` / `drink()`: alivio al consumir items (PlayerSim.tryConsume).
 * - Descanso corto: tecla R → `rest()` baja cansancio.
 * - Sueño / safehouse: tecla Z → `trySleep` (indoor, sin hostiles; avanza reloj).
 */

export interface NeedsState {
  hunger: number;
  thirst: number;
  fatigue: number;
}

/**
 * Segundos reales aprox. para llenar 0→100 a rate 1× (sin mult clima).
 * ~2.3× más lento que el slice demo anterior (180/120/240) — demos sin muerte por sed constante.
 */
export const NEEDS_FULL_SEC = {
  hunger: 420,
  thirst: 280,
  fatigue: 560,
} as const;

export const NEEDS_RATE = {
  hunger: 100 / NEEDS_FULL_SEC.hunger,
  thirst: 100 / NEEDS_FULL_SEC.thirst,
  fatigue: 100 / NEEDS_FULL_SEC.fatigue,
} as const;

/** Cuánto baja cada acción stub / descanso. */
export const NEEDS_RELIEF = {
  eat: 35,
  drink: 40,
  rest: 25,
} as const;

function clamp01to100(v: number): number {
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
}

export function createNeeds(initial?: Partial<NeedsState>): NeedsState {
  return {
    hunger: clamp01to100(initial?.hunger ?? 0),
    thirst: clamp01to100(initial?.thirst ?? 0),
    fatigue: clamp01to100(initial?.fatigue ?? 0),
  };
}

/** Multiplicadores opcionales de rate (p.ej. lluvia outdoor). */
export interface NeedsRateMult {
  hunger?: number;
  thirst?: number;
  fatigue?: number;
}

/** Avanza needs con dt del GameClock / loop (segundos de juego). */
export function tickNeeds(
  state: NeedsState,
  dt: number,
  mult?: NeedsRateMult,
): NeedsState {
  if (dt <= 0) return state;
  const mh = mult?.hunger ?? 1;
  const mt = mult?.thirst ?? 1;
  const mf = mult?.fatigue ?? 1;
  state.hunger = clamp01to100(state.hunger + NEEDS_RATE.hunger * dt * mh);
  state.thirst = clamp01to100(state.thirst + NEEDS_RATE.thirst * dt * mt);
  state.fatigue = clamp01to100(state.fatigue + NEEDS_RATE.fatigue * dt * mf);
  return state;
}

/** Baja hambre (consumo de item food). */
export function eat(state: NeedsState, amount: number = NEEDS_RELIEF.eat): NeedsState {
  state.hunger = clamp01to100(state.hunger - amount);
  return state;
}

/** Baja sed (consumo de item drink). */
export function drink(state: NeedsState, amount: number = NEEDS_RELIEF.drink): NeedsState {
  state.thirst = clamp01to100(state.thirst - amount);
  return state;
}

/** Descanso corto (tecla R). Sueño largo (Z) usa SLEEP_FATIGUE_RELIEF vía trySleep. */
export function rest(state: NeedsState, amount: number = NEEDS_RELIEF.rest): NeedsState {
  state.fatigue = clamp01to100(state.fatigue - amount);
  return state;
}

export function needsSnapshot(state: NeedsState): NeedsState {
  return {
    hunger: state.hunger,
    thirst: state.thirst,
    fatigue: state.fatigue,
  };
}
