/**
 * Panel HTML de inventario (tecla I) — glass-dark estilo moodles/HUD.
 * Solo DOM; formato headless en items/inventoryPanelData.
 * Arrastrar fila→fila encola {from,to}; Game consumeDrag (swap, no usa).
 * Doble clic: consumeDblClick (usar slot); limpia pendingClick. Clic simple sigue usando.
 */

import {
  INVENTORY_EMPTY_MSG,
  type InventoryPanelData,
} from "../items/inventoryPanelData";

export interface InventoryPanelView {
  open: boolean;
  data: InventoryPanelData;
  /** Fila I resaltada (última clicada); U tira de aquí con el panel abierto. */
  selectedIndex?: number | null;
}

export interface InventoryPanel {
  sync(view: InventoryPanelView): void;
  /** Último clic en fila; last-wins; consume y limpia. */
  consumeClick(): number | null;
  /** Último doble clic en fila (usar); last-wins; consume y limpia. */
  consumeDblClick(): number | null;
  /** Último clic derecho en fila (inspeccionar); last-wins; consume y limpia. */
  consumeInspect(): number | null;
  /** Último Shift+clic en fila (partir stack); last-wins; consume y limpia. */
  consumeSplit(): number | null;
  /** Último Ctrl/Cmd+clic en fila (juntar stack); last-wins; consume y limpia. */
  consumeMerge(): number | null;
  /** Último arrastre fila→fila; last-wins; consume y limpia. */
  consumeDrag(): { from: number; to: number } | null;
  dispose(): void;
}

function slotIndexFromEvent(e: Event): number | null {
  const el = (e.target as Element | null)?.closest?.(".inv-slot");
  if (!el) return null;
  const n = Number((el as HTMLElement).dataset.index);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
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
    "I cerrar · U inv tirar · clic usar · doble clic usar · arrastrar reordenar · Shift+clic partir · Ctrl+clic juntar · clic der. info · Q usar/lluvia · L linterna · Espacio/V melee · X disparar";

  panel.append(head, weightEl, equip, empty, list, hint);
  root.appendChild(panel);

  let pendingClick: number | null = null;
  let pendingDblClick: number | null = null;
  let pendingInspect: number | null = null;
  let pendingSplit: number | null = null;
  let pendingMerge: number | null = null;
  let pendingDrag: { from: number; to: number } | null = null;
  let dragFrom: number | null = null;
  let draggedThisGesture = false;

  function endDrag(): void {
    list.querySelectorAll(".inv-slot-dragging").forEach((el) => {
      el.classList.remove("inv-slot-dragging");
      (el as HTMLElement).style.cursor = "grab";
    });
    dragFrom = null;
  }

  function onWindowLost(e: Event): void {
    if (dragFrom === null) return;
    if (slotIndexFromEvent(e) === null) endDrag();
  }

  list.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const from = slotIndexFromEvent(e);
    if (from === null) return;
    endDrag();
    dragFrom = from;
    draggedThisGesture = false;
    const el = (e.target as Element | null)?.closest?.(".inv-slot") as
      | HTMLElement
      | null;
    if (el) {
      el.classList.add("inv-slot-dragging");
      el.style.cursor = "grabbing";
    }
  });

  list.addEventListener("pointerup", (e) => {
    if (dragFrom === null) return;
    const from = dragFrom;
    const dest = slotIndexFromEvent(e);
    if (dest !== null && dest !== from) {
      pendingDrag = { from, to: dest };
      pendingClick = null;
      draggedThisGesture = true;
    }
    endDrag();
  });

  window.addEventListener("pointerup", onWindowLost);
  window.addEventListener("pointercancel", onWindowLost);

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
    consumeDrag() {
      const dragged = pendingDrag;
      pendingDrag = null;
      return dragged;
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
          li.style.cursor = "grab";
          li.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedThisGesture) {
              draggedThisGesture = false;
              return;
            }
            if (e.shiftKey) {
              pendingSplit = slot.index;
              pendingClick = null;
              pendingMerge = null;
            } else if (e.ctrlKey || e.metaKey) {
              pendingMerge = slot.index;
              pendingClick = null;
              pendingSplit = null;
            } else {
              pendingClick = slot.index;
              pendingSplit = null;
              pendingMerge = null;
            }
          });
          li.addEventListener("dblclick", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedThisGesture) return;
            const n = Number(li.dataset.index);
            pendingDblClick = Number.isFinite(n) ? Math.trunc(n) : slot.index;
            pendingClick = null;
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
        const selected = view.selectedIndex;
        list.querySelectorAll(".inv-slot").forEach((el) => {
          const n = Number((el as HTMLElement).dataset.index);
          el.classList.toggle(
            "inv-slot-selected",
            selected != null && Number.isFinite(n) && Math.trunc(n) === selected,
          );
        });
      }
    },
    dispose() {
      window.removeEventListener("pointerup", onWindowLost);
      window.removeEventListener("pointercancel", onWindowLost);
      panel.remove();
    },
  };
}
