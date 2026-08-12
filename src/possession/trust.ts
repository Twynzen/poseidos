/**
 * Trust 0–100 por poseído (arranque F5).
 * Alto → pacificado; muy bajo → más agresivo. Headless.
 */

export const TRUST_MIN = 0;
export const TRUST_MAX = 100;
/** Arranque medio. */
export const TRUST_DEFAULT = 50;
/** ≥ esto: no chase / no ataca. */
export const TRUST_PACIFY = 70;
/** ≤ esto: más agresivo. */
export const TRUST_AGGRO = 25;

export interface HostileAttitude {
  /** Sin chase ni toque; ignora visión/ruido hostil. */
  pacified: boolean;
  /** Multiplicador de velocidad de persecución/wander. */
  speedMul: number;
  /** Multiplicador de cooldown de ataque (<1 = pega más seguido). */
  attackCdMul: number;
  /** Multiplicador de daño por toque. */
  damageMul: number;
}

export function clampTrust(value: number): number {
  if (Number.isNaN(value)) return TRUST_DEFAULT;
  return Math.max(TRUST_MIN, Math.min(TRUST_MAX, Math.round(value)));
}

export function isPacified(trust: number): boolean {
  return trust >= TRUST_PACIFY;
}

export function isAggressive(trust: number): boolean {
  return trust <= TRUST_AGGRO;
}

/** Perfil de actitud derivado del trust (para HostileSim). */
export function attitudeFromTrust(trust: number): HostileAttitude {
  if (isPacified(trust)) {
    return {
      pacified: true,
      speedMul: 0.85,
      attackCdMul: 1,
      damageMul: 0,
    };
  }
  if (isAggressive(trust)) {
    // Fear is speedMul (chase/wander), not burst DPS.
    return {
      pacified: false,
      speedMul: 1.35,
      attackCdMul: 0.9,
      damageMul: 1.0,
    };
  }
  return {
    pacified: false,
    speedMul: 1,
    attackCdMul: 1,
    damageMul: 1,
  };
}

/**
 * Ledger de trust por entityId (solo poseídos en la práctica).
 */
export class TrustLedger {
  private readonly values = new Map<string, number>();

  register(id: string, initial: number = TRUST_DEFAULT): number {
    if (!this.values.has(id)) {
      this.values.set(id, clampTrust(initial));
    }
    return this.values.get(id)!;
  }

  unregister(id: string): void {
    this.values.delete(id);
  }

  clear(): void {
    this.values.clear();
  }

  has(id: string): boolean {
    return this.values.has(id);
  }

  /** Ids registrados en el ledger. */
  ids(): readonly string[] {
    return [...this.values.keys()];
  }

  get(id: string): number {
    return this.values.get(id) ?? TRUST_DEFAULT;
  }

  set(id: string, value: number): number {
    const v = clampTrust(value);
    this.values.set(id, v);
    return v;
  }

  adjust(id: string, delta: number): number {
    const next = this.get(id) + delta;
    return this.set(id, next);
  }

  attitude(id: string): HostileAttitude {
    return attitudeFromTrust(this.get(id));
  }

  /** Snapshot para pasar a HostileSim.tick. */
  attitudes(): Map<string, HostileAttitude> {
    const out = new Map<string, HostileAttitude>();
    for (const id of this.values.keys()) {
      out.set(id, this.attitude(id));
    }
    return out;
  }
}
