/**
 * Clima headless (lluvia mínima).
 * clear | drizzle | rain; ciclo por intervalo + sesgo nocturno.
 * Survival/visual leen `isRaining` + `intensity` (0–1).
 */

export type WeatherKind = "clear" | "drizzle" | "rain";

/** Segundos entre rolls de cambio de clima. */
export const WEATHER_CHECK_SEC = 14;

/** Multiplicadores survival outdoor bajo lluvia (indoor = 1). */
export const RAIN_THIRST_MULT = 1.28;
export const RAIN_FATIGUE_MULT = 1.18;

/** Intensidad objetivo por estado. */
const TARGET_INTENSITY: Record<WeatherKind, number> = {
  clear: 0,
  drizzle: 0.4,
  rain: 0.85,
};

export interface WeatherOpts {
  /** Intervalo entre rolls (default WEATHER_CHECK_SEC). */
  checkInterval?: number;
  /** RNG inyectable (tests). */
  rng?: () => number;
  /** Estado inicial. */
  initial?: WeatherKind;
}

export class WeatherSystem {
  kind: WeatherKind;
  /** Intensidad suavizada 0–1 (visual + survival). */
  intensity = 0;
  private timer: number;
  private readonly checkInterval: number;
  private readonly rng: () => number;

  constructor(opts?: WeatherOpts) {
    this.kind = opts?.initial ?? "clear";
    this.intensity = TARGET_INTENSITY[this.kind];
    this.checkInterval = opts?.checkInterval ?? WEATHER_CHECK_SEC;
    this.rng = opts?.rng ?? Math.random;
    // Primer roll un poco antes del intervalo completo.
    this.timer = this.checkInterval * 0.35;
  }

  get isRaining(): boolean {
    return this.kind === "rain" || this.kind === "drizzle";
  }

  /**
   * Avanza clima. `phase` del GameClock [0,1): noche cerca de 0 / 1.
   * Sin phase → chance neutra.
   */
  tick(dt: number, phase?: number): void {
    if (dt <= 0) return;
    this.timer += dt;
    if (this.timer >= this.checkInterval) {
      this.timer = 0;
      this.roll(phase);
    }
    const target = TARGET_INTENSITY[this.kind];
    // Fade ~2s hacia el target.
    const k = 1 - Math.exp(-dt * 2.2);
    this.intensity += (target - this.intensity) * k;
    if (Math.abs(this.intensity - target) < 0.002) this.intensity = target;
  }

  /** Forzar estado (tests / debug). */
  setKind(kind: WeatherKind): void {
    this.kind = kind;
    this.intensity = TARGET_INTENSITY[kind];
  }

  private roll(phase?: number): void {
    const night = isNightPhase(phase);
    const r = this.rng();
    if (!this.isRaining) {
      // Día ~18%, noche ~42% de empezar.
      const pStart = night ? 0.42 : 0.18;
      if (r < pStart) {
        this.kind = r < pStart * 0.45 ? "drizzle" : "rain";
      }
      return;
    }
    // Parar: día más fácil; drizzle más inestable.
    const pStop =
      this.kind === "drizzle"
        ? night
          ? 0.28
          : 0.55
        : night
          ? 0.18
          : 0.4;
    if (r < pStop) {
      this.kind = "clear";
      return;
    }
    // A veces escala drizzle ↔ rain.
    if (this.kind === "drizzle" && r > 0.72) this.kind = "rain";
    else if (this.kind === "rain" && r > 0.85) this.kind = "drizzle";
  }
}

/** Noche ≈ phase en [0, 0.22) U (0.78, 1) (medianoche = 0). */
export function isNightPhase(phase: number | undefined): boolean {
  if (phase === undefined || !Number.isFinite(phase)) return false;
  const p = ((phase % 1) + 1) % 1;
  return p < 0.22 || p > 0.78;
}

export interface RainNeedsMult {
  thirst: number;
  fatigue: number;
}

/**
 * Multiplicadores de tickNeeds bajo lluvia.
 * Indoor o no raining → 1 / 1.
 * Outdoor raining → thirst/fatigue un poco más rápidos (escala con intensity).
 */
export function rainNeedsMult(
  weather: { isRaining: boolean; intensity: number },
  indoor: boolean,
): RainNeedsMult {
  if (indoor || !weather.isRaining) {
    return { thirst: 1, fatigue: 1 };
  }
  const t = Math.max(0, Math.min(1, weather.intensity));
  return {
    thirst: 1 + (RAIN_THIRST_MULT - 1) * t,
    fatigue: 1 + (RAIN_FATIGUE_MULT - 1) * t,
  };
}
