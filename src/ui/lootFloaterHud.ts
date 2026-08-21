/**
 * Toast HTML `#loot-floater` montado en el mismo uiRoot que moodles (body).
 * Live: `createLootFloaterHud(root).show(label, itemId?)` — chip glass, 2s, icono SVG.
 * Tests: `showLootFloaterHud(label, bag)` / el.classList (sin jsdom).
 */

import { itemIconSvg } from "./itemIcons";

/** Duración del toast live (ms). */
export const LOOT_FLOATER_HUD_MS = 2000;

/** Clase que dispara la animación en el path de tests (bag / classList). */
export const LOOT_FLOATER_HUD_PLAY_CLASS = "loot-floater-play";

/** Tono error: muted red, sin glow gold. */
export const LOOT_FLOATER_HUD_ERR_CLASS = "loot-floater-err";

export const LOOT_FLOATER_HUD_ID = "loot-floater";

const KEYFRAMES_STYLE_ID = "loot-floater-kf";

const LOOT_FLOAT_KEYFRAMES = `@keyframes loot-float {
  0% { opacity: 1; transform: translate(-50%, 8px); }
  50% { opacity: 1; transform: translate(-50%, -12px); }
  100% { opacity: 0; transform: translate(-50%, -48px); }
}`;

const ERR_LABELS = new Set([
  "no se puede usar",
  "no se puede partir",
  "no se puede juntar",
  "vacío",
  "inventario lleno",
]);

const QTY_RE = /\s*×(\d+)/;

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
  show(label: string, itemId?: string): void;
  /** HAS MUERTO / F9 load-muerto: quita el chip. Ya oculto = no-op. */
  hide(): void;
  dispose(): void;
}

/**
 * HAS MUERTO / F9 load-muerto: no pintar toast encima.
 * Vivo (incl. F9 load-vivo): showing igual que hoy.
 * Ya vacío (showing false) = hidden; gameOver no inventa toast.
 */
export function lootFloaterVisible(
  gameOver: boolean,
  showing: boolean,
): boolean {
  if (gameOver) return false;
  return showing;
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

function isErrorLabel(label: string): boolean {
  return ERR_LABELS.has(label.trim());
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Markup del chip: icono opcional + label + badge ×N. */
function lootFloaterChipHtml(label: string, itemId?: string): string {
  const qty = label.match(QTY_RE);
  let text = label;
  let qtyHtml = "";
  if (qty && qty.index !== undefined) {
    text = label.slice(0, qty.index) + label.slice(qty.index + qty[0].length);
    qtyHtml = `<span class="loot-floater-qty">${qty[1]}</span>`;
  }
  const err = isErrorLabel(label);
  const id = typeof itemId === "string" ? itemId.trim() : "";
  const icon =
    !err && id
      ? `<span class="loot-floater-icon">${itemIconSvg(id)}</span>`
      : "";
  return `${icon}${escapeHtml(text)}${qtyHtml}`;
}

function applyTone(el: HTMLElement, err: boolean): void {
  if (err) {
    el.classList.add(LOOT_FLOATER_HUD_ERR_CLASS);
    el.style.color = "#fca5a5";
    el.style.textShadow = "none";
    el.style.borderColor = "rgba(248, 113, 113, 0.4)";
  } else {
    el.classList.remove(LOOT_FLOATER_HUD_ERR_CLASS);
    el.style.color = "#ffe080";
    el.style.textShadow = "0 1px 8px #000, 0 0 12px rgba(255,224,128,.4)";
    el.style.borderColor = "rgba(226,232,240,0.42)";
  }
}

function applyLiveStyles(el: HTMLElement): void {
  el.removeAttribute("hidden");
  el.style.position = "fixed";
  el.style.left = "50%";
  el.style.top = "34%";
  el.style.transform = "translate(-50%, 0)";
  el.style.zIndex = "9999";
  el.style.pointerEvents = "none";
  el.style.alignItems = "center";
  el.style.gap = "8px";
  el.style.padding = "6px 12px 6px 8px";
  el.style.borderRadius = "999px";
  el.style.font =
    '800 20px/1.2 ui-monospace, "SF Mono", Menlo, Consolas, monospace';
  el.style.letterSpacing = "0.03em";
  el.style.whiteSpace = "nowrap";
  el.style.color = "#ffe080";
  el.style.textShadow = "0 1px 8px #000, 0 0 12px rgba(255,224,128,.4)";
  el.style.background =
    "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(15,23,42,0.38)), rgba(15,23,42,0.88), var(--hud-bg)";
  el.style.border = "1px solid rgba(226,232,240,0.42)";
  el.style.boxShadow =
    "0 8px 18px rgba(2, 6, 23, 0.58), inset 0 1px 0 rgba(255,255,255,0.1)";
  el.style.backdropFilter = "blur(10px) saturate(140%)";
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
      hide() {},
      dispose() {},
    };
  }
  injectLootFloatKeyframes(document);
  const el = ensureToastEl(root, document);

  function hideToast(): void {
    if (el.style.display === "none") return;
    el.style.display = "none";
    el.style.animation = "none";
    el.innerHTML = "";
  }

  return {
    show(label: string, itemId?: string) {
      if (typeof label !== "string" || !label.trim()) return;
      el.innerHTML = lootFloaterChipHtml(label, itemId);
      applyTone(el, isErrorLabel(label));
      el.removeAttribute("hidden");
      el.style.display = "inline-flex";
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = `loot-float ${LOOT_FLOATER_HUD_MS / 1000}s ease-out forwards`;
    },
    hide() {
      hideToast();
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
