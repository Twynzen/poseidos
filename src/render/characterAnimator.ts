/**
 * Estado de animacion de personaje mixer-agnostico (headless).
 * Three / AnimationMixer viven en characterGltf + worldView.
 * Aqui solo roles: locomocion + acciones one-shot.
 */

import type { CharacterClipRole } from "./characterManifest";

export type LocomotionRole = Extract<CharacterClipRole, "idle" | "walk" | "run">;

export interface CharacterAnimator {
  /** Rol de locomocion deseado (idle/walk/run). */
  locoRole: LocomotionRole;
  /**
   * Accion one-shot activa (primary-attack / hit / death), o null.
   * Si no es null y remaining > 0 (o death sticky), pisa a loco en currentRole.
   */
  actionRole: CharacterClipRole | null;
  /** Segundos restantes de la accion one-shot. death usa +Infinity. */
  actionRemaining: number;
  /** Tiempo acumulado (debug / tests). */
  time: number;
}

export interface LocomotionInput {
  moving: boolean;
  sprinting: boolean;
}

/** Duraciones default (s) para one-shots sin mixer. */
export const DEFAULT_ATTACK_DURATION = 0.45;
export const DEFAULT_HIT_DURATION = 0.35;

export function createCharacterAnimator(): CharacterAnimator {
  return {
    locoRole: "idle",
    actionRole: null,
    actionRemaining: 0,
    time: 0,
  };
}

function locoFromInput(input: LocomotionInput): LocomotionRole {
  if (!input.moving) return "idle";
  if (input.sprinting) return "run";
  return "walk";
}

/**
 * Actualiza locomocion. No cancela death; otras acciones siguen hasta expirar.
 */
export function setLocomotion(
  anim: CharacterAnimator,
  input: LocomotionInput,
): void {
  anim.locoRole = locoFromInput(input);
}

/**
 * Dispara (o limpia) una accion por rol.
 * - idle/walk/run: se trata como loco inmediato y limpia one-shot.
 * - primary-attack / hit: one-shot con duracion.
 * - death: sticky (no expira por tick).
 * - null via setAction(anim, null) limpia cualquier one-shot, incluida death
 *   (respawn / load-alive / clearPlayerAction).
 */
export function setAction(
  anim: CharacterAnimator,
  role: CharacterClipRole | null,
  durationSec?: number,
): void {
  if (role == null) {
    anim.actionRole = null;
    anim.actionRemaining = 0;
    return;
  }

  if (role === "idle" || role === "walk" || role === "run") {
    anim.locoRole = role;
    anim.actionRole = null;
    anim.actionRemaining = 0;
    return;
  }

  anim.actionRole = role;
  if (role === "death") {
    anim.actionRemaining = Number.POSITIVE_INFINITY;
    return;
  }

  const fallback =
    role === "primary-attack" ? DEFAULT_ATTACK_DURATION : DEFAULT_HIT_DURATION;
  const d =
    durationSec != null && Number.isFinite(durationSec) && durationSec > 0
      ? durationSec
      : fallback;
  anim.actionRemaining = d;
}

/** Avanza timers de one-shot. Mutates anim. */
export function tickCharacterAnimator(anim: CharacterAnimator, dt: number): void {
  const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
  anim.time += safeDt;

  if (anim.actionRole == null) return;
  if (anim.actionRole === "death") return;

  anim.actionRemaining -= safeDt;
  if (anim.actionRemaining <= 0) {
    anim.actionRole = null;
    anim.actionRemaining = 0;
  }
}

/** Rol efectivo a reproducir (accion pisa loco mientras este activa). */
export function currentRole(anim: CharacterAnimator): CharacterClipRole {
  if (anim.actionRole != null) {
    if (anim.actionRole === "death") return "death";
    if (anim.actionRemaining > 0) return anim.actionRole;
  }
  return anim.locoRole;
}
