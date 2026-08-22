/**
 * Yaw visual del Soldier GLB del player (headless).
 *
 * Convención mundo/input:
 * - W → faceZ = −1 (Three −Z / norte mapa)
 * - S → faceZ = +1 (Three +Z / sur mapa)
 * - `atan2(faceX, faceZ)` con S (+Z) → 0
 *
 * El Soldier.glb (Mixamo-ish) camina hacia −Z local: con offset 0,
 * S mueve el cuerpo al sur pero la animación camina al norte (moonwalk).
 * `PLAYER_GLTF_YAW_OFFSET = π` alinea el clip walk con el delta.
 *
 * Chevron / linterna / muzzle usan el yaw ya offseteado — no reaplicar.
 */

/** Offset yaw (rad) añadido a atan2. π = GLB walk invertido vs +Z mundo. */
export const PLAYER_GLTF_YAW_OFFSET = Math.PI;

const MOVE_EPS = 1e-8;

/**
 * Yaw Y (rad) para orientar el GLB del player según movimiento.
 * `faceX` / `faceZ`: delta mapa X / mapa Y (= Three z), tip. ejes vivos.
 * `null` si no hay dirección válida (conservar yaw previo).
 */
export function playerGltfYawFromMove(
  faceX: number,
  faceZ: number,
  offset: number = PLAYER_GLTF_YAW_OFFSET,
): number | null {
  if (!Number.isFinite(faceX) || !Number.isFinite(faceZ)) return null;
  if (!Number.isFinite(offset)) return null;
  if (Math.abs(faceX) < MOVE_EPS && Math.abs(faceZ) < MOVE_EPS) return null;
  return Math.atan2(faceX, faceZ) + offset;
}

/** Spawn barrio (neighborhood 24.5, 15.5). Three default origin 0,0 = leftover. */
export const PLAYER_POS_X_SPAWN = 24.5;
export const PLAYER_POS_Z_SPAWN = 15.5;

/**
 * Pos X que lee syncPlayer (wx fresco o vivo).
 * leftover mid-life (ctor origin 0 / far 40) ≠ pos fresco (spawn 24.5).
 */
export function playerPosXFromLook(wx: number): number {
  return wx;
}

/**
 * Pos Z que lee syncPlayer (wy fresco o vivo; mapa y = Three z).
 * leftover mid-life (ctor origin 0 / far 30) ≠ pos fresco (spawn 15.5).
 */
export function playerPosZFromLook(wz: number): number {
  return wz;
}

/**
 * R / softReset: pos X fresco (spawn 24.5).
 * WorldView nace `playerMesh.position.set(playerPosXAfterRestart(), 0, …)`;
 * leftover ctor origin 0,0 no filtra.
 * syncPlayer lee playerPosXFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function playerPosXAfterRestart(wx = PLAYER_POS_X_SPAWN): number {
  return playerPosXFromLook(wx);
}

/**
 * R / softReset: pos Z fresco (spawn 15.5).
 * WorldView nace `playerMesh.position.set(…, 0, playerPosZAfterRestart())`;
 * leftover ctor origin 0,0 no filtra.
 * syncPlayer lee playerPosZFromLook. F9 / enterGameOver / freeze death no assign.
 */
export function playerPosZAfterRestart(wz = PLAYER_POS_Z_SPAWN): number {
  return playerPosZFromLook(wz);
}
