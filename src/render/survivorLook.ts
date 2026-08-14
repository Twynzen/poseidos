/**
 * Tint survival (tierra/gris) sobre Soldier placeholder militar.
 * Clona materiales para no mutar el cache del GLTFLoader.
 * Acento en partes cuyo nombre sugiere visor/helmet.
 *
 * Albedo: si hay map, multiply del tint (conserva variación de valor).
 * Sin map: fill tierra más claro. Nunca aplastar a SURVIVOR_CRUSHED_EARTH.
 */

import type { Material, Mesh, Object3D } from "three";
import { Color, MeshStandardMaterial } from "three";

/** Cuerpo sin map: tierra más clara (no el fill aplastado de noche). */
export const SURVIVOR_BODY_COLOR = 0x8a8070;
/** Multiply sobre color existente cuando hay map (mantiene variación). */
export const SURVIVOR_MAP_TINT = 0xc8bca8;
/** Emisión cuerpo muy baja: silueta legible de noche, sin glow. 0x1c1a16 × 1.25. */
export const SURVIVOR_BODY_EMISSIVE = 0x23201b;
/** Acento visor/casco: tierra cálida (no gris frío). */
export const SURVIVOR_ACCENT = 0xa39c8c;
/** Alias del acento (mismo valor). */
export const SURVIVOR_ACCENT_COLOR = SURVIVOR_ACCENT;
/** Emisión acento (path de visor sin cambio de intensidad). */
export const SURVIVOR_ACCENT_EMISSIVE = 0x2a2820;
/**
 * Fill plano que aplastaba el mesh de noche.
 * Lock de nombre únicamente — no aplicar como color de cuerpo.
 */
export const SURVIVOR_CRUSHED_EARTH = 0x5c5346;
/** Roughness alto = look mate / usado. */
export const SURVIVOR_BODY_ROUGHNESS = 0.82;
export const SURVIVOR_ACCENT_ROUGHNESS = 0.45;

const ACCENT_NAME_RE = /visor|helmet|helm/i;
const MAP_TINT = new Color(SURVIVOR_MAP_TINT);

/** True si el nombre de mesh o material sugiere visor/casco. */
export function isSurvivorAccentName(name: string): boolean {
  return typeof name === "string" && ACCENT_NAME_RE.test(name);
}

function materialHasMap(mat: Material): boolean {
  return "map" in mat && (mat as { map?: unknown }).map != null;
}

function tintMaterial(mat: Material, accent: boolean): Material {
  const cloned = mat.clone();
  const rough = accent ? SURVIVOR_ACCENT_ROUGHNESS : SURVIVOR_BODY_ROUGHNESS;
  if ("color" in cloned && cloned.color instanceof Color) {
    if (accent) {
      cloned.color.setHex(SURVIVOR_ACCENT);
    } else if (materialHasMap(cloned)) {
      cloned.color.multiply(MAP_TINT);
    } else {
      cloned.color.setHex(SURVIVOR_BODY_COLOR);
    }
  }
  if (cloned instanceof MeshStandardMaterial) {
    cloned.roughness = rough;
    cloned.metalness = accent ? 0.35 : 0.08;
    if (cloned.emissive) {
      cloned.emissive.setHex(
        accent ? SURVIVOR_ACCENT_EMISSIVE : SURVIVOR_BODY_EMISSIVE,
      );
      cloned.emissiveIntensity = accent ? 0.15 : 1;
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
