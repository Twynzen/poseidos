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

/** True when browser globals allow asset loading. */
export function canLoadGltfInThisEnv(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { window?: unknown }).window !== "undefined" &&
    typeof URL !== "undefined"
  );
}

/** Load GLB or null. Never throws; does not block sim. */
export async function loadCharacterGltf(
  url: string,
): Promise<LoadedCharacterGltf | null> {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) return null;
  if (!canLoadGltfInThisEnv()) return null;
  try {
    const mod = await import("three/addons/loaders/GLTFLoader.js");
    const LoaderCtor = mod.GLTFLoader;
    const loader = new LoaderCtor();
    const gltf = await loader.loadAsync(trimmed);
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
