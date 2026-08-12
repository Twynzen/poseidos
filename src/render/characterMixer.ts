/**
 * AnimationMixer wiring for character GLBs.
 * Headless-safe helpers (clip map) + browser binder with short crossfade.
 */

import {
  AnimationMixer,
  LoopOnce,
  LoopRepeat,
} from "three";
import type { AnimationAction } from "three";
import type { LoadedCharacterGltf } from "./characterGltf";
import {
  clipNameForRole,
  type CharacterAssetManifest,
  type CharacterClipRole,
} from "./characterManifest";

/** Default crossfade seconds (idle↔walk↔run). */
export const DEFAULT_MIXER_FADE_SEC = 0.18;

/** One-shot roles that should not loop. */
const ONESHOT_ROLES: ReadonlySet<CharacterClipRole> = new Set([
  "primary-attack",
  "hit",
  "death",
]);

export interface CharacterMixerHandle {
  /** Sync playing action to semantic role (crossfade if changed). */
  syncFromAnimator(role: CharacterClipRole): void;
  /** Advance mixer; optionally sync role first. */
  update(dt: number, role?: CharacterClipRole): void;
  /** Last role that was synced (debug / tests). */
  readonly activeRole: CharacterClipRole | null;
  /** Clip name currently targeted (debug / tests). */
  readonly activeClipName: string | null;
  dispose(): void;
}

/**
 * Map manifest roles → clip names that actually exist in the GLB.
 * Pure / headless — no Three mixer required.
 */
export function buildRoleClipMap(
  clipNames: readonly string[],
  manifest: CharacterAssetManifest,
): Partial<Record<CharacterClipRole, string>> {
  const available = new Set(clipNames);
  const out: Partial<Record<CharacterClipRole, string>> = {};
  const roles = Object.keys(manifest.roles) as CharacterClipRole[];
  for (const role of roles) {
    const name = clipNameForRole(manifest, role);
    if (name && available.has(name)) out[role] = name;
  }
  return out;
}

/**
 * Bind AnimationMixer + actions from loaded GLB + manifest roles.
 * Returns null if no mapped clips exist.
 */
export function bindMixer(
  loaded: LoadedCharacterGltf,
  manifest: CharacterAssetManifest,
  opts?: { fadeSec?: number },
): CharacterMixerHandle | null {
  const fadeSec =
    opts?.fadeSec != null && Number.isFinite(opts.fadeSec) && opts.fadeSec >= 0
      ? opts.fadeSec
      : DEFAULT_MIXER_FADE_SEC;

  const roleToClip = buildRoleClipMap(loaded.clipNames, manifest);
  const clipByName = new Map(loaded.animations.map((c) => [c.name, c]));
  const actions = new Map<CharacterClipRole, AnimationAction>();

  const mixer = new AnimationMixer(loaded.scene);
  for (const [role, clipName] of Object.entries(roleToClip) as Array<
    [CharacterClipRole, string]
  >) {
    const clip = clipByName.get(clipName);
    if (!clip) continue;
    const action = mixer.clipAction(clip);
    if (ONESHOT_ROLES.has(role)) {
      action.setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(LoopRepeat, Infinity);
    }
    actions.set(role, action);
  }

  if (actions.size === 0) {
    mixer.stopAllAction();
    return null;
  }

  let activeRole: CharacterClipRole | null = null;
  let activeClipName: string | null = null;
  let currentAction: AnimationAction | null = null;

  function syncFromAnimator(role: CharacterClipRole): void {
    const next = actions.get(role);
    if (!next) {
      // Role has no clip — keep current loco action if any.
      return;
    }
    if (role === activeRole && currentAction === next) return;

    const fade = fadeSec;
    if (currentAction && currentAction !== next && fade > 0) {
      currentAction.fadeOut(fade);
      next.reset().setEffectiveWeight(1).fadeIn(fade).play();
    } else {
      if (currentAction && currentAction !== next) currentAction.stop();
      next.reset().setEffectiveWeight(1).play();
    }
    currentAction = next;
    activeRole = role;
    activeClipName = roleToClip[role] ?? null;
  }

  function update(dt: number, role?: CharacterClipRole): void {
    if (role != null) syncFromAnimator(role);
    const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
    mixer.update(safeDt);
  }

  function dispose(): void {
    mixer.stopAllAction();
    actions.clear();
    currentAction = null;
    activeRole = null;
    activeClipName = null;
  }

  return {
    syncFromAnimator,
    update,
    get activeRole() {
      return activeRole;
    },
    get activeClipName() {
      return activeClipName;
    },
    dispose,
  };
}
