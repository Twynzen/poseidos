/**
 * Escala + pulso del anillo de cama más cercana — headless.
 * worldView aplica el mul al grupo de la bed en reach.
 */

/** Radio de foco (= reach de cama). */
export const BED_FOCUS_REACH = 1.5;

/** Escala encima de la cama (dist 0). */
export const BED_FOCUS_SCALE_NEAR = 1.35;

/** Escala en el borde de reach. */
export const BED_FOCUS_SCALE_FAR = 1.12;

/** Amplitud del seno. */
export const BED_FOCUS_PULSE_AMP = 0.08;

/** Velocidad angular del pulso (rad/s). */
export const BED_FOCUS_PULSE_SPEED = 6;

/** True si dist está en reach (incl. el borde). */
export function bedFocusInReach(dist: number): boolean {
  return Number.isFinite(dist) && dist <= BED_FOCUS_REACH;
}

/**
 * 1.35 en dist 0 · 1.12 en reach 1.5 · 1.0 fuera.
 * Lerp lineal entre near y far dentro de reach.
 */
export function bedFocusScale(dist: number): number {
  if (!bedFocusInReach(dist)) return 1;
  const d = Math.max(0, dist);
  const t = BED_FOCUS_REACH > 0 ? d / BED_FOCUS_REACH : 1;
  return (
    BED_FOCUS_SCALE_NEAR +
    (BED_FOCUS_SCALE_FAR - BED_FOCUS_SCALE_NEAR) * t
  );
}

/** 1 + 0.08 * sin(elapsed * 6). */
export function bedFocusPulse(elapsed: number): number {
  const t = Number.isFinite(elapsed) ? elapsed : 0;
  return 1 + BED_FOCUS_PULSE_AMP * Math.sin(t * BED_FOCUS_PULSE_SPEED);
}

/** scale * pulse si está en reach; si no, 1 (sin pulso). */
export function bedFocusMul(dist: number, elapsed: number): number {
  if (!bedFocusInReach(dist)) return 1;
  return bedFocusScale(dist) * bedFocusPulse(elapsed);
}

/** Anillo rosa solo si la cama está en reach. */
export function bedRingVisible(
  dist: number,
  reach: number = BED_FOCUS_REACH,
): boolean {
  if (!Number.isFinite(dist) || !Number.isFinite(reach) || reach <= 0) {
    return false;
  }
  return dist <= reach;
}
