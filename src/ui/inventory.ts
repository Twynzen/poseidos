/**
 * Panel HTML de inventario (tecla I) — glass-dark estilo moodles/HUD.
 * Solo DOM; formato headless en items/inventoryPanelData.
 * Grilla padded a maxSlots: ocupado = item SVG + qty; vacío = ghost dashed (`emptySlotIconSvg`).
 * Arrastrar fila→fila encola {from,to}; Game consumeDrag (swap, no usa). Vacío no encola gestos.
 * Doble clic: consumeDblClick (usar slot); limpia pendingClick. Clic simple sigue usando.
 */

import {
  INVENTORY_EMPTY_MSG,
  type InventoryPanelData,
} from "../items/inventoryPanelData";
import { emptySlotIconSvg, itemIconSvg } from "./itemIcons";

export interface InventoryPanelView {
  open: boolean;
  data: InventoryPanelData;
  /** Fila I resaltada (última clicada); U tira de aquí con el panel abierto. */
  selectedIndex?: number | null;
}

/**
 * HAS MUERTO / F9 load-muerto: no pintar #inventory-panel encima.
 * Vivo (incl. F9 load-vivo): showInvDetail igual que hoy.
 * Ya cerrado (showInvDetail false) = hidden; gameOver no inventa panel.
 */
export function inventoryPanelVisible(
  gameOver: boolean,
  showInvDetail: boolean,
): boolean {
  if (gameOver) return false;
  return showInvDetail;
}

/**
 * HAS MUERTO / F9 load-muerto: I no aplica (se drena, showInvDetail no flippea).
 * Vivo (incl. F9 load-vivo): I togglea el panel, igual que hoy.
 * No esconde el panel; solo gate de input. gameOver no inventa restore.
 */
export function inventoryToggleApplies(gameOver: boolean): boolean {
  if (gameOver) return false;
  return true;
}

/**
 * HAS MUERTO / F9 load-muerto: no llama apply (flag igual).
 * Vivo + wants → apply(). !wants → null.
 */
export function applyInventoryToggle<T>(
  gameOver: boolean,
  wants: boolean,
  apply: () => T | null,
): T | null {
  if (!inventoryToggleApplies(gameOver) || !wants) return null;
  return apply();
}

/**
 * HAS MUERTO / F9 load-muerto: current sin cambio (abierto queda abierto, cerrado queda cerrado).
 * Vivo + wantsToggle → flip. !wantsToggle → current. No inventa HUD copy.
 */
export function nextShowInvDetail(
  gameOver: boolean,
  current: boolean,
  wantsToggle: boolean,
): boolean {
  if (!inventoryToggleApplies(gameOver)) return current;
  if (wantsToggle) return !current;
  return current;
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
  /**
   * R / softReset: corta drag/pending leftover (inspect/click).
   * F9 no. sync(open:false) no lo llama (death paint se queda).
   */
  resetAfterRestart(): void;
  dispose(): void;
}

/** R / softReset: pending inspect del ctor (null). F9 no. */
export function inventoryInspectAfterRestart(): number | null {
  return null;
}

/**
 * R / softReset: corta drag/pending leftover. Live tick / F9 no.
 * Game.inventoryPanel debe coincidir (inspect/drag de la vida anterior no filtra).
 */
export function resetInventoryPanelAfterRestart(panel: InventoryPanel): void {
  panel.resetAfterRestart();
}

function slotIndexFromEvent(e: Event): number | null {
  const el = (e.target as Element | null)?.closest?.(".inv-slot");
  if (!el || el.classList.contains("inv-slot-empty")) return null;
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
  list.className = "inv-list inv-grid";

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
    resetAfterRestart() {
      endDrag();
      pendingClick = inventoryInspectAfterRestart();
      pendingDblClick = inventoryInspectAfterRestart();
      pendingInspect = inventoryInspectAfterRestart();
      pendingSplit = inventoryInspectAfterRestart();
      pendingMerge = inventoryInspectAfterRestart();
      pendingDrag = null;
      draggedThisGesture = false;
    },
    sync(view) {
      if (!view.open) {
        // Death paint: no resetAfterRestart / endDrag. R usa resetInventoryPanelAfterRestart.
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

      empty.hidden = true;
      list.hidden = false;
      list.replaceChildren();
      const occupied = new Map(data.slots.map((s) => [s.index, s]));
      for (let i = 0; i < data.maxSlots; i++) {
        const slot = occupied.get(i);
        const li = document.createElement("li");
        li.className = "inv-slot";
        li.dataset.index = String(i);

        const icon = document.createElement("span");
        icon.className = "inv-slot-icon";

        if (!slot) {
          li.classList.add("inv-slot-empty");
          li.title = "vacío";
          li.setAttribute("aria-label", "vacío");
          icon.innerHTML = emptySlotIconSvg();
          li.append(icon);
          list.appendChild(li);
          continue;
        }

        li.dataset.id = slot.id;
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

        li.title = slot.name;
        li.setAttribute("aria-label", `${slot.name} ×${slot.qty}`);
        icon.innerHTML = itemIconSvg(slot.id);
        li.append(icon);

        if (slot.qty > 1) {
          const qty = document.createElement("span");
          qty.className = "inv-slot-qty";
          qty.textContent = String(slot.qty);
          li.append(qty);
        }

        list.appendChild(li);
      }
      const selected = view.selectedIndex;
      list.querySelectorAll(".inv-slot").forEach((el) => {
        if (el.classList.contains("inv-slot-empty")) return;
        const n = Number((el as HTMLElement).dataset.index);
        el.classList.toggle(
          "inv-slot-selected",
          selected != null && Number.isFinite(n) && Math.trunc(n) === selected,
        );
      });
    },
    dispose() {
      window.removeEventListener("pointerup", onWindowLost);
      window.removeEventListener("pointercancel", onWindowLost);
      panel.remove();
    },
  };
}
