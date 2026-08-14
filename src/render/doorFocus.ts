/**
 * Escala + pulso del anillo de puerta más cercana — headless.
 * worldView aplica el mul al grupo de la door en reach.
 */

/** Radio de foco (= reach de puerta). */
export const DOOR_FOCUS_REACH = 1.6;

/** Escala encima de la puerta (dist 0; 1.35 × 1.15, para leerse de noche). */
export const DOOR_FOCUS_SCALE_NEAR = 1.5525;

/** Escala en el borde de reach (1.12 × 1.15, para leerse de noche). */
export const DOOR_FOCUS_SCALE_FAR = 1.288;

/** Amplitud del seno (0.05 × 1.15, para leerse de noche). */
export const DOOR_FOCUS_PULSE_AMP = 0.0575;

/** Velocidad angular del pulso (rad/s). */
export const DOOR_FOCUS_PULSE_SPEED = 6;

/** Letra de tecla en el floatBadge de puerta. */
export const doorBadgeLabel = "E";

/** Font px del canvas de la letra E (80 × 1.15, para leerse de noche). */
export const doorBadgeFontPx = 92;

/** Escala world de la letra E (2.4 × 1.15, para leerse de noche). */
export const doorBadgeLetterScale = 2.76;

/** Escala del disc de puerta (1.5 × 1.15 vs badge compartido, para leerse de noche). */
export const doorBadgeDiscScale = 1.725;

/** Altura world del floatBadge E (queda por encima del Soldier 1.5). */
export const doorBadgeY = 2.3;

/** True si dist está en reach (incl. el borde). */
export function doorFocusInReach(dist: number): boolean {
  return Number.isFinite(dist) && dist <= DOOR_FOCUS_REACH;
}

/**
 * 1.5525 en dist 0 · 1.288 en reach 1.6 · 1.0 fuera.
 * Lerp lineal entre near y far dentro de reach.
 */
export function doorFocusScale(dist: number): number {
  if (!doorFocusInReach(dist)) return 1;
  const d = Math.max(0, dist);
  const t = DOOR_FOCUS_REACH > 0 ? d / DOOR_FOCUS_REACH : 1;
  return (
    DOOR_FOCUS_SCALE_NEAR +
    (DOOR_FOCUS_SCALE_FAR - DOOR_FOCUS_SCALE_NEAR) * t
  );
}

/** 1 + 0.0575 * sin(elapsed * 6). */
export function doorFocusPulse(elapsed: number): number {
  const t = Number.isFinite(elapsed) ? elapsed : 0;
  return 1 + DOOR_FOCUS_PULSE_AMP * Math.sin(t * DOOR_FOCUS_PULSE_SPEED);
}

/** scale * pulse si está en reach; si no, 1 (sin pulso). */
export function doorFocusMul(dist: number, elapsed: number): number {
  if (!doorFocusInReach(dist)) return 1;
  return doorFocusScale(dist) * doorFocusPulse(elapsed);
}

/**
 * Anillo steel blue-grey si la puerta está en reach.
 * `open` se ignora: abierta o cerrada, ambas se muestran en alcance.
 */
export function doorRingVisible(
  _open: boolean,
  dist: number,
  reach: number = DOOR_FOCUS_REACH,
): boolean {
  if (!Number.isFinite(dist) || !Number.isFinite(reach) || reach <= 0) {
    return false;
  }
  return dist <= reach;
}
