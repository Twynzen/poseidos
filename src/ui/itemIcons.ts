/**
 * Iconos SVG inline del inventario (I) — siluetas geométricas dark-fantasy.
 * Headless: sin DOM ni archivos externos. Fallback diamante para id desconocido.
 * Slot vacío: `emptySlotIconSvg` (diamante dashed, no el fallback).
 */

const GOLD = "#e8c36a";
const GOLD_DIM = "#b8862a";
const FILL = "rgba(232, 195, 106, 0.32)";
const WATER = "rgba(91, 159, 212, 0.5)";
const STEAM = "rgba(232, 195, 106, 0.55)";

function svg(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" fill="none" stroke="${GOLD}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
}

const FALLBACK = svg(
  `<path d="M16 3.5 28.5 16 16 28.5 3.5 16Z" fill="${FILL}"/>`,
);

/** Diamante gold dashed (ghost) para slot vacío. Distinto del fallback de id desconocido. */
const EMPTY_SLOT = svg(
  `<path d="M16 6.5 25.5 16 16 25.5 6.5 16Z" stroke-dasharray="2.4 2" opacity="0.55"/>`,
);

const ICONS: Record<string, string> = {
  water_bottle: svg(
    `<path d="M13 3.5h6v3.2c2.1 1.1 3.4 3.3 3.4 6.2v12.2a3.2 3.2 0 0 1-3.2 3.2h-6.4A3.2 3.2 0 0 1 9.6 25.1V12.9c0-2.9 1.3-5.1 3.4-6.2V3.5Z"/>
     <path d="M13 3.5h6v3.2h-6Z" fill="${GOLD_DIM}" stroke="${GOLD}"/>
     <path d="M11 16.2h10v8.7a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-8.7Z" fill="${WATER}" stroke="none"/>`,
  ),
  empty_bottle: svg(
    `<path d="M13 3.5h6v3.2c2.1 1.1 3.4 3.3 3.4 6.2v12.2a3.2 3.2 0 0 1-3.2 3.2h-6.4A3.2 3.2 0 0 1 9.6 25.1V12.9c0-2.9 1.3-5.1 3.4-6.2V3.5Z"/>
     <path d="M13 3.5h6v3.2h-6Z" fill="${FILL}" stroke="${GOLD}"/>
     <path d="M12.5 18.5h7" opacity="0.45"/>`,
  ),
  canned_food: svg(
    `<rect x="8" y="8.5" width="16" height="16.5" rx="1.8" fill="${FILL}"/>
     <ellipse cx="16" cy="8.5" rx="8" ry="2.3" fill="${GOLD_DIM}"/>
     <ellipse cx="16" cy="25" rx="8" ry="2.3"/>
     <path d="M8 14.5h16" opacity="0.7"/>`,
  ),
  flashlight: svg(
    `<rect x="3.5" y="12" width="16" height="8" rx="1.6" fill="${FILL}"/>
     <rect x="19.5" y="10.2" width="4.2" height="11.6" rx="0.8" fill="${GOLD_DIM}"/>
     <path d="M24.2 11.2 29.5 7.5M24.2 16h6.3M24.2 20.8 29.5 24.5" opacity="0.75"/>`,
  ),
  pistol: svg(
    `<path d="M4 12.2h15.2l1.6 1.7h6.4v3.1h-6.2l-1.6 1.7H14.2v7.2H9.6v-7.2H7.6L4 16.8Z" fill="${FILL}"/>
     <path d="M6.2 13.6h9.4" opacity="0.7"/>
     <circle cx="23.8" cy="15.4" r="0.7" fill="${GOLD}" stroke="none"/>`,
  ),
  ammo: svg(
    `<rect x="5.5" y="12" width="21" height="13.5" rx="1.4" fill="${FILL}"/>
     <rect x="8" y="6.5" width="3.6" height="8" rx="1.2" fill="${GOLD_DIM}"/>
     <rect x="14.2" y="6.5" width="3.6" height="8" rx="1.2" fill="${GOLD_DIM}"/>
     <rect x="20.4" y="6.5" width="3.6" height="8" rx="1.2" fill="${GOLD_DIM}"/>
     <path d="M8 18.5h16" opacity="0.55"/>`,
  ),
  wood: svg(
    `<path d="M4 10.2 25.5 7.2l2.5 4.6-21.5 3Z" fill="${FILL}"/>
     <path d="M4 16.4 25.8 14.2l2.2 4.8-21.8 2.6Z" fill="${FILL}"/>
     <path d="M4 22.6 26 21.2l2 4.6L4 27.4Z" fill="${FILL}"/>`,
  ),
  cloth: svg(
    `<path d="M6.5 10.5 15 6.2l11 6.4-8.4 4.2Z" fill="${FILL}"/>
     <path d="M6.5 10.5v11.8l11 6.2V16.8Z" fill="${FILL}"/>
     <path d="M17.6 12.6v11.8l9.9-4.4V12.6Z"/>`,
  ),
  scrap: svg(
    `<path d="M6.5 7.5 14 9.2l-2.4 8.6-6.2-1.4Z" fill="${FILL}"/>
     <path d="M16.2 6.2 26.5 10.4 23 18.2l-8-2.2Z" fill="${FILL}"/>
     <path d="M9.5 18.4 20.2 20.6 15.4 28 7.2 24.6Z" fill="${FILL}"/>`,
  ),
  knife: svg(
    `<path d="M21.2 4.2 28 11 12.4 26.6 8.8 23Z" fill="${FILL}"/>
     <path d="M8.8 23 5.4 28.2 11.2 25.4"/>
     <path d="M18.6 8.6 10.8 16.4" opacity="0.7"/>`,
  ),
  crowbar: svg(
    `<path d="M8.2 27.2 24.6 8.4"/>
     <path d="M24.6 8.4c3.2-3.1 6.4.4 3.6 3.2"/>
     <path d="M8.2 27.2c-2.4 2.2 1.2 5.2 3.4 2.8"/>
     <path d="M10.6 24.2 23.4 10.2" opacity="0.45"/>`,
  ),
  bandage: svg(
    `<rect x="7.5" y="12.5" width="17" height="10.5" rx="2.2" fill="${FILL}"/>
     <path d="M12 12.5c0-4.2 8-4.2 8 0"/>
     <path d="M14.6 16.4h2.8M16 15v2.8" stroke="${GOLD}"/>`,
  ),
  hot_meal: svg(
    `<path d="M6.2 18.5c0 5.6 4.2 8.8 9.8 8.8s9.8-3.2 9.8-8.8" fill="${FILL}"/>
     <ellipse cx="16" cy="18.5" rx="9.8" ry="4.2"/>
     <path d="M12.2 9.2c.2 3.6 1.6 5.4 3.4 5.6M16.2 7.6c.3 3.8 1.8 5.4 3.6 5M20.4 8.8c.2 2.8 1.2 4.4 2.8 4.2" stroke="${STEAM}"/>`,
  ),
};

/** Markup SVG inline para un item id. Id desconocido → diamante genérico. Nunca vacío. */
export function itemIconSvg(id: string): string {
  return ICONS[id] ?? FALLBACK;
}

/** Ghost de celda vacía: diamante gold dashed, sin fill. No es el fallback unknown-item. */
export function emptySlotIconSvg(): string {
  return EMPTY_SLOT;
}
