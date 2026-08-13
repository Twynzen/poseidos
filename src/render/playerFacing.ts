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
