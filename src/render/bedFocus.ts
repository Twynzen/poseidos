/**
 * Escala + pulso del anillo de cama más cercana — headless.
 * worldView aplica el mul al grupo de la bed en reach.
 */

/** Radio de foco (= reach de cama). */
export const BED_FOCUS_REACH = 1.5;

/** Escala encima de la cama (dist 0; 1.5525 × 1.15, para leerse de noche). */
export const BED_FOCUS_SCALE_NEAR = 1.785375;

/** Escala en el borde de reach (1.288 × 1.15, para leerse de noche). */
export const BED_FOCUS_SCALE_FAR = 1.4812;

/** Amplitud del seno (0.0575 × 1.15, para leerse de noche). */
export const BED_FOCUS_PULSE_AMP = 0.066125;

/** Velocidad angular del pulso (rad/s; 6 × 1.15, para leerse de noche). */
export const BED_FOCUS_PULSE_SPEED = 6.9;

/** Letra de tecla en el floatBadge de cama. */
export const bedBadgeLabel = "Z";

/** Font px del canvas de la letra Z (80 × 1.15, para leerse de noche). */
export const bedBadgeFontPx = 92;

/** Escala world de la letra Z (2.4 × 1.15, para leerse de noche). */
export const bedBadgeLetterScale = 2.76;

/** Escala del disc de cama (1.5 × 1.15 vs badge compartido, para leerse de noche). */
export const bedBadgeDiscScale = 1.725;

/** Altura world del floatBadge Z (2.3 × 1.15, para leerse de noche; queda por encima del Soldier 1.5). */
export const bedBadgeY = 2.645;

/**
 * HAS MUERTO / F9 load-muerto: no pulso cama (anillo+escala) sobre el cadáver.
 * Vivo (incl. F9 load-vivo): en reach pulsa igual que hoy.
 * Ya apagado = no-op; gameOver no inventa pulso.
 */
export function bedFocusApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/** True si dist está en reach (incl. el borde). */
export function bedFocusInReach(dist: number): boolean {
  return Number.isFinite(dist) && dist <= BED_FOCUS_REACH;
}

/**
 * 1.785375 en dist 0 · 1.4812 en reach 1.5 · 1.0 fuera.
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

/** 1 + 0.066125 * sin(elapsed * 6.9). */
export function bedFocusPulse(elapsed: number): number {
  const t = Number.isFinite(elapsed) ? elapsed : 0;
  return 1 + BED_FOCUS_PULSE_AMP * Math.sin(t * BED_FOCUS_PULSE_SPEED);
}

/** scale * pulse si está en reach; si no, 1 (sin pulso). gameOver → 1. */
export function bedFocusMul(
  dist: number,
  elapsed: number,
  gameOver = false,
): number {
  if (!bedFocusApplies(gameOver)) return 1;
  if (!bedFocusInReach(dist)) return 1;
  return bedFocusScale(dist) * bedFocusPulse(elapsed);
}

/** Anillo púrpura sleep solo si la cama está en reach. gameOver → hidden. */
export function bedRingVisible(
  dist: number,
  reach: number = BED_FOCUS_REACH,
  gameOver = false,
): boolean {
  if (!bedFocusApplies(gameOver)) return false;
  if (!Number.isFinite(dist) || !Number.isFinite(reach) || reach <= 0) {
    return false;
  }
  return dist <= reach;
}

/** Spawn barrio (neighborhood 24.5, 15.5). Three default ring visible / scale 1 = leftover. */
export const BED_FOCUS_LOOK_X_SPAWN = 24.5;
export const BED_FOCUS_LOOK_Z_SPAWN = 15.5;

/**
 * Look X que lee syncBedFocus (wx fresco o vivo).
 * leftover mid-life (ctor origin 0 / far 40) ≠ look fresco (spawn 24.5).
 */
export function bedFocusLookXFromLook(wx: number): number {
  return wx;
}

/**
 * Look Z que lee syncBedFocus (wy fresco o vivo).
 * leftover mid-life (ctor origin 0 / far 30) ≠ look fresco (spawn 15.5).
 */
export function bedFocusLookZFromLook(wy: number): number {
  return wy;
}

/**
 * Distancia look→cama que lee syncBedFocus (look fresco o vivo).
 * leftover ctor hypot(0, bed) / far / dist 0 ≠ dist fresco (spawn).
 */
export function bedFocusDistFromLook(
  wx: number,
  wy: number,
  mx: number,
  my: number,
): number {
  return Math.hypot(
    bedFocusLookXFromLook(wx) - mx,
    bedFocusLookZFromLook(wy) - my,
  );
}

/**
 * Pulso elapsed que lee syncBedFocus (elapsed fresco o vivo).
 * leftover mid-life (π/2 phase) ≠ elapsed fresco (0).
 */
export function bedFocusElapsedFromLook(elapsed: number): number {
  return Number.isFinite(elapsed) ? elapsed : 0;
}

/**
 * Mul que lee syncBedFocus (look fresco o vivo).
 * leftover ctor scale 1 / mid-pulse ≠ mul fresco (spawn + elapsed 0).
 */
export function bedFocusMulFromLook(
  dist: number,
  elapsed: number,
  gameOver = false,
): number {
  return bedFocusMul(dist, bedFocusElapsedFromLook(elapsed), gameOver);
}

/**
 * Anillo que lee syncBedFocus (look fresco o vivo).
 * leftover ctor Three visible / dist 0 ≠ anillo fresco (solo reach).
 */
export function bedRingVisibleFromLook(
  dist: number,
  gameOver = false,
): boolean {
  return bedRingVisible(dist, BED_FOCUS_REACH, gameOver);
}

/**
 * R / softReset: look X fresco (spawn 24.5).
 * WorldView nace applyBedFocusLook(bedFocusLookXAfterRestart(), …);
 * leftover ctor origin 0 / Three ring visible no filtra.
 * syncBedFocus lee bedFocusLookXFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function bedFocusLookXAfterRestart(
  wx = BED_FOCUS_LOOK_X_SPAWN,
): number {
  return bedFocusLookXFromLook(wx);
}

/**
 * R / softReset: look Z fresco (spawn 15.5).
 * WorldView nace applyBedFocusLook(…, bedFocusLookZAfterRestart(), …);
 * leftover ctor origin 0 no filtra.
 */
export function bedFocusLookZAfterRestart(
  wy = BED_FOCUS_LOOK_Z_SPAWN,
): number {
  return bedFocusLookZFromLook(wy);
}

/**
 * R / softReset: elapsed fresco (0).
 * WorldView nace `bedFocusElapsed = bedFocusElapsedAfterRestart()`;
 * leftover mid-pulse de la vida anterior no filtra.
 */
export function bedFocusElapsedAfterRestart(): number {
  return bedFocusElapsedFromLook(0);
}

/**
 * R / softReset: mul fresco (spawn + elapsed 0).
 * leftover ctor scale 1 / mid-pulse no filtra.
 */
export function bedFocusMulAfterRestart(
  dist: number,
  gameOver = false,
): number {
  return bedFocusMulFromLook(dist, bedFocusElapsedAfterRestart(), gameOver);
}

/**
 * R / softReset: anillo fresco (solo reach desde spawn).
 * leftover ctor Three visible / dist 0 no filtra.
 */
export function bedRingVisibleAfterRestart(
  dist: number,
  gameOver = false,
): boolean {
  return bedRingVisibleFromLook(dist, gameOver);
}

/**
 * R / softReset: dist fresco (cama vs spawn).
 * leftover ctor origin 0,0 / dist 0 / far 40,30 no filtra.
 */
export function bedFocusDistAfterRestart(
  mx: number,
  my: number,
  wx = BED_FOCUS_LOOK_X_SPAWN,
  wy = BED_FOCUS_LOOK_Z_SPAWN,
): number {
  return bedFocusDistFromLook(
    bedFocusLookXAfterRestart(wx),
    bedFocusLookZAfterRestart(wy),
    mx,
    my,
  );
}
