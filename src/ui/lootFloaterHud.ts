/**
 * Toast HTML `#loot-floater` montado en el mismo uiRoot que moodles (body).
 * Live: `createLootFloaterHud(root).show(label)` — display none/block, 4s, opaco ~55%.
 * Tests: `showLootFloaterHud(label, bag)` / el.classList (sin jsdom).
 */

/** Duración del toast live (ms). */
export const LOOT_FLOATER_HUD_MS = 4000;

/** Clase que dispara la animación en el path de tests (bag / classList). */
export const LOOT_FLOATER_HUD_PLAY_CLASS = "loot-floater-play";

export const LOOT_FLOATER_HUD_ID = "loot-floater";

const KEYFRAMES_STYLE_ID = "loot-floater-kf";

const LOOT_FLOAT_KEYFRAMES = `@keyframes loot-float {
  0% { opacity: 1; transform: translate(-50%, 8px); }
  55% { opacity: 1; transform: translate(-50%, -18px); }
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

export interface LootFloaterHud {
  show(label: string): void;
  dispose(): void;
}

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

function docOf(root: { ownerDocument?: Document | null }): Document | undefined {
  return (
    (root.ownerDocument as Document | null | undefined) ??
    (globalThis as { document?: Document }).document
  );
}

function injectLootFloatKeyframes(document: Document): void {
  if (document.getElementById(KEYFRAMES_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = KEYFRAMES_STYLE_ID;
  style.textContent = LOOT_FLOAT_KEYFRAMES;
  (document.head ?? document.body)?.appendChild(style);
}

function applyLiveStyles(el: HTMLElement): void {
  el.removeAttribute("hidden");
  el.style.position = "fixed";
  el.style.left = "50%";
  el.style.top = "34%";
  el.style.transform = "translate(-50%, 0)";
  el.style.zIndex = "9999";
  el.style.pointerEvents = "none";
  el.style.font = "800 42px/1 ui-monospace, monospace";
  el.style.color = "#ffe080";
  el.style.textShadow = "0 2px 14px #000, 0 0 22px rgba(255,224,128,.75)";
  el.style.whiteSpace = "nowrap";
  el.style.letterSpacing = "0.02em";
}

function ensureToastEl(root: HTMLElement, document: Document): HTMLElement {
  const found =
    (root.querySelector?.("#loot-floater") as HTMLElement | null) ??
    document.getElementById(LOOT_FLOATER_HUD_ID);
  const el = found ?? document.createElement("div");
  el.id = LOOT_FLOATER_HUD_ID;
  el.setAttribute("aria-hidden", "true");
  el.removeAttribute("hidden");
  applyLiveStyles(el);
  el.style.display = "none";
  root.appendChild(el);
  return el;
}

/**
 * Factory (mismo patrón que createMoodlesHud): monta `#loot-floater` en `root`.
 * No usa el atributo `hidden` (display:none !important pelea con la animación).
 */
export function createLootFloaterHud(root: HTMLElement): LootFloaterHud {
  const document = docOf(root);
  if (!document) {
    return {
      show() {},
      dispose() {},
    };
  }
  injectLootFloatKeyframes(document);
  const el = ensureToastEl(root, document);

  return {
    show(label: string) {
      el.textContent = typeof label === "string" ? label : "";
      el.removeAttribute("hidden");
      el.style.display = "block";
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = `loot-float ${LOOT_FLOATER_HUD_MS / 1000}s ease-out forwards`;
    },
    dispose() {
      el.style.display = "none";
      el.remove();
    },
  };
}

/**
 * Path de tests: `showLootFloaterHud(el, label)` o `showLootFloaterHud(label, bag)`.
 * Live no usa esto — game.ts llama `lootToast.show(...)`.
 */
export function showLootFloaterHud(
  el: LootFloaterHudEl | LootFloaterHudBag | string | null | undefined,
  label?: string | LootFloaterHudBag | LootFloaterHudEl | null,
): void {
  if (typeof el === "string") {
    if (label && typeof label === "object" && isHudBag(label)) {
      const found = label.querySelector("#loot-floater");
      if (!found) return;
      playOnEl(found, el);
    }
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
  }
}
