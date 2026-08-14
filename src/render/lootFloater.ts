/**
 * Label del toast de pickup de loot — headless.
 * game.ts aplica lootFloaterLabel al chip DOM `#loot-floater`.
 */

/** Máximo de caracteres del label. */
export const LOOT_FLOATER_MAX_CHARS = 18;

/**
 * Corta el label a 18 chars (sin ellipsis).
 * Si `qty > 1`, sufijo `×qty` (`+madera×6`).
 */
export function lootFloaterLabel(label: string, qty?: number): string {
  if (typeof label !== "string") return "";
  const text =
    typeof qty === "number" && qty > 1 ? `${label}×${qty}` : label;
  if (text.length <= LOOT_FLOATER_MAX_CHARS) return text;
  return text.slice(0, LOOT_FLOATER_MAX_CHARS);
}
