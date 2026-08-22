/**
 * Progreso de loading diegético (headless): frases horror/survival + pasos n/total.
 * Sin Three.js ni DOM — usable desde tests y desde el overlay.
 */

/** Frases diegéticas en español (tono survival / barrio poseído). */
export const LOADING_LINES: readonly string[] = [
  "Afinando voces de los poseídos…",
  "Cartografiando el barrio…",
  "Calibrando hambre y sed…",
  "Sembrando ruido en la noche…",
  "Cerrando puertas del safehouse…",
  "Despertando sombras en los callejones…",
  "Contando munición y vendas…",
  "Escuchando el viento entre las rejas…",
] as const;

export interface LoadingProgress {
  /** Paso actual (0 al crear; 1…total tras advance). */
  readonly step: number;
  readonly total: number;
  /** Línea diegética actual. */
  readonly line: string;
  readonly isDone: boolean;
  /** Avanza un paso. Tras done es no-op. */
  advance(nowMs?: number): void;
  /** Marca done inmediato (skip cinemático). */
  skip(): void;
  /** Texto tipo `"Afinando voces de los poseídos… 3/6"`. */
  label(): string;
}

/**
 * Crea un contador de progreso diegético.
 * @param totalSteps número de pasos (default = cantidad de líneas).
 */
export function createLoadingProgress(totalSteps?: number): LoadingProgress {
  const total = Math.max(1, Math.floor(totalSteps ?? LOADING_LINES.length));
  let step = 0;
  let lineIndex = 0;
  let done = false;

  const syncLine = () => {
    lineIndex =
      step <= 0 ? 0 : (step - 1) % LOADING_LINES.length;
  };

  const api: LoadingProgress = {
    get step() {
      return step;
    },
    get total() {
      return total;
    },
    get line() {
      return LOADING_LINES[lineIndex]!;
    },
    get isDone() {
      return done;
    },
    advance(_nowMs?: number) {
      if (done) return;
      step = Math.min(step + 1, total);
      syncLine();
      if (step >= total) done = true;
    },
    skip() {
      step = total;
      syncLine();
      done = true;
    },
    label() {
      const n = step <= 0 ? 0 : step;
      return `${LOADING_LINES[lineIndex]!} ${n}/${total}`;
    },
  };

  return api;
}

/**
 * R / softReset: no línea diegética de splash.
 * Leftover `Despertando sombras en los callejones…` no filtra HUD.
 */
export function loadingLineAfterRestart(): string | null {
  return null;
}
