/**
 * Spark de impacto al extremo del tracer — headless.
 * Envelope ease-out sine: cos(u · π / 2) = 1→0 en IMPACT_SPARK_DURATION
 * (el complemento del ease-out sine sin(t · π / 2) de meleeSwing).
 * worldView aplica intensidad a esfera aditiva + PointLight en (x, y).
 */

/** Duración del spark (s). 0.22 × 1.15 para leer de noche. */
export const IMPACT_SPARK_DURATION = 0.253;
/** Intensidad pico (u=0). 1 × 1.15 para leer de noche. Opacity del mesh = intensity. */
export const IMPACT_SPARK_PEAK = 1.15;
/** Radio de la esfera aditiva (tiles). 0.1125 × 1.15 para leer de noche. */
export const IMPACT_SPARK_RADIUS = 0.129375;
/** Pico de PointLight en worldView. 1.75 × 1.15 para leer de noche. */
export const IMPACT_SPARK_LIGHT_PEAK = 2.0125;

export interface ImpactSparkState {
  /** Segundos transcurridos del spark actual. */
  age: number;
  /** True mientras el spark no ha terminado. */
  active: boolean;
  /** Posición mundo X (plano mapa). */
  x: number;
  /** Posición mundo Y (plano mapa → Three z). */
  y: number;
}

export interface ImpactSparkOutput {
  /** Pico IMPACT_SPARK_PEAK al trigger; ease-out sine hasta 0. */
  intensity: number;
  active: boolean;
  x: number;
  y: number;
}

export function createImpactSpark(): ImpactSparkState {
  return { age: 0, active: false, x: 0, y: 0 };
}

/**
 * HAS MUERTO / F9 load-muerto: no avanzar el spark ni pintarlo.
 * Vivo (incl. F9 load-vivo): tick/intensity de hoy.
 * Ya oculto = no-op; gameOver no inventa spark.
 */
export function impactSparkApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/** Reinicia el spark desde t=0 en (x, y) (re-trigger a mitad = nuevo impacto). */
export function triggerImpactSpark(
  state: ImpactSparkState,
  x: number,
  y: number,
): void {
  state.age = 0;
  state.active = true;
  state.x = x;
  state.y = y;
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
 * Avanza el spark y devuelve intensidad + posición (determinista para tests).
 * Mutates `state`. dt≤0 no avanza age.
 * gameOver → skip tick / hide (intensity 0); no inventa spark.
 */
export function tickImpactSpark(
  state: ImpactSparkState,
  dt: number,
  gameOver = false,
): ImpactSparkOutput {
  if (!impactSparkApplies(gameOver)) {
    return {
      intensity: 0,
      active: false,
      x: state.x,
      y: state.y,
    };
  }
  const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
  if (state.active) {
    state.age += safeDt;
    if (state.age >= IMPACT_SPARK_DURATION) {
      state.age = IMPACT_SPARK_DURATION;
      state.active = false;
      return {
        intensity: 0,
        active: false,
        x: state.x,
        y: state.y,
      };
    }
  }
  if (!state.active) {
    return {
      intensity: 0,
      active: false,
      x: state.x,
      y: state.y,
    };
  }

  const u = state.age / IMPACT_SPARK_DURATION;
  return {
    intensity: easeOutSine(u) * IMPACT_SPARK_PEAK,
    active: true,
    x: state.x,
    y: state.y,
  };
}
