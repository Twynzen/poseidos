/**
 * Salud del cuerpo (F3). Escala 0–100: 0 = muerto → game-over en Game.
 * Separado de needs (hambre/sed/cansancio).
 */

export interface BodyState {
  health: number;
}

export const MAX_HEALTH = 100;

/** HP por defecto de amenaza muda. */
export const HOSTILE_MAX_HEALTH = 40;

/** Daño por toque de amenaza muda. */
export const TOUCH_DAMAGE = 12;

function clampHealth(v: number, max = MAX_HEALTH): number {
  if (v < 0) return 0;
  if (v > max) return max;
  return v;
}

export function createBody(initial?: Partial<BodyState>): BodyState {
  return {
    health: clampHealth(initial?.health ?? MAX_HEALTH),
  };
}

/** Aplica daño; devuelve health resultante. */
export function applyDamage(body: BodyState, amount: number): number {
  if (amount <= 0) return body.health;
  body.health = clampHealth(body.health - amount);
  return body.health;
}

/** Cura; devuelve health resultante. */
export function heal(body: BodyState, amount: number): number {
  if (amount <= 0) return body.health;
  body.health = clampHealth(body.health + amount);
  return body.health;
}

export function isAlive(body: BodyState): boolean {
  return body.health > 0;
}

export function bodySnapshot(body: BodyState): BodyState {
  return { health: body.health };
}
