/**
 * Toast HTML centrado `#loot-floater` — fallback si el Plane 3D no se ve.
 * CSS `@keyframes loot-float` 1.8s en index.html; game.ts llama tras spawnLootFloater.
 */

/** Duración del toast (ms), alineada al TTL 1.8s del Plane. */
export const LOOT_FLOATER_HUD_MS = 1800;

/** Clase que dispara `animation: loot-float 1.8s ease-out forwards`. */
export const LOOT_FLOATER_HUD_PLAY_CLASS = "loot-floater-play";

export type LootFloaterHudEl = {
  textContent: string | null;
  offsetWidth: number;
  classList: {
    add: (...tokens: string[]) => void;
    remove: (...tokens: string[]) => void;
  };
};

/**
 * Pone el label y reinicia la animación CSS (reflow entre remove/add).
 * `el` null/undefined → no-op.
 */
export function showLootFloaterHud(
  el: LootFloaterHudEl | null | undefined,
  label: string,
): void {
  if (!el) return;
  el.textContent = typeof label === "string" ? label : "";
  el.classList.remove(LOOT_FLOATER_HUD_PLAY_CLASS);
  void el.offsetWidth;
  el.classList.add(LOOT_FLOATER_HUD_PLAY_CLASS);
}
