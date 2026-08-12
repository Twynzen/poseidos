/**
 * Escala visual de mute/poseído (caja procedural) vs Soldier GLB.
 * 1.5 ≈ legibilidad isométrica comparable a PLAYER_SOLDIER_MANIFEST.scale.
 * Markers/rings van en el root y heredan el scale.
 */
export const HOSTILE_VISUAL_SCALE = 1.5;

const FACE_EPS = 1e-8;

/**
 * Yaw de facing para hostiles (Soldier forward = +Z).
 * `Math.atan2(faceX, faceZ)` si ambos finitos y no ~0; si no, null.
 */
export function hostileYaw(faceX: number, faceZ: number): number | null {
  if (!Number.isFinite(faceX) || !Number.isFinite(faceZ)) return null;
  if (Math.abs(faceX) < FACE_EPS && Math.abs(faceZ) < FACE_EPS) return null;
  return Math.atan2(faceX, faceZ);
}
