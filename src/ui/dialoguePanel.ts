/**
 * Panel HTML de diálogo jugador → poseído (glass-dark, acento púrpura).
 * Headless-safe: solo DOM; la lógica vive en possession/dialogue.
 */

import {
  DIALOGUE_OPTIONS,
  type DialogueIntent,
  type DialogueOption,
} from "../possession/dialogue";

export interface DialoguePanelView {
  open: boolean;
  targetId: string | null;
  trust: number;
  /** Última línea del poseído tras elegir (opcional). */
  lastLine: string | null;
  lastTone: string | null;
}

export interface DialoguePanel {
  sync(view: DialoguePanelView): void;
  /** Callback al pulsar opción (solo si panel abierto). */
  onChoice(handler: (intent: DialogueIntent) => void): void;
  dispose(): void;
}

export function createDialoguePanel(root: HTMLElement): DialoguePanel {
  const panel = document.createElement("div");
  panel.id = "dialogue-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Diálogo con poseído");
  panel.hidden = true;

  const head = document.createElement("div");
  head.className = "dialogue-head";
  head.textContent = "Poseído";

  const trustEl = document.createElement("div");
  trustEl.className = "dialogue-trust";

  const reply = document.createElement("div");
  reply.className = "dialogue-reply";
  reply.hidden = true;

  const opts = document.createElement("div");
  opts.className = "dialogue-options";

  const hint = document.createElement("div");
  hint.className = "dialogue-hint";
  hint.textContent = "T / Esc cerrar · opciones proponen; el código aplica trust";

  const buttons = new Map<DialogueIntent, HTMLButtonElement>();
  for (const opt of DIALOGUE_OPTIONS as readonly DialogueOption[]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `dialogue-btn intent-${opt.intent}`;
    btn.dataset.intent = opt.intent;
    btn.textContent = `${opt.label} (${opt.trustDelta >= 0 ? "+" : ""}${opt.trustDelta} trust → ${opt.tone})`;
    opts.appendChild(btn);
    buttons.set(opt.intent, btn);
  }

  panel.append(head, trustEl, reply, opts, hint);
  root.appendChild(panel);

  let choiceHandler: ((intent: DialogueIntent) => void) | null = null;

  const onClick = (e: Event) => {
    const t = e.target as HTMLElement | null;
    const btn = t?.closest?.("button[data-intent]") as HTMLButtonElement | null;
    if (!btn || panel.hidden) return;
    const intent = btn.dataset.intent as DialogueIntent;
    if (intent && choiceHandler) choiceHandler(intent);
  };
  opts.addEventListener("click", onClick);

  return {
    sync(view) {
      if (!view.open || !view.targetId) {
        panel.hidden = true;
        return;
      }
      panel.hidden = false;
      head.textContent = `Hablar · ${view.targetId}`;
      trustEl.textContent = `Confianza ${view.trust}/100`;
      trustEl.dataset.level =
        view.trust >= 70 ? "high" : view.trust <= 25 ? "low" : "mid";
      if (view.lastLine) {
        reply.hidden = false;
        reply.textContent = view.lastLine;
        reply.dataset.tone = view.lastTone ?? "";
      } else {
        reply.hidden = true;
        reply.textContent = "";
      }
    },
    onChoice(handler) {
      choiceHandler = handler;
    },
    dispose() {
      opts.removeEventListener("click", onClick);
      panel.remove();
      choiceHandler = null;
      buttons.clear();
    },
  };
}
