/**
 * Hotbar HUD: 5 slots glass-dark (Skills P1) bottom-center.
 * Solo DOM; datos en ui/hotbar. Clase `hotbar-selected` = slot activo (1–5).
 * Clic en slot: encola índice; Game consume con consumeClick().
 * Shift+clic partir; Ctrl/Cmd+clic juntar. No abre I.
 * Doble clic: consumeDblClick (usar slot); no encola drag. Clic-select en esos clics OK.
 * Clic derecho: consumeInspect (info); no encola drag ni dblclick; no consume ítem.
 * Arrastrar de slot a slot: consumeDrag {from,to}; soltar fuera cancela (sin click-select).
 * Pointerdown no-primario (clic der.) no inicia drag.
 */

import { clampHotbarIndex, HOTBAR_SIZE, type HotbarSlot } from "./hotbar";

export interface HotbarHud {
  sync(slots: ReadonlyArray<HotbarSlot>, selectedIndex?: number): void;
  consumeClick(): number | null;
  consumeDblClick(): number | null;
  consumeDrag(): { from: number; to: number } | null;
  consumeInspect(): number | null;
  consumeSplit(): number | null;
  consumeMerge(): number | null;
  dispose(): void;
}

export function createHotbarHud(root: HTMLElement): HotbarHud {
  const bar = document.createElement("div");
  bar.id = "hotbar";
  bar.setAttribute("aria-label", "Hotbar");
  root.appendChild(bar);

  let pendingClick: number | null = null;
  let pendingDblClick: number | null = null;
  let pendingDrag: { from: number; to: number } | null = null;
  let pendingInspect: number | null = null;
  let pendingSplit: number | null = null;
  let pendingMerge: number | null = null;
  let dragFrom: number | null = null;
  let ignoreClick = false;
  const nodes: HTMLElement[] = [];

  function enqueueSlotClick(i: number, e: MouseEvent): void {
    const idx = clampHotbarIndex(i);
    if (e.shiftKey) {
      pendingSplit = idx;
      pendingClick = null;
      pendingMerge = null;
    } else if (e.ctrlKey || e.metaKey) {
      pendingMerge = idx;
      pendingClick = null;
      pendingSplit = null;
    } else {
      pendingClick = idx;
      pendingSplit = null;
      pendingMerge = null;
    }
  }

  function endDrag(): void {
    if (dragFrom !== null) {
      const el = nodes[dragFrom];
      if (el) {
        el.classList.remove("hotbar-dragging");
        el.style.cursor = "grab";
      }
    }
    dragFrom = null;
  }

  function onWindowLost(): void {
    if (dragFrom === null) return;
    endDrag();
  }

  window.addEventListener("pointerup", onWindowLost);
  window.addEventListener("pointercancel", onWindowLost);

  bar.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const slot = document.createElement("div");
    slot.className = "hotbar-slot";
    slot.dataset.hotbarIndex = String(i);
    slot.style.cursor = "grab";
    slot.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      e.preventDefault();
      ignoreClick = false;
      endDrag();
      dragFrom = i;
      slot.classList.add("hotbar-dragging");
      slot.style.cursor = "grabbing";
    });
    slot.addEventListener("pointerup", (e) => {
      if (dragFrom === null) return;
      e.stopPropagation();
      const from = dragFrom;
      const to = clampHotbarIndex(i);
      if (to === from) {
        enqueueSlotClick(i, e);
      } else {
        pendingDrag = { from, to };
        pendingClick = null;
        ignoreClick = true;
      }
      endDrag();
    });
    slot.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (ignoreClick) {
        ignoreClick = false;
        return;
      }
      enqueueSlotClick(i, e);
    });
    slot.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();
      pendingDblClick = clampHotbarIndex(i);
    });
    slot.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      pendingInspect = clampHotbarIndex(i);
    });
    const key = document.createElement("span");
    key.className = "hotbar-key";
    const name = document.createElement("span");
    name.className = "hotbar-name";
    const qty = document.createElement("span");
    qty.className = "hotbar-qty";
    slot.append(key, name, qty);
    bar.appendChild(slot);
    nodes.push(slot);
  }

  return {
    consumeClick() {
      const clicked = pendingClick;
      pendingClick = null;
      return clicked;
    },
    consumeDblClick() {
      const dbl = pendingDblClick;
      pendingDblClick = null;
      return dbl;
    },
    consumeDrag() {
      const dragged = pendingDrag;
      pendingDrag = null;
      return dragged;
    },
    consumeInspect() {
      const inspected = pendingInspect;
      pendingInspect = null;
      return inspected;
    },
    consumeSplit() {
      const split = pendingSplit;
      pendingSplit = null;
      return split;
    },
    consumeMerge() {
      const merge = pendingMerge;
      pendingMerge = null;
      return merge;
    },
    sync(slots, selectedIndex) {
      const selected = clampHotbarIndex(selectedIndex ?? 0);
      for (let i = 0; i < HOTBAR_SIZE; i++) {
        const el = nodes[i];
        const view = slots[i];
        const keyEl = el.querySelector(".hotbar-key");
        const nameEl = el.querySelector(".hotbar-name");
        const qtyEl = el.querySelector(".hotbar-qty");
        el.classList.toggle("hotbar-selected", i === selected);
        if (!view || view.empty) {
          el.classList.add("hotbar-empty");
          if (keyEl) keyEl.textContent = view?.key ?? String(i + 1);
          if (nameEl) nameEl.textContent = "·";
          if (qtyEl) qtyEl.textContent = "";
          continue;
        }
        el.classList.remove("hotbar-empty");
        if (keyEl) keyEl.textContent = view.key;
        if (nameEl) nameEl.textContent = view.name;
        if (qtyEl) qtyEl.textContent = `×${view.qty}`;
      }
    },
    dispose() {
      window.removeEventListener("pointerup", onWindowLost);
      window.removeEventListener("pointercancel", onWindowLost);
      bar.remove();
      nodes.length = 0;
    },
  };
}
