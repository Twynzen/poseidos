/**
 * Nameplate flotante del contenedor — headless.
 * worldView aplica label/opacity al Sprite canvas hijo del grupo loot.
 */

/** Máximo de caracteres del label. */
export const LOOT_NAMEPLATE_MAX_CHARS = 20;

/** Distancia a la que el nameplate llega a opacity 0. */
export const LOOT_NAMEPLATE_FADE_DIST = 10;

/** Altura local Y del sprite sobre el grupo loot. */
export const LOOT_NAMEPLATE_Y = 1.55;

/** Escala world del sprite (canvas 384×80). */
export const LOOT_NAMEPLATE_SCALE_X = 2.6;
export const LOOT_NAMEPLATE_SCALE_Y = 0.65;

export function lootNameplateScale(): { x: number; y: number } {
  return { x: LOOT_NAMEPLATE_SCALE_X, y: LOOT_NAMEPLATE_SCALE_Y };
}

/** Corta el nombre a 20 chars (sin ellipsis). */
export function lootNameplateLabel(label: string): string {
  if (typeof label !== "string") return "";
  if (label.length <= LOOT_NAMEPLATE_MAX_CHARS) return label;
  return label.slice(0, LOOT_NAMEPLATE_MAX_CHARS);
}

export function truncateLootLabel(label: string): string {
  return lootNameplateLabel(label);
}

/**
 * 1 en dist 0 · 0 en fade dist 10.
 * Lerp lineal. Fuera / no finito → 0. Dist negativa se clampa a 0.
 */
export function lootNameplateOpacity(dist: number): number {
  if (!Number.isFinite(dist)) return 0;
  if (dist >= LOOT_NAMEPLATE_FADE_DIST) return 0;
  const d = Math.max(0, dist);
  return 1 - d / LOOT_NAMEPLATE_FADE_DIST;
}

/**
 * Visible si opacity > 0 y el contenedor no está vacío.
 * dist >= 10 / no finito / empty → false.
 */
export function lootNameplateVisible(
  dist: number,
  empty = false,
): boolean {
  if (empty) return false;
  return lootNameplateOpacity(dist) > 0;
}
