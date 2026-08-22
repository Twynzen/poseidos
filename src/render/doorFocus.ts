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

/** Spawn barrio (neighborhood 24.5, 15.5). Three default ring visible / scale 1 = leftover. */
export const DOOR_FOCUS_LOOK_X_SPAWN = 24.5;
export const DOOR_FOCUS_LOOK_Z_SPAWN = 15.5;

/**
 * Look X que lee syncDoorFocus (wx fresco o vivo).
 * leftover mid-life (ctor origin 0 / far 40) ≠ look fresco (spawn 24.5).
 */
export function doorFocusLookXFromLook(wx: number): number {
  return wx;
}

/**
 * Look Z que lee syncDoorFocus (wy fresco o vivo).
 * leftover mid-life (ctor origin 0 / far 30) ≠ look fresco (spawn 15.5).
 */
export function doorFocusLookZFromLook(wy: number): number {
  return wy;
}

/**
 * Distancia look→puerta que lee syncDoorFocus (look fresco o vivo).
 * leftover ctor hypot(0, door) / far / dist 0 ≠ dist fresco (spawn).
 */
export function doorFocusDistFromLook(
  wx: number,
  wy: number,
  mx: number,
  my: number,
): number {
  return Math.hypot(
    doorFocusLookXFromLook(wx) - mx,
    doorFocusLookZFromLook(wy) - my,
  );
}

/**
 * Pulso elapsed que lee syncDoorFocus (elapsed fresco o vivo).
 * leftover mid-life (π/2 phase) ≠ elapsed fresco (0).
 */
export function doorFocusElapsedFromLook(elapsed: number): number {
  return Number.isFinite(elapsed) ? elapsed : 0;
}

/**
 * Mul que lee syncDoorFocus (look fresco o vivo).
 * leftover ctor scale 1 / mid-pulse ≠ mul fresco (spawn + elapsed 0).
 */
export function doorFocusMulFromLook(
  dist: number,
  elapsed: number,
  gameOver = false,
): number {
  return doorFocusMul(dist, doorFocusElapsedFromLook(elapsed), gameOver);
}

/**
 * Anillo que lee syncDoorFocus (look fresco o vivo).
 * leftover ctor Three visible / dist 0 ≠ anillo fresco (solo reach).
 */
export function doorRingVisibleFromLook(
  open: boolean,
  dist: number,
  gameOver = false,
): boolean {
  return doorRingVisible(open, dist, DOOR_FOCUS_REACH, gameOver);
}

/**
 * R / softReset: look X fresco (spawn 24.5).
 * WorldView nace applyDoorFocusLook(doorFocusLookXAfterRestart(), …);
 * leftover ctor origin 0 / Three ring visible no filtra.
 * syncDoorFocus lee doorFocusLookXFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function doorFocusLookXAfterRestart(
  wx = DOOR_FOCUS_LOOK_X_SPAWN,
): number {
  return doorFocusLookXFromLook(wx);
}

/**
 * R / softReset: look Z fresco (spawn 15.5).
 * WorldView nace applyDoorFocusLook(…, doorFocusLookZAfterRestart(), …);
 * leftover ctor origin 0 no filtra.
 */
export function doorFocusLookZAfterRestart(
  wy = DOOR_FOCUS_LOOK_Z_SPAWN,
): number {
  return doorFocusLookZFromLook(wy);
}

/**
 * R / softReset: elapsed fresco (0).
 * WorldView nace `doorFocusElapsed = doorFocusElapsedAfterRestart()`;
 * leftover mid-pulse de la vida anterior no filtra.
 */
export function doorFocusElapsedAfterRestart(): number {
  return doorFocusElapsedFromLook(0);
}

/**
 * R / softReset: mul fresco (spawn + elapsed 0).
 * leftover ctor scale 1 / mid-pulse no filtra.
 */
export function doorFocusMulAfterRestart(
  dist: number,
  gameOver = false,
): number {
  return doorFocusMulFromLook(dist, doorFocusElapsedAfterRestart(), gameOver);
}

/**
 * R / softReset: anillo fresco (solo reach desde spawn).
 * leftover ctor Three visible / dist 0 no filtra.
 */
export function doorRingVisibleAfterRestart(
  open: boolean,
  dist: number,
  gameOver = false,
): boolean {
  return doorRingVisibleFromLook(open, dist, gameOver);
}

/**
 * R / softReset: dist fresco (puerta vs spawn).
 * leftover ctor origin 0,0 / dist 0 / far 40,30 no filtra.
 */
export function doorFocusDistAfterRestart(
  mx: number,
  my: number,
  wx = DOOR_FOCUS_LOOK_X_SPAWN,
  wy = DOOR_FOCUS_LOOK_Z_SPAWN,
): number {
  return doorFocusDistFromLook(
    doorFocusLookXAfterRestart(wx),
    doorFocusLookZAfterRestart(wy),
    mx,
    my,
  );
}
