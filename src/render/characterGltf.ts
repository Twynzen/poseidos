/** char glb optional load (browser; headless returns null) */

import type { AnimationClip } from "three";
import type { Group, Object3D } from "three";
import {
  usesPlaceholderMesh,
  type CharacterAssetManifest,
} from "./characterManifest";

export interface LoadedCharacterGltf {
  root: Object3D;
  scene: Group;
  animations: AnimationClip[];
  clipNames: string[];
}

/** GLB container magic: ASCII `glTF` (0x67 0x6c 0x54 0x46). */
export const GLB_MAGIC = [0x67, 0x6c, 0x54, 0x46] as const;

export interface GlbResponseLike {
  ok?: boolean;
  headers: { get(name: string): string | null };
}

/** True when browser globals allow asset loading. */
export function canLoadGltfInThisEnv(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { window?: unknown }).window !== "undefined" &&
    typeof URL !== "undefined"
  );
}

function mimeFromContentType(contentType: string | null | undefined): string {
  if (!contentType) return "";
  return contentType.split(";")[0]?.trim().toLowerCase() ?? "";
}

function asUint8(body: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  return new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
}

/** True iff the first 4 bytes are GLB magic `glTF`. */
export function hasGlbMagic(body: ArrayBuffer | ArrayBufferView): boolean {
  const bytes = asUint8(body);
  return (
    bytes.length >= 4 &&
    bytes[0] === GLB_MAGIC[0] &&
    bytes[1] === GLB_MAGIC[1] &&
    bytes[2] === GLB_MAGIC[2] &&
    bytes[3] === GLB_MAGIC[3]
  );
}

/**
 * Gate before GLTFLoader.parseAsync.
 * Rejects text/html and any text/*. Magic `glTF` is required;
 * model/gltf-binary / octet-stream are expected but never override missing magic.
 * Vite/Pages SPA fallback (200 + index.html) is not a GLB.
 */
export function isUsableGlbResponse(
  res: GlbResponseLike,
  body: ArrayBuffer | ArrayBufferView,
): boolean {
  if (res.ok === false) return false;
  const mime = mimeFromContentType(res.headers.get("content-type"));
  if (mime.startsWith("text/")) return false;
  // model/gltf-binary / application/octet-stream expected; never override missing magic.
  return hasGlbMagic(body);
}

function resourcePathFromUrl(url: string): string {
  const slash = url.lastIndexOf("/");
  return slash >= 0 ? url.slice(0, slash + 1) : "";
}

/** Load GLB or null. Never throws; does not block sim. */
export async function loadCharacterGltf(
  url: string,
): Promise<LoadedCharacterGltf | null> {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) return null;
  if (!canLoadGltfInThisEnv()) return null;
  try {
    const res = await fetch(trimmed);
    const body = await res.arrayBuffer();
    if (!isUsableGlbResponse(res, body)) return null;
    const mod = await import("three/addons/loaders/GLTFLoader.js");
    const LoaderCtor = mod.GLTFLoader;
    const loader = new LoaderCtor();
    const gltf = await loader.parseAsync(body, resourcePathFromUrl(trimmed));
    const scene = gltf.scene;
    const animations = gltf.animations ?? [];
    const clipNames = animations.map((c: AnimationClip) => c.name);
    return { root: scene, scene, animations, clipNames };
  } catch {
    return null;
  }
}

export interface AttachCharacterGltfOptions {
  parent: Object3D;
  onAttached?: (loaded: LoadedCharacterGltf) => void;
}

/** Attach when manifest has URL; placeholder/fail => null. */
export async function maybeAttachCharacterGltf(
  manifest: CharacterAssetManifest,
  opts: AttachCharacterGltfOptions,
): Promise<LoadedCharacterGltf | null> {
  if (usesPlaceholderMesh(manifest)) return null;
  const loaded = await loadCharacterGltf(manifest.url);
  if (!loaded) return null;
  const scale =
    Number.isFinite(manifest.scale) && manifest.scale > 0 ? manifest.scale : 1;
  const yOff = Number.isFinite(manifest.yOffset) ? manifest.yOffset : 0;
  loaded.scene.scale.setScalar(scale);
  loaded.scene.position.y = yOff;
  opts.parent.add(loaded.scene);
  opts.onAttached?.(loaded);
  return loaded;
}
