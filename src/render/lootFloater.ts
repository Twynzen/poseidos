/**
 * Floater de pickup de loot — headless.
 * worldView aplica label/Y/opacity al Sprite canvas 256×64 ámbar.
 */

/** Duración del floater (s). */
export const LOOT_FLOATER_TTL = 1.8;

/** Subida vertical en mundo a lo largo del TTL. */
export const LOOT_FLOATER_RISE = 1.0;

/** Altura inicial Y (sobre silueta / nameplate). */
export const LOOT_FLOATER_Y0 = 2.05;

/** Máximo de caracteres del label. */
export const LOOT_FLOATER_MAX_CHARS = 16;

/** Corta el label a 16 chars (sin ellipsis). */
export function lootFloaterLabel(label: string): string {
  if (typeof label !== "string") return "";
  if (label.length <= LOOT_FLOATER_MAX_CHARS) return label;
  return label.slice(0, LOOT_FLOATER_MAX_CHARS);
}

/**
 * Progreso 0..1 del floater (0 = spawn, 1 = TTL).
 * Age no finito / negativo → 0.
 */
export function lootFloaterProgress(age: number): number {
  if (!Number.isFinite(age) || age <= 0) return 0;
  if (age >= LOOT_FLOATER_TTL) return 1;
  return age / LOOT_FLOATER_TTL;
}

/** Y mundo: Y0 + rise · progress. */
export function lootFloaterY(age: number): number {
  return LOOT_FLOATER_Y0 + LOOT_FLOATER_RISE * lootFloaterProgress(age);
}

/** Opacidad lineal 1→0. Age no finito → 0. */
export function lootFloaterOpacity(age: number): number {
  if (!Number.isFinite(age)) return 0;
  return 1 - lootFloaterProgress(age);
}

/** Vivo mientras age < TTL. No finito → false. */
export function lootFloaterAlive(age: number): boolean {
  if (!Number.isFinite(age)) return false;
  return age < LOOT_FLOATER_TTL;
}
