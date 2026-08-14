/**
 * Tint poseído (cuerpo oscuro + acento rojo/violeta emisivo) sobre Soldier.glb.
 * Clona materiales para no mutar el cache del GLTFLoader / template compartido.
 * Acento en partes cuyo nombre sugiere head/visor/helmet.
 *
 * Albedo: si hay map, multiply del tint (conserva variación de valor).
 * Sin map: fill oscuro levantado. Nunca aplastar a POSSESSED_CRUSHED_BODY.
 */

import type { Material, Mesh, Object3D } from "three";
import { Color, MeshStandardMaterial } from "three";

/** Cuerpo sin map: oscuro levantado (no el fill aplastado de noche). */
export const POSSESSED_BODY_COLOR = 0x3a2838;
/** Multiply sobre color existente cuando hay map (mantiene variación). */
export const POSSESSED_MAP_TINT = 0x8a6a82;
/** Emisión cuerpo baja: silueta violeta-oscura de noche, sin glow. */
export const POSSESSED_BODY_EMISSIVE = 0x21141e;
/** Acento head/visor: rojo-violeta. */
export const POSSESSED_ACCENT = 0x8a2a55;
/** Alias del acento (mismo valor). */
export const POSSESSED_ACCENT_COLOR = POSSESSED_ACCENT;
/** Emisión del acento (ojos/visor poseído). */
export const POSSESSED_ACCENT_EMISSIVE = 0x4a1028;
/** Emisivo de fallback (caja / path sin GLB). Lock de nombre — no es el cuerpo. */
export const POSSESSED_FALLBACK_EMISSIVE = 0x2a0814;
/**
 * Fill plano que aplastaba el mesh de noche.
 * Lock de nombre únicamente — no aplicar como color de cuerpo.
 */
export const POSSESSED_CRUSHED_BODY = 0x1c141c;
/** Roughness alto = look mate / usado. 0.7656 × 0.87 para leer el cuerpo de noche. */
export const POSSESSED_BODY_ROUGHNESS = 0.666072;
/** Roughness acento visor. 0.348 × 0.87 para leer el visor de noche. */
export const POSSESSED_ACCENT_ROUGHNESS = 0.30276;
/** Intensidad del cuerpo. 1 × 1.15 para leer la silueta de noche. */
export const POSSESSED_BODY_EMISSIVE_INTENSITY = 1.15;
/** Intensidad del acento. 0.9775 × 1.15 para leer el visor de noche. */
export const POSSESSED_ACCENT_EMISSIVE_INTENSITY = 1.124125;

const ACCENT_NAME_RE = /visor|helmet|helm|head/i;
const MAP_TINT = new Color(POSSESSED_MAP_TINT);

/** True si el nombre de mesh o material sugiere head/visor/casco. */
export function isPossessedAccentName(name: string): boolean {
  return typeof name === "string" && ACCENT_NAME_RE.test(name);
}

function materialHasMap(mat: Material): boolean {
  return "map" in mat && (mat as { map?: unknown }).map != null;
}

function tintMaterial(mat: Material, accent: boolean): Material {
  const cloned = mat.clone();
  const rough = accent ? POSSESSED_ACCENT_ROUGHNESS : POSSESSED_BODY_ROUGHNESS;
  if ("color" in cloned && cloned.color instanceof Color) {
    if (accent) {
      cloned.color.setHex(POSSESSED_ACCENT);
    } else if (materialHasMap(cloned)) {
      cloned.color.multiply(MAP_TINT);
    } else {
      cloned.color.setHex(POSSESSED_BODY_COLOR);
    }
  }
  if (cloned instanceof MeshStandardMaterial) {
    cloned.roughness = rough;
    cloned.metalness = accent ? 0.28 : 0.06;
    if (cloned.emissive) {
      cloned.emissive.setHex(
        accent ? POSSESSED_ACCENT_EMISSIVE : POSSESSED_BODY_EMISSIVE,
      );
      cloned.emissiveIntensity = accent
        ? POSSESSED_ACCENT_EMISSIVE_INTENSITY
        : POSSESSED_BODY_EMISSIVE_INTENSITY;
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
