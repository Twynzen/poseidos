/**
 * Daño por needs críticos (hambre/sed al tope).
 * Escala needs 0–100; al llegar a NEED_DAMAGE_THRESHOLD el player pierde HP/s.
 * Fatigue NO hace daño HP en este slice (solo moodle / cansancio).
 *
 * Nota moodles: NEED_CRITICAL en moodles.ts es 70 (UI “critical” temprana).
 * El daño de supervivencia solo aplica al tope 100 (NEED_DAMAGE_THRESHOLD).
 */

export const NEED_DAMAGE_THRESHOLD = 100;

/** HP/s si hunger >= umbral. */
export const STARVE_DPS = 2;

/** HP/s si thirst >= umbral (sed mata más rápido, flavor PZ-ish). */
export const DEHYDRATE_DPS = 3;

export interface NeedsDamageInput {
  hunger: number;
  thirst: number;
}

export interface NeedsDamageResult {
  /** Daño total este tick (DPS * dt). */
  amount: number;
  starve: boolean;
  dehydrate: boolean;
}

/** Suma DPS aplicables (0 si ninguno crítico). Fatigue ignorado. */
export function needsDamagePerSecond(needs: NeedsDamageInput): number {
  let dps = 0;
  if (needs.hunger >= NEED_DAMAGE_THRESHOLD) dps += STARVE_DPS;
  if (needs.thirst >= NEED_DAMAGE_THRESHOLD) dps += DEHYDRATE_DPS;
  return dps;
}

/**
 * Calcula daño de supervivencia para este frame.
 * El caller aplica `player.takeDamage(result.amount)` si amount > 0.
 */
export function computeNeedsDamage(
  needs: NeedsDamageInput,
  dt: number,
): NeedsDamageResult {
  const starve = needs.hunger >= NEED_DAMAGE_THRESHOLD;
  const dehydrate = needs.thirst >= NEED_DAMAGE_THRESHOLD;
  if (dt <= 0 || (!starve && !dehydrate)) {
    return { amount: 0, starve, dehydrate };
  }
  let dps = 0;
  if (starve) dps += STARVE_DPS;
  if (dehydrate) dps += DEHYDRATE_DPS;
  return { amount: dps * dt, starve, dehydrate };
}

/** Mensaje HUD según razones activas (sin spam — el caller controla cooldown). */
export function needsDamageHudMessage(d: NeedsDamageResult): string | null {
  if (d.amount <= 0) return null;
  if (d.starve && d.dehydrate) return "hambre y sed te debilitan";
  if (d.starve) return "hambre te debilita";
  if (d.dehydrate) return "sed te debilita";
  return null;
}

/** Cooldown sugerido entre mensajes de needs-damage en HUD (~2s). */
export const NEEDS_DAMAGE_MSG_CD = 2;
