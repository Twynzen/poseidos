/**
 * Eventos de ruido en el mundo: posición, radio, TTL.
 * Acciones del player (y combate) emiten; hostiles oyen si dist ≤ radio.
 * Headless — sin Three.
 */

export type NoiseSource =
  | "walk"
  | "run"
  | "door"
  | "loot"
  | "barricade"
  | "attack"
  | "gun";

export interface NoiseEvent {
  id: number;
  x: number;
  y: number;
  radius: number;
  /** Segundos restantes. */
  ttl: number;
  source: NoiseSource;
}

/** Radios / TTL por tipo de acción (calibra atracción muda). */
export const NOISE_PRESETS: Record<
  NoiseSource,
  { radius: number; ttl: number }
> = {
  walk: { radius: 2.5, ttl: 0.35 },
  run: { radius: 6, ttl: 0.45 },
  door: { radius: 8, ttl: 1.2 },
  loot: { radius: 4, ttl: 0.9 },
  barricade: { radius: 7, ttl: 1.2 },
  attack: { radius: 10, ttl: 1.5 },
  /** Disparo: radio grande, atrae hostiles lejos. */
  gun: { radius: 18, ttl: 2.2 },
};

export interface NoiseEmitOpts {
  radius?: number;
  ttl?: number;
}

/**
 * Bus de ruido activo en la sim.
 * `tick(dt)` decae TTL; `heardFrom` elige el más relevante para un oyente.
 */
export class NoiseBus {
  readonly events: NoiseEvent[] = [];
  private nextId = 1;

  emit(
    x: number,
    y: number,
    source: NoiseSource,
    opts: NoiseEmitOpts = {},
  ): NoiseEvent {
    const preset = NOISE_PRESETS[source];
    const ev: NoiseEvent = {
      id: this.nextId++,
      x,
      y,
      radius: opts.radius ?? preset.radius,
      ttl: opts.ttl ?? preset.ttl,
      source,
    };
    this.events.push(ev);
    return ev;
  }

  /** Atajos tipados. */
  emitWalk(x: number, y: number): NoiseEvent {
    return this.emit(x, y, "walk");
  }
  emitRun(x: number, y: number): NoiseEvent {
    return this.emit(x, y, "run");
  }
  emitDoor(x: number, y: number): NoiseEvent {
    return this.emit(x, y, "door");
  }
  emitLoot(x: number, y: number): NoiseEvent {
    return this.emit(x, y, "loot");
  }
  emitBarricade(x: number, y: number): NoiseEvent {
    return this.emit(x, y, "barricade");
  }
  emitAttack(x: number, y: number): NoiseEvent {
    return this.emit(x, y, "attack");
  }
  emitGun(x: number, y: number): NoiseEvent {
    return this.emit(x, y, "gun");
  }

  /** Decae y elimina eventos expirados. */
  tick(dt: number): void {
    if (dt <= 0 || this.events.length === 0) return;
    for (let i = this.events.length - 1; i >= 0; i--) {
      const e = this.events[i]!;
      e.ttl -= dt;
      if (e.ttl <= 0) this.events.splice(i, 1);
    }
  }

  clear(): void {
    this.events.length = 0;
  }

  /**
   * Evento que oye el oyente en (hx,hy): dentro del radio, prioriza
   * mayor radio residual (más “fuerte”), desempate por cercanía.
   */
  heardFrom(hx: number, hy: number): NoiseEvent | null {
    let best: NoiseEvent | null = null;
    let bestScore = -Infinity;
    for (const e of this.events) {
      const d = Math.hypot(e.x - hx, e.y - hy);
      if (d > e.radius) continue;
      // Score: radio - distancia (más cerca del centro / más fuerte gana)
      const score = e.radius - d + e.ttl * 0.1;
      if (score > bestScore) {
        bestScore = score;
        best = e;
      }
    }
    return best;
  }

  /** Evento más fuerte aún vivo (HUD / debug). */
  loudest(): NoiseEvent | null {
    let best: NoiseEvent | null = null;
    for (const e of this.events) {
      if (!best || e.radius > best.radius || (e.radius === best.radius && e.ttl > best.ttl)) {
        best = e;
      }
    }
    return best;
  }
}
