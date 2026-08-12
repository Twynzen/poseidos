/**
 * Tint poseído (cuerpo oscuro + acento rojo/violeta emisivo) sobre Soldier.glb.
 * Clona materiales para no mutar el cache del GLTFLoader / template compartido.
 * Acento en partes cuyo nombre sugiere head/visor/helmet.
 */

import type { Material, Mesh, Object3D } from "three";
import { Color, MeshStandardMaterial } from "three";

/** Cuerpo: oscuro casi negro con tinte violeta enfermo. */
export const POSSESSED_BODY_COLOR = 0x1a1218;
/** Acento head/visor: rojo-violeta. */
export const POSSESSED_ACCENT_COLOR = 0x9a2858;
/** Emisión del acento (ojos/visor poseído). */
export const POSSESSED_ACCENT_EMISSIVE = 0x6a1040;
export const POSSESSED_BODY_ROUGHNESS = 0.88;
export const POSSESSED_ACCENT_ROUGHNESS = 0.4;
export const POSSESSED_ACCENT_EMISSIVE_INTENSITY = 0.85;

const ACCENT_NAME_RE = /visor|helmet|helm|head/i;

/** True si el nombre de mesh o material sugiere head/visor/casco. */
export function isPossessedAccentName(name: string): boolean {
  return typeof name === "string" && ACCENT_NAME_RE.test(name);
}

function tintMaterial(mat: Material, accent: boolean): Material {
  const cloned = mat.clone();
  const hex = accent ? POSSESSED_ACCENT_COLOR : POSSESSED_BODY_COLOR;
  const rough = accent ? POSSESSED_ACCENT_ROUGHNESS : POSSESSED_BODY_ROUGHNESS;
  if ("color" in cloned && cloned.color instanceof Color) {
    cloned.color.setHex(hex);
  }
  if (cloned instanceof MeshStandardMaterial) {
    cloned.roughness = rough;
    cloned.metalness = accent ? 0.28 : 0.06;
    if (cloned.emissive) {
      cloned.emissive.setHex(accent ? POSSESSED_ACCENT_EMISSIVE : 0x000000);
      cloned.emissiveIntensity = accent
        ? POSSESSED_ACCENT_EMISSIVE_INTENSITY
        : 0;
    }
  }
  return cloned;
}

/**
 * Aplica paleta poseída al subtree del personaje.
 * Idempotente a nivel de mesh (re-clona; seguro al montar una vez).
 */
export function applyPossessedLook(root: Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh || mesh.material == null) return;
    const meshAccent = isPossessedAccentName(mesh.name ?? "");
    const mats = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    const next = mats.map((m) => {
      const matAccent =
        meshAccent || isPossessedAccentName((m as { name?: string }).name ?? "");
      return tintMaterial(m, matAccent);
    });
    mesh.material = Array.isArray(mesh.material) ? next : next[0]!;
  });
}
