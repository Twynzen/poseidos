/**
 * Reloj de juego para día/noche.
 * `dayLengthSec` = segundos reales de un ciclo completo.
 * Default de partida: DEFAULT_DAY_LENGTH_SEC (config).
 */
export class GameClock {
  /** Segundos de juego acumulados. */
  elapsed = 0;
  /** Duración real de un día completo. */
  readonly dayLengthSec: number;

  constructor(dayLengthSec = 60) {
    this.dayLengthSec = dayLengthSec;
  }

  advance(dt: number): void {
    this.elapsed += dt;
  }

  /** Fase del día en [0, 1): 0 = medianoche, 0.25 = amanecer, 0.5 = mediodía. */
  get phase(): number {
    const t = this.elapsed / this.dayLengthSec;
    return t - Math.floor(t);
  }

  /** Factor de luz diurna [0, 1] (noche ~0.08, día ~1). */
  get daylight(): number {
    // Curva suave: pico al mediodía (phase 0.5)
    const angle = this.phase * Math.PI * 2;
    // cos: 1 at midnight (phase 0), -1 at noon (phase 0.5) → invert
    const sun = -Math.cos(angle); // -1 noche, +1 mediodía
    const t = (sun + 1) / 2; // 0..1
    return 0.08 + t * 0.92;
  }

  get isNight(): boolean {
    return this.daylight < 0.35;
  }
}
