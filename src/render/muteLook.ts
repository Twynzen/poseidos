/**
 * Tint mute (cuerpo gris-verde enfermo) sobre Soldier.glb.
 * Clona materiales para no mutar el cache del GLTFLoader / template compartido.
 * Acento en partes cuyo nombre sugiere head/visor/helmet.
 * Paleta sin rojo/violeta (distinto de poseídos).
 */

import type { Material, Mesh, Object3D } from "three";
import { Color, MeshStandardMaterial } from "three";

/** Cuerpo: gris-verde enfermo. */
export const MUTE_BODY_COLOR = 0x4a5648;
/** Acento head/visor: gris-verde más claro. */
export const MUTE_ACCENT_COLOR = 0x6b7a68;
/** Emisión del acento (ojos/visor mute, verde oscuro). */
export const MUTE_ACCENT_EMISSIVE = 0x1a2218;
export const MUTE_BODY_ROUGHNESS = 0.88;
export const MUTE_ACCENT_ROUGHNESS = 0.5;
export const MUTE_ACCENT_EMISSIVE_INTENSITY = 0.35;

const ACCENT_NAME_RE = /visor|helmet|helm|head/i;

/** True si el nombre de mesh o material sugiere head/visor/casco. */
export function isMuteAccentName(name: string): boolean {
  return typeof name === "string" && ACCENT_NAME_RE.test(name);
}

function tintMaterial(mat: Material, accent: boolean): Material {
  const cloned = mat.clone();
  const hex = accent ? MUTE_ACCENT_COLOR : MUTE_BODY_COLOR;
  const rough = accent ? MUTE_ACCENT_ROUGHNESS : MUTE_BODY_ROUGHNESS;
  if ("color" in cloned && cloned.color instanceof Color) {
    cloned.color.setHex(hex);
  }
  if (cloned instanceof MeshStandardMaterial) {
    cloned.roughness = rough;
    cloned.metalness = accent ? 0.22 : 0.06;
    if (cloned.emissive) {
      cloned.emissive.setHex(accent ? MUTE_ACCENT_EMISSIVE : 0x000000);
      cloned.emissiveIntensity = accent
        ? MUTE_ACCENT_EMISSIVE_INTENSITY
        : 0;
    }
  }
  return cloned;
}

/**
 * Aplica paleta mute al subtree del personaje.
 * Idempotente a nivel de mesh (re-clona; seguro al montar una vez).
 */
export function applyMuteLook(root: Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh || mesh.material == null) return;
    const meshAccent = isMuteAccentName(mesh.name ?? "");
    const mats = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    const next = mats.map((m) => {
      const matAccent =
        meshAccent || isMuteAccentName((m as { name?: string }).name ?? "");
      return tintMaterial(m, matAccent);
    });
    mesh.material = Array.isArray(mesh.material) ? next : next[0]!;
  });
}
