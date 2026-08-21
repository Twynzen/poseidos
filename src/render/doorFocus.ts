/**
 * Escala + pulso del anillo de puerta más cercana — headless.
 * worldView aplica el mul al grupo de la door en reach.
 */

/** Radio de foco (= reach de puerta). */
export const DOOR_FOCUS_REACH = 1.6;

/** Escala encima de la puerta (dist 0; 1.5525 × 1.15, para leerse de noche). */
export const DOOR_FOCUS_SCALE_NEAR = 1.785375;

/** Escala en el borde de reach (1.288 × 1.15, para leerse de noche). */
export const DOOR_FOCUS_SCALE_FAR = 1.4812;

/** Amplitud del seno (0.0575 × 1.15, para leerse de noche). */
export const DOOR_FOCUS_PULSE_AMP = 0.066125;

/** Velocidad angular del pulso (rad/s; 6 × 1.15, para leerse de noche). */
export const DOOR_FOCUS_PULSE_SPEED = 6.9;

/** Letra de tecla en el floatBadge de puerta. */
export const doorBadgeLabel = "E";

/** Font px del canvas de la letra E (80 × 1.15, para leerse de noche). */
export const doorBadgeFontPx = 92;

/** Escala world de la letra E (2.4 × 1.15, para leerse de noche). */
export const doorBadgeLetterScale = 2.76;

/** Escala del disc de puerta (1.5 × 1.15 vs badge compartido, para leerse de noche). */
export const doorBadgeDiscScale = 1.725;

/** Altura world del floatBadge E (2.3 × 1.15, para leerse de noche; queda por encima del Soldier 1.5). */
export const doorBadgeY = 2.645;

/**
 * HAS MUERTO / F9 load-muerto: no pulso puerta (anillo+escala) sobre el cadáver.
 * Vivo (incl. F9 load-vivo): en reach pulsa igual que hoy.
 * Ya apagado = no-op; gameOver no inventa pulso.
 */
export function doorFocusApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/** True si dist está en reach (incl. el borde). */
export function doorFocusInReach(dist: number): boolean {
  return Number.isFinite(dist) && dist <= DOOR_FOCUS_REACH;
}

/**
 * 1.785375 en dist 0 · 1.4812 en reach 1.6 · 1.0 fuera.
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

/** 1 + 0.066125 * sin(elapsed * 6.9). */
export function doorFocusPulse(elapsed: number): number {
  const t = Number.isFinite(elapsed) ? elapsed : 0;
  return 1 + DOOR_FOCUS_PULSE_AMP * Math.sin(t * DOOR_FOCUS_PULSE_SPEED);
}

/** scale * pulse si está en reach; si no, 1 (sin pulso). gameOver → 1. */
export function doorFocusMul(
  dist: number,
  elapsed: number,
  gameOver = false,
): number {
  if (!doorFocusApplies(gameOver)) return 1;
  if (!doorFocusInReach(dist)) return 1;
  return doorFocusScale(dist) * doorFocusPulse(elapsed);
}

/**
 * Anillo steel blue-grey si la puerta está en reach.
 * `open` se ignora: abierta o cerrada, ambas se muestran en alcance.
 * gameOver → hidden.
 */
export function doorRingVisible(
  _open: boolean,
  dist: number,
  reach: number = DOOR_FOCUS_REACH,
  gameOver = false,
): boolean {
  if (!doorFocusApplies(gameOver)) return false;
  if (!Number.isFinite(dist) || !Number.isFinite(reach) || reach <= 0) {
    return false;
  }
  return dist <= reach;
}
