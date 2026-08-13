/**
 * Toast HTML `#loot-floater` — fallback si el Plane 3D no se ve.
 * Live: getElementById o crea el div, body last, estilos inline, @keyframes inyectados.
 * Tests: bag.querySelector("#loot-floater") / el.classList (reflow) sin tocar document.
 */

/** Duración del toast (ms), alineada al TTL 1.8s del Plane. */
export const LOOT_FLOATER_HUD_MS = 1800;

/** Clase que dispara `animation: loot-float 1.8s` en el path de tests. */
export const LOOT_FLOATER_HUD_PLAY_CLASS = "loot-floater-play";

export const LOOT_FLOATER_HUD_ID = "loot-floater";

const KEYFRAMES_STYLE_ID = "loot-floater-keyframes";

const LOOT_FLOAT_KEYFRAMES = `@keyframes loot-float {
  0% { opacity: 1; transform: translate(-50%, 16px); }
  100% { opacity: 0; transform: translate(-50%, -72px); }
}`;

export type LootFloaterHudEl = {
  textContent: string | null;
  offsetWidth: number;
  classList: {
    add: (...tokens: string[]) => void;
    remove: (...tokens: string[]) => void;
  };
};

/** Bag de tests: `querySelector("#loot-floater")` (sin jsdom). */
export type LootFloaterHudBag = {
  querySelector: (selector: string) => LootFloaterHudEl | null;
};

function playOnEl(el: LootFloaterHudEl, label: string): void {
  el.textContent = typeof label === "string" ? label : "";
  el.classList.remove(LOOT_FLOATER_HUD_PLAY_CLASS);
  void el.offsetWidth;
  el.classList.add(LOOT_FLOATER_HUD_PLAY_CLASS);
}

function isHudEl(x: object): x is LootFloaterHudEl {
  return "classList" in x && !!(x as LootFloaterHudEl).classList;
}

function isHudBag(x: object): x is LootFloaterHudBag {
  return (
    "querySelector" in x &&
    typeof (x as LootFloaterHudBag).querySelector === "function"
  );
}

function getDoc(): Document | undefined {
  return (globalThis as { document?: Document }).document;
}

function injectLootFloatKeyframes(): void {
  const document = getDoc();
  if (!document) return;
  if (document.getElementById(KEYFRAMES_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = KEYFRAMES_STYLE_ID;
  style.textContent = LOOT_FLOAT_KEYFRAMES;
  (document.head ?? document.body)?.appendChild(style);
}

function applyLiveStyles(el: HTMLElement): void {
  el.style.position = "fixed";
  el.style.left = "50%";
  el.style.top = "36%";
  el.style.zIndex = "9999";
  el.style.font = "700 36px/1.1 ui-monospace, 'SF Mono', Menlo, Consolas, sans-serif";
  el.style.color = "#ffe080";
  el.style.pointerEvents = "none";
  el.style.whiteSpace = "nowrap";
  el.style.letterSpacing = "0.04em";
  el.style.textShadow = "0 2px 14px #000, 0 0 10px rgba(0,0,0,0.85)";
  el.style.transform = "translate(-50%, 0)";
}

function ensureLiveEl(): HTMLElement | null {
  const document = getDoc();
  if (!document?.body) return null;
  let el = document.getElementById(LOOT_FLOATER_HUD_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = LOOT_FLOATER_HUD_ID;
    el.setAttribute("aria-hidden", "true");
  }
  document.body.appendChild(el);
  applyLiveStyles(el);
  return el;
}

function showLive(label: string): void {
  injectLootFloatKeyframes();
  const el = ensureLiveEl();
  if (!el) return;
  el.textContent = typeof label === "string" ? label : "";
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = `loot-float ${LOOT_FLOATER_HUD_MS / 1000}s ease-out forwards`;
}

/**
 * Pone el label y reinicia la animación.
 * - Tests: `el` con classList, o bag con `querySelector("#loot-floater")`.
 * - Live (`el` null / label string): getElementById o crea `#loot-floater`.
 */
export function showLootFloaterHud(
  el: LootFloaterHudEl | LootFloaterHudBag | string | null | undefined,
  label?: string,
): void {
  if (typeof el === "string") {
    showLive(el);
    return;
  }
  if (el && isHudEl(el)) {
    playOnEl(el, typeof label === "string" ? label : "");
    return;
  }
  if (el && isHudBag(el)) {
    const found = el.querySelector("#loot-floater");
    if (!found) return;
    playOnEl(found, typeof label === "string" ? label : "");
    return;
  }
  if (typeof label === "string") {
    showLive(label);
  }
}
