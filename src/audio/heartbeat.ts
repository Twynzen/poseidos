/**
 * Low-HP heartbeat stub headless — intervalo y beats, sin AudioContext.
 * Activo solo si 0 < hp/max < HEARTBEAT_HP_RATIO; si no, intervalo null.
 */

export const HEARTBEAT_HP_RATIO = 0.35;

/** Intervalo cerca del umbral (ratio → 0.35). */
const INTERVAL_SLOW_SEC = 1.2;
/** Intervalo cerca de 0 HP (ratio → 0). */
const INTERVAL_FAST_SEC = 0.45;

const DEFAULT_MAX_HP = 100;

export type HeartbeatBus = {
  /** Acumulado hacia el próximo beat (s). */
  acc: number;
};

export function createHeartbeatBus(): HeartbeatBus {
  return { acc: 0 };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Segundos entre beats, o null si no hay heartbeat.
 * hp ≤ 0 o ratio ≥ HEARTBEAT_HP_RATIO → null.
 * Si no: lerp 1.2s (cerca del umbral) → 0.45s (cerca de 0).
 */
export function heartbeatIntervalSec(
  hp: number,
  maxHp = DEFAULT_MAX_HP,
): number | null {
  if (!Number.isFinite(hp) || hp <= 0) return null;
  if (!Number.isFinite(maxHp) || maxHp <= 0) return null;
  const ratio = hp / maxHp;
  if (ratio >= HEARTBEAT_HP_RATIO) return null;
  const t = ratio / HEARTBEAT_HP_RATIO;
  return lerp(INTERVAL_FAST_SEC, INTERVAL_SLOW_SEC, t);
}

/**
 * Avanza el acumulador. `{ beat: true }` cuando toca un latido.
 * Intervalo null (HP ok o muerto) → resetea acc, no beat.
 */
export function tickHeartbeat(
  bus: HeartbeatBus,
  hp: number,
  dt: number,
  maxHp = DEFAULT_MAX_HP,
): { beat: boolean } {
  const interval = heartbeatIntervalSec(hp, maxHp);
  if (interval === null) {
    bus.acc = 0;
    return { beat: false };
  }
  if (!Number.isFinite(dt) || dt < 0) dt = 0;
  bus.acc += dt;
  if (bus.acc >= interval) {
    bus.acc -= interval;
    return { beat: true };
  }
  return { beat: false };
}
