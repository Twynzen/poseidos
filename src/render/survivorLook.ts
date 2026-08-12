/**
 * Tint survival (tierra/gris) sobre Soldier placeholder militar.
 * Clona materiales para no mutar el cache del GLTFLoader.
 * Acento en partes cuyo nombre sugiere visor/helmet.
 */

import type { Material, Mesh, Object3D } from "three";
import { Color, MeshStandardMaterial } from "three";

/** Cuerpo: tierra / gris apagado (no camo militar verde). */
export const SURVIVOR_BODY_COLOR = 0x6e675c;
/** Acento visor/casco: gris frío ligeramente azulado. */
export const SURVIVOR_ACCENT_COLOR = 0x5a6a72;
/** Roughness alto = look mate / usado. */
export const SURVIVOR_BODY_ROUGHNESS = 0.82;
export const SURVIVOR_ACCENT_ROUGHNESS = 0.45;

const ACCENT_NAME_RE = /visor|helmet|helm/i;

/** True si el nombre de mesh o material sugiere visor/casco. */
export function isSurvivorAccentName(name: string): boolean {
  return typeof name === "string" && ACCENT_NAME_RE.test(name);
}

function tintMaterial(mat: Material, accent: boolean): Material {
  const cloned = mat.clone();
  const hex = accent ? SURVIVOR_ACCENT_COLOR : SURVIVOR_BODY_COLOR;
  const rough = accent ? SURVIVOR_ACCENT_ROUGHNESS : SURVIVOR_BODY_ROUGHNESS;
  if ("color" in cloned && cloned.color instanceof Color) {
    cloned.color.setHex(hex);
  }
  if (cloned instanceof MeshStandardMaterial) {
    cloned.roughness = rough;
    cloned.metalness = accent ? 0.35 : 0.08;
    if (cloned.emissive) {
      cloned.emissive.setHex(accent ? 0x1a2228 : 0x000000);
      cloned.emissiveIntensity = accent ? 0.15 : 0;
    }
  }
  return cloned;
}

/**
 * Aplica paleta survival al subtree del personaje.
 * Idempotente a nivel de mesh (re-clona; seguro en onAttached una vez).
 */
export function applySurvivorLook(root: Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh || mesh.material == null) return;
    const meshAccent = isSurvivorAccentName(mesh.name ?? "");
    const mats = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    const next = mats.map((m) => {
      const matAccent =
        meshAccent || isSurvivorAccentName((m as { name?: string }).name ?? "");
      return tintMaterial(m, matAccent);
    });
    mesh.material = Array.isArray(mesh.material) ? next : next[0]!;
  });
}
