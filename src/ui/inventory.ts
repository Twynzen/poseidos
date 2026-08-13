/**
 * Panel HTML de inventario (tecla I) — glass-dark estilo moodles/HUD.
 * Solo DOM; formato headless en items/inventoryPanelData.
 */

import {
  INVENTORY_EMPTY_MSG,
  type InventoryPanelData,
} from "../items/inventoryPanelData";

export interface InventoryPanelView {
  open: boolean;
  data: InventoryPanelData;
}

export interface InventoryPanel {
  sync(view: InventoryPanelView): void;
  /** Último clic en fila; last-wins; consume y limpia. */
  consumeClick(): number | null;
  /** Último clic derecho en fila (inspeccionar); last-wins; consume y limpia. */
  consumeInspect(): number | null;
  /** Último Shift+clic en fila (partir stack); last-wins; consume y limpia. */
  consumeSplit(): number | null;
  dispose(): void;
}

export function createInventoryPanel(root: HTMLElement): InventoryPanel {
  const panel = document.createElement("div");
  panel.id = "inventory-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Inventario");
  panel.hidden = true;

  const head = document.createElement("div");
  head.className = "inv-head";
  head.textContent = "Inventario";

  const weightEl = document.createElement("div");
  weightEl.className = "inv-weight";

  const equip = document.createElement("div");
  equip.className = "inv-equip";
  equip.setAttribute("aria-label", "Equipo");

  const list = document.createElement("ul");
  list.className = "inv-list";

  const empty = document.createElement("div");
  empty.className = "inv-empty";
  empty.textContent = INVENTORY_EMPTY_MSG;
  empty.hidden = true;

  const hint = document.createElement("div");
  hint.className = "inv-hint";
  hint.textContent =
    "I cerrar · clic usar · Shift+clic partir · clic der. info · Q usar/lluvia · L linterna · Espacio/V melee · X disparar";

  panel.append(head, weightEl, equip, empty, list, hint);
  root.appendChild(panel);

  let pendingClick: number | null = null;
  let pendingInspect: number | null = null;
  let pendingSplit: number | null = null;

  return {
    consumeClick() {
      const clicked = pendingClick;
      pendingClick = null;
      return clicked;
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
    sync(view) {
      if (!view.open) {
        panel.hidden = true;
        return;
      }
      panel.hidden = false;
      const { data } = view;
      weightEl.textContent = data.weightLine;

      equip.replaceChildren();
      for (const badge of data.equipment) {
        const b = document.createElement("span");
        b.className = "inv-badge";
        b.textContent = badge;
        equip.appendChild(b);
      }

      if (data.empty) {
        empty.hidden = false;
        list.replaceChildren();
        list.hidden = true;
      } else {
        empty.hidden = true;
        list.hidden = false;
        list.replaceChildren();
        for (const slot of data.slots) {
          const li = document.createElement("li");
          li.className = "inv-slot";
          li.dataset.id = slot.id;
          li.dataset.index = String(slot.index);
          li.style.cursor = "pointer";
          li.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.shiftKey) {
              pendingSplit = slot.index;
              pendingClick = null;
            } else {
              pendingClick = slot.index;
              pendingSplit = null;
            }
          });
          li.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const n = Number(li.dataset.index);
            pendingInspect = Number.isFinite(n) ? Math.trunc(n) : slot.index;
          });

          const name = document.createElement("span");
          name.className = "inv-slot-name";
          name.textContent = slot.name;

          const qty = document.createElement("span");
          qty.className = "inv-slot-qty";
          qty.textContent = `×${slot.qty}`;

          const w = document.createElement("span");
          w.className = "inv-slot-weight";
          const ww =
            slot.weight < 0.1 && slot.weight > 0
              ? slot.weight.toFixed(2)
              : slot.weight.toFixed(1);
          w.textContent = `${ww}kg`;

          li.append(name, qty, w);
          list.appendChild(li);
        }
      }
    },
    dispose() {
      panel.remove();
    },
  };
}
