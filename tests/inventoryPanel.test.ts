/**
 * @vitest-environment happy-dom
 */

import { afterEach, describe, expect, test } from "vitest";
import {
  buildInventoryPanelData,
  createInventory,
  type Inventory,
} from "../src/items";
import { createInventoryPanel } from "../src/ui/inventory";
import { inventoryInspectLabel } from "../src/ui/hotbar";

function invWithHole(): Inventory {
  const inv = createInventory(8, 20);
  inv.slots.push(
    { id: "canned_food", qty: 1 },
    { id: "scrap", qty: 0 },
    { id: "water_bottle", qty: 1 },
  );
  return inv;
}

function slotAt(root: HTMLElement, originalIndex: number): HTMLElement {
  const li = root.querySelector<HTMLElement>(
    `.inv-slot[data-index="${originalIndex}"]`,
  );
  expect(li).toBeTruthy();
  return li!;
}

function clickRow(
  root: HTMLElement,
  originalIndex: number,
  shiftKey = false,
  ctrlKey = false,
  metaKey = false,
): void {
  slotAt(root, originalIndex).dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      shiftKey,
      ctrlKey,
      metaKey,
    }),
  );
}

function dblclickRow(root: HTMLElement, originalIndex: number): void {
  slotAt(root, originalIndex).dispatchEvent(
    new MouseEvent("dblclick", { bubbles: true, cancelable: true }),
  );
}

function pointerOnRow(
  root: HTMLElement,
  originalIndex: number,
  type: string,
  extra: PointerEventInit = {},
): void {
  slotAt(root, originalIndex).dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, ...extra }),
  );
}

function contextmenuRow(root: HTMLElement, originalIndex: number): void {
  slotAt(root, originalIndex).dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
  );
}

describe("inventory panel click uses original slot index", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  test("buildInventoryPanelData keeps original index through a qty=0 hole", () => {
    const data = buildInventoryPanelData(invWithHole());
    expect(data.empty).toBe(false);
    expect(data.maxSlots).toBe(8);
    expect(data.slots.map((s) => s.id)).toEqual(["canned_food", "water_bottle"]);
    expect(data.slots.map((s) => s.index)).toEqual([0, 2]);
  });

  test("click row → consumeClick returns that index; second consume is null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
      { id: "water_bottle", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    clickRow(root, 1);
    expect(panel.consumeClick()).toBe(1);
    expect(panel.consumeClick()).toBeNull();
    panel.dispose();
  });

  test("two clicks without consume → last wins", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
      { id: "water_bottle", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    clickRow(root, 0);
    clickRow(root, 2);
    expect(panel.consumeClick()).toBe(2);
    expect(panel.consumeClick()).toBeNull();
    panel.dispose();
  });

  test("hole: water at original index 2", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = invWithHole();
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    const rows = [
      ...root.querySelectorAll<HTMLElement>(".inv-slot:not(.inv-slot-empty)"),
    ];
    expect(rows.map((r) => r.dataset.index)).toEqual(["0", "2"]);
    expect(rows[1]?.dataset.id).toBe("water_bottle");
    expect(rows[1]?.style.cursor).toBe("grab");

    clickRow(root, 2);
    expect(panel.consumeClick()).toBe(2);
    panel.dispose();
  });

  test("empty panel / no click → null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);

    expect(panel.consumeClick()).toBeNull();

    panel.sync({
      open: true,
      data: buildInventoryPanelData(createInventory()),
    });
    expect(root.querySelector(".inv-slot:not(.inv-slot-empty)")).toBeNull();
    expect(root.querySelectorAll(".inv-slot-empty")).toHaveLength(8);
    expect(panel.consumeClick()).toBeNull();

    const inv = createInventory(8, 20, [{ id: "canned_food", qty: 1 }]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });
    expect(panel.consumeClick()).toBeNull();
    panel.dispose();
  });
});

describe("inventory panel consumeDblClick", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  test("dblclick row → consumeDblClick returns that index; consumeClick null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
      { id: "water_bottle", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    dblclickRow(root, 1);
    expect(panel.consumeDblClick()).toBe(1);
    expect(panel.consumeClick()).toBeNull();
    expect(panel.consumeDblClick()).toBeNull();
    panel.dispose();
  });

  test("two dblclicks without consume → last wins", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
      { id: "water_bottle", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    dblclickRow(root, 0);
    dblclickRow(root, 2);
    expect(panel.consumeDblClick()).toBe(2);
    expect(panel.consumeClick()).toBeNull();
    expect(panel.consumeDblClick()).toBeNull();
    panel.dispose();
  });

  test("dblclick after click without consume: consumeDblClick set, consumeClick null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
      { id: "water_bottle", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    clickRow(root, 1);
    dblclickRow(root, 1);
    expect(panel.consumeDblClick()).toBe(1);
    expect(panel.consumeClick()).toBeNull();
    panel.dispose();
  });
});

describe("inventory panel contextmenu inspects without using", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  test("contextmenu row → consumeInspect returns that index; consumeClick stays null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
      { id: "water_bottle", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    contextmenuRow(root, 1);
    expect(panel.consumeInspect()).toBe(1);
    expect(panel.consumeClick()).toBeNull();
    expect(panel.consumeInspect()).toBeNull();
    panel.dispose();
  });

  test("two contextmenus without consume → last wins", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
      { id: "water_bottle", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    contextmenuRow(root, 0);
    contextmenuRow(root, 2);
    expect(panel.consumeInspect()).toBe(2);
    expect(panel.consumeClick()).toBeNull();
    panel.dispose();
  });

  test("Shift+click → consumeSplit, consumeClick null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "ammo", qty: 8 },
      { id: "water_bottle", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    clickRow(root, 1, true);
    expect(panel.consumeSplit()).toBe(1);
    expect(panel.consumeClick()).toBeNull();
    expect(panel.consumeMerge()).toBeNull();
    expect(panel.consumeSplit()).toBeNull();
    panel.dispose();
  });

  test("Ctrl+click → consumeMerge, click/split null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "ammo", qty: 8 },
      { id: "water_bottle", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    clickRow(root, 1, false, true);
    expect(panel.consumeMerge()).toBe(1);
    expect(panel.consumeClick()).toBeNull();
    expect(panel.consumeSplit()).toBeNull();
    expect(panel.consumeMerge()).toBeNull();
    panel.dispose();
  });

  test("normal click → consumeClick, consumeSplit null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    clickRow(root, 0);
    expect(panel.consumeClick()).toBe(0);
    expect(panel.consumeSplit()).toBeNull();
    expect(panel.consumeMerge()).toBeNull();
    panel.dispose();
  });

  test("two Shift+clicks without consume → last wins split", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "ammo", qty: 8 },
      { id: "water_bottle", qty: 2 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    clickRow(root, 1, true);
    clickRow(root, 2, true);
    expect(panel.consumeSplit()).toBe(2);
    expect(panel.consumeClick()).toBeNull();
    expect(panel.consumeMerge()).toBeNull();
    expect(panel.consumeSplit()).toBeNull();
    panel.dispose();
  });

  test("left-click does not set inspect", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    clickRow(root, 0);
    expect(panel.consumeClick()).toBe(0);
    expect(panel.consumeInspect()).toBeNull();
    panel.dispose();
  });
});

describe("inventory panel consumeDrag", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  function openThree(panel: ReturnType<typeof createInventoryPanel>): void {
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
      { id: "water_bottle", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });
  }

  test("pointerdown row 0, pointerup row 2 → consumeDrag {from:0,to:2}, consumeClick null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    openThree(panel);

    pointerOnRow(root, 0, "pointerdown");
    pointerOnRow(root, 2, "pointerup");
    expect(panel.consumeDrag()).toEqual({ from: 0, to: 2 });
    expect(panel.consumeClick()).toBeNull();
    expect(panel.consumeDrag()).toBeNull();
    panel.dispose();
  });

  test("dos drags sin consume: last-wins", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    openThree(panel);

    pointerOnRow(root, 0, "pointerdown");
    pointerOnRow(root, 2, "pointerup");
    pointerOnRow(root, 1, "pointerdown");
    pointerOnRow(root, 0, "pointerup");
    expect(panel.consumeDrag()).toEqual({ from: 1, to: 0 });
    expect(panel.consumeClick()).toBeNull();
    panel.dispose();
  });

  test("pointerdown 0, pointerup 0 → consumeDrag null; click still consumeClick", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    openThree(panel);

    pointerOnRow(root, 0, "pointerdown");
    pointerOnRow(root, 0, "pointerup");
    expect(panel.consumeDrag()).toBeNull();
    clickRow(root, 0);
    expect(panel.consumeClick()).toBe(0);
    panel.dispose();
  });

  test("cross-row drag with shiftKey still consumeDrag, not split", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "ammo", qty: 8 },
      { id: "water_bottle", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    pointerOnRow(root, 0, "pointerdown", { shiftKey: true });
    pointerOnRow(root, 2, "pointerup", { shiftKey: true });
    clickRow(root, 2, true);
    expect(panel.consumeDrag()).toEqual({ from: 0, to: 2 });
    expect(panel.consumeSplit()).toBeNull();
    expect(panel.consumeMerge()).toBeNull();
    expect(panel.consumeClick()).toBeNull();
    panel.dispose();
  });
});

describe("inventory panel selectedIndex", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  test("selectedIndex 2 → that row has inv-slot-selected", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
      { id: "water_bottle", qty: 1 },
    ]);
    panel.sync({
      open: true,
      data: buildInventoryPanelData(inv),
      selectedIndex: 2,
    });

    const selected = [
      ...root.querySelectorAll<HTMLElement>(".inv-slot-selected"),
    ];
    expect(selected).toHaveLength(1);
    expect(selected[0]?.dataset.index).toBe("2");
    const row2 = root.querySelector<HTMLElement>('.inv-slot[data-index="2"]');
    expect(row2?.classList.contains("inv-slot-selected")).toBe(true);
    const row0 = root.querySelector<HTMLElement>('.inv-slot[data-index="0"]');
    expect(row0?.classList.contains("inv-slot-selected")).toBe(false);
    panel.dispose();
  });
});

describe("createInventoryPanel grid + icons", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  test("ul.inv-list tiene inv-grid; cada slot SVG + aria-label + title", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "water_bottle", qty: 2 },
      { id: "flashlight", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    const list = root.querySelector("ul.inv-list");
    expect(list).toBeTruthy();
    expect(list!.classList.contains("inv-grid")).toBe(true);

    const food = slotAt(root, 0);
    expect(food.title).toBe("lata de comida");
    expect(food.getAttribute("aria-label")).toBe("lata de comida ×1");
    expect(food.querySelector(".inv-slot-qty")).toBeNull();
    expect(food.querySelector(".inv-slot-icon svg")).toBeTruthy();
    expect(food.querySelector(".inv-slot-name")).toBeNull();
    expect(food.querySelector(".inv-slot-weight")).toBeNull();

    const water = slotAt(root, 1);
    expect(water.title).toBe("botella de agua");
    expect(water.getAttribute("aria-label")).toBe("botella de agua ×2");
    expect(water.querySelector(".inv-slot-qty")?.textContent).toBe("2");
    expect(water.querySelector(".inv-slot-icon svg")).toBeTruthy();

    const light = slotAt(root, 2);
    expect(light.title).toBe("linterna");
    expect(light.getAttribute("aria-label")).toBe("linterna ×1");
    expect(light.querySelector(".inv-slot-qty")).toBeNull();
    expect(light.querySelector(".inv-slot-icon svg")).toBeTruthy();

    expect(root.querySelectorAll(".inv-slot")).toHaveLength(8);
    expect(root.querySelectorAll(".inv-slot-empty")).toHaveLength(5);

    panel.dispose();
  });

  test("click en icono SVG sigue consumeClick (delegación .inv-slot)", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "water_bottle", qty: 2 },
      { id: "flashlight", qty: 1 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    const icon = slotAt(root, 1).querySelector(".inv-slot-icon");
    expect(icon).toBeTruthy();
    icon!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(panel.consumeClick()).toBe(1);
    panel.dispose();
  });

  test("celdas vacías: ghost dashed + vacío; ocupadas sin cambio; no gestos en vacío", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "water_bottle", qty: 2 },
    ]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    const cells = [...root.querySelectorAll<HTMLElement>(".inv-slot")];
    expect(cells).toHaveLength(8);
    expect(root.querySelectorAll(".inv-slot-empty")).toHaveLength(6);

    const food = slotAt(root, 0);
    expect(food.classList.contains("inv-slot-empty")).toBe(false);
    expect(food.title).toBe("lata de comida");
    expect(food.getAttribute("aria-label")).toBe("lata de comida ×1");
    const foodIcon = food.querySelector(".inv-slot-icon")?.innerHTML ?? "";
    expect(foodIcon).toContain("<svg");
    expect(foodIcon).not.toContain("stroke-dasharray");

    const water = slotAt(root, 1);
    expect(water.querySelector(".inv-slot-qty")?.textContent).toBe("2");
    expect(water.classList.contains("inv-slot-empty")).toBe(false);

    const empty = slotAt(root, 2);
    const emptyIcon = empty.querySelector(".inv-slot-icon")?.innerHTML ?? "";
    expect(empty.classList.contains("inv-slot-empty")).toBe(true);
    expect(empty.dataset.id).toBeUndefined();
    expect(empty.querySelector(".inv-slot-icon svg")).toBeTruthy();
    expect(emptyIcon).toContain("stroke-dasharray");
    expect(emptyIcon).toContain("M16 6.5");
    expect(emptyIcon).not.toContain("M16 3.5");
    expect(empty.querySelector(".inv-slot-qty")).toBeNull();
    expect(empty.title).toBe("vacío");
    expect(empty.getAttribute("aria-label")).toBe("vacío");

    empty.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(panel.consumeClick()).toBeNull();
    empty.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, cancelable: true }),
    );
    expect(panel.consumeDblClick()).toBeNull();
    empty.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
    );
    expect(panel.consumeInspect()).toBeNull();

    clickRow(root, 1);
    expect(panel.consumeClick()).toBe(1);
    panel.dispose();
  });

  test("inventario vacío: maxSlots ghosts dashed + vacío; sin ocupados", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    const inv = createInventory(6, 20);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });

    const cells = [...root.querySelectorAll<HTMLElement>(".inv-slot")];
    expect(cells).toHaveLength(6);
    for (const cell of cells) {
      expect(cell.classList.contains("inv-slot-empty")).toBe(true);
      const iconHtml = cell.querySelector(".inv-slot-icon")?.innerHTML ?? "";
      expect(iconHtml).toContain("stroke-dasharray");
      expect(iconHtml).toContain("M16 6.5");
      expect(iconHtml).not.toContain("M16 3.5");
      expect(cell.title).toBe("vacío");
      expect(cell.getAttribute("aria-label")).toBe("vacío");
      expect(cell.querySelector(".inv-slot-qty")).toBeNull();
    }
    expect(root.querySelector(".inv-empty")?.hidden).toBe(true);
    expect(root.querySelector("ul.inv-list")?.hidden).toBe(false);
    panel.dispose();
  });

  test("hueco qty=0 es celda vacía; drop en vacío no consumeDrag", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createInventoryPanel(root);
    panel.sync({ open: true, data: buildInventoryPanelData(invWithHole()) });

    const hole = slotAt(root, 1);
    expect(hole.classList.contains("inv-slot-empty")).toBe(true);
    expect(hole.title).toBe("vacío");
    expect(hole.querySelector(".inv-slot-icon")?.innerHTML).toContain(
      "stroke-dasharray",
    );

    pointerOnRow(root, 0, "pointerdown");
    pointerOnRow(root, 1, "pointerup");
    expect(panel.consumeDrag()).toBeNull();
    expect(panel.consumeClick()).toBeNull();

    pointerOnRow(root, 0, "pointerdown");
    pointerOnRow(root, 2, "pointerup");
    expect(panel.consumeDrag()).toEqual({ from: 0, to: 2 });
    panel.dispose();
  });
});

describe("inventoryInspectLabel", () => {
  test("empty / qty<=0 → vacío", () => {
    const empty = createInventory();
    expect(inventoryInspectLabel(empty, 0)).toBe("vacío");
    const hole = createInventory(8, 20);
    hole.slots.push(
      { id: "canned_food", qty: 1 },
      { id: "scrap", qty: 0 },
    );
    expect(inventoryInspectLabel(hole, 1)).toBe("vacío");
  });

  test("canned_food contains comer; flashlight contains linterna", () => {
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
    ]);
    expect(inventoryInspectLabel(inv, 0)).toContain("comer");
    expect(inventoryInspectLabel(inv, 1)).toContain("linterna");
    expect(inventoryInspectLabel(inv, 1)).toBe("linterna · linterna");
  });
});
