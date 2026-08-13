/**
 * Iconos SVG inline de moodles HUD — siluetas geométricas, mismo stroke gold que itemIconSvg.
 * Headless: sin DOM ni archivos externos. Fallback diamante para id desconocido.
 */

const GOLD = "#e8c36a";
const FILL = "rgba(232, 195, 106, 0.32)";
const WATER = "rgba(91, 159, 212, 0.5)";

function svg(body: string): string {
  return `<svg xmlns="http://www.w3.org/1999/svg" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" fill="none" stroke="${GOLD}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
}

const FALLBACK = svg(
  `<path d="M16 3.5 28.5 16 16 28.5 3.5 16Z" fill="${FILL}"/>`,
);

const HUNGER = svg(
  `<path d="M6 16.5c.4 7.2 4.4 10.8 10 10.8s9.6-3.6 10-10.8" fill="${FILL}"/>
   <ellipse cx="16" cy="16.5" rx="10" ry="3.6"/>
   <path d="M8.2 16.5h15.6" opacity="0.45"/>`,
);

const THIRST = svg(
  `<path d="M16 3.8C16 3.8 8 15.6 8 21a8 8 0 0 0 16 0C24 15.6 16 3.8 16 3.8Z" fill="${WATER}"/>`,
);

const FATIGUE = svg(
  `<path d="M4.5 16.2C8 9.8 12.2 7.2 16 7.2s8 2.6 11.5 9C24 21.4 19.8 24 16 24s-8-2.6-11.5-7.8Z" fill="${FILL}"/>
   <circle cx="16" cy="16.2" r="3.4" fill="${GOLD}" stroke="none"/>
   <path d="M5.2 14.4c3.4 3.2 7.2 4.4 10.8 4.4s7.4-1.2 10.8-4.4"/>`,
);

const HEALTH = svg(
  `<path d="M13.2 4.2h5.6v8.6h8.6v5.6h-8.6v8.6h-5.6v-8.6H4.6v-5.6h8.6Z" fill="${FILL}"/>`,
);

const AMMO = svg(
  `<path d="M12.6 27V14.2c0-2.4 1.4-6.2 3.4-8.6 2 2.4 3.4 6.2 3.4 8.6V27Z" fill="${FILL}"/>
   <rect x="12.6" y="25.2" width="6.8" height="3.6" rx="0.7"/>
   <path d="M12.6 19h6.8" opacity="0.55"/>`,
);

const CLOCK_DAY = svg(
  `<circle cx="16" cy="16" r="5.2" fill="${FILL}"/>
   <path d="M16 3.6v3.4M16 25v3.4M3.6 16h3.4M25 16h3.4M7.2 7.2l2.4 2.4M22.4 22.4l2.4 2.4M7.2 24.8l2.4-2.4M22.4 9.6l2.4-2.4"/>`,
);

const CLOCK_NIGHT = svg(
  `<path d="M19.8 5.4A10.4 10.4 0 1 0 26.2 22 8.6 8.6 0 1 1 19.8 5.4Z" fill="${FILL}"/>`,
);

const ICONS: Record<string, string> = {
  hunger: HUNGER,
  thirst: THIRST,
  fatigue: FATIGUE,
  health: HEALTH,
  ammo: AMMO,
  clock: CLOCK_DAY,
};

export type MoodleIconOpts = { night?: boolean };

/** Markup SVG inline para un moodle id. Id desconocido → diamante genérico. Nunca vacío. */
export function moodleIconSvg(id: string, opts?: MoodleIconOpts): string {
  if (id === "clock" && opts?.night) return CLOCK_NIGHT;
  return ICONS[id] ?? FALLBACK;
}
