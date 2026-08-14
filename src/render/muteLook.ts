/**
 * Tint mute (cuerpo gris-verde enfermo) sobre Soldier.glb.
 * Clona materiales para no mutar el cache del GLTFLoader / template compartido.
 * Acento en partes cuyo nombre sugiere head/visor/helmet.
 * Paleta sin rojo/violeta (distinto de poseídos y de survivor tierra).
 *
 * Albedo: si hay map, multiply del tint (conserva variación de valor).
 * Sin map: fill gris-verde levantado. Nunca aplastar a MUTE_CRUSHED_BODY.
 */

import type { Material, Mesh, Object3D } from "three";
import { Color, MeshStandardMaterial } from "three";

/** Cuerpo sin map: gris-verde enfermo levantado (no el fill aplastado de noche). */
export const MUTE_BODY_COLOR = 0x647262;
/** Multiply sobre color existente cuando hay map (mantiene variación). */
export const MUTE_MAP_TINT = 0xa8b8a4;
/** Emisión cuerpo baja: silueta gris-verde de noche, sin glow ni rojo-violeta. */
export const MUTE_BODY_EMISSIVE = 0x1c2319;
/** Acento head/visor: gris-verde más claro. */
export const MUTE_ACCENT = 0x6b7a68;
/** Alias del acento (mismo valor). */
export const MUTE_ACCENT_COLOR = MUTE_ACCENT;
/** Emisión del acento (ojos/visor mute, verde oscuro). */
export const MUTE_ACCENT_EMISSIVE = 0x1a2218;
/**
 * Fill plano que aplastaba el mesh de noche.
 * Lock de nombre únicamente — no aplicar como color de cuerpo.
 */
export const MUTE_CRUSHED_BODY = 0x4a5648;
/** Roughness alto = look mate / usado. 0.88 × 0.87 para leer el cuerpo de noche. */
export const MUTE_BODY_ROUGHNESS = 0.7656;
/** Roughness acento visor. 0.5 × 0.87 para leer el visor de noche. */
export const MUTE_ACCENT_ROUGHNESS = 0.435;
/** Intensidad del acento. 0.35 × 1.15 para leer el visor de noche. */
export const MUTE_ACCENT_EMISSIVE_INTENSITY = 0.4025;

const ACCENT_NAME_RE = /visor|helmet|helm|head/i;
const MAP_TINT = new Color(MUTE_MAP_TINT);

/** True si el nombre de mesh o material sugiere head/visor/casco. */
export function isMuteAccentName(name: string): boolean {
  return typeof name === "string" && ACCENT_NAME_RE.test(name);
}

function materialHasMap(mat: Material): boolean {
  return "map" in mat && (mat as { map?: unknown }).map != null;
}

function tintMaterial(mat: Material, accent: boolean): Material {
  const cloned = mat.clone();
  const rough = accent ? MUTE_ACCENT_ROUGHNESS : MUTE_BODY_ROUGHNESS;
  if ("color" in cloned && cloned.color instanceof Color) {
    if (accent) {
      cloned.color.setHex(MUTE_ACCENT);
    } else if (materialHasMap(cloned)) {
      cloned.color.multiply(MAP_TINT);
    } else {
      cloned.color.setHex(MUTE_BODY_COLOR);
    }
  }
  if (cloned instanceof MeshStandardMaterial) {
    cloned.roughness = rough;
    cloned.metalness = accent ? 0.22 : 0.06;
    if (cloned.emissive) {
      cloned.emissive.setHex(
        accent ? MUTE_ACCENT_EMISSIVE : MUTE_BODY_EMISSIVE,
      );
      cloned.emissiveIntensity = accent
        ? MUTE_ACCENT_EMISSIVE_INTENSITY
        : 1;
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
