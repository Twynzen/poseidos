/**
 * Hotbar HUD: 5 slots glass-dark (Skills P1) bottom-center.
 * Solo DOM; datos en ui/hotbar. Clase `hotbar-selected` = slot activo (1–5).
 */

import { clampHotbarIndex, HOTBAR_SIZE, type HotbarSlot } from "./hotbar";

export interface HotbarHud {
  sync(slots: ReadonlyArray<HotbarSlot>, selectedIndex?: number): void;
  dispose(): void;
}

export function createHotbarHud(root: HTMLElement): HotbarHud {
  const bar = document.createElement("div");
  bar.id = "hotbar";
  bar.setAttribute("aria-label", "Hotbar");
  root.appendChild(bar);

  const nodes: HTMLElement[] = [];
  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const el = document.createElement("div");
    el.className = "hotbar-slot";
    const key = document.createElement("span");
    key.className = "hotbar-key";
    const name = document.createElement("span");
    name.className = "hotbar-name";
    const qty = document.createElement("span");
    qty.className = "hotbar-qty";
    el.append(key, name, qty);
    bar.appendChild(el);
    nodes.push(el);
  }

  return {
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
      bar.remove();
      nodes.length = 0;
    },
  };
}
