/**
 * Yaw del GLB del player desde ejes de movimiento (mapa x / Three z).
 * Soldier forward = +Z; W => faceZ=-1 => atan2(0, -1) = π.
 *
 * `PLAYER_GLTF_YAW_OFFSET` es un knob de calibración documentado (default 0):
 * atan2 ya alinea W→π; sumar offset solo si un asset futuro tiene forward distinto.
 */

/** Knob de calibración (rad). Default 0 — atan2 ya maneja W→π. */
export const PLAYER_GLTF_YAW_OFFSET = 0;

const FACE_EPS = 1e-8;

/**
 * Yaw GLB desde ejes de movimiento vivos (no cardinal cuantizado).
 * `null` si ejes ~0 o no finitos (mantener yaw previo).
 */
export function playerGltfYawFromMove(
  faceX: number,
  faceZ: number,
  offset: number = PLAYER_GLTF_YAW_OFFSET,
): number | null {
  if (!Number.isFinite(faceX) || !Number.isFinite(faceZ)) return null;
  if (Math.abs(faceX) < FACE_EPS && Math.abs(faceZ) < FACE_EPS) return null;
  const off = Number.isFinite(offset) ? offset : 0;
  return Math.atan2(faceX, faceZ) + off;
}
