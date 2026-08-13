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

function clickRow(
  root: HTMLElement,
  originalIndex: number,
  shiftKey = false,
  ctrlKey = false,
  metaKey = false,
): void {
  const li = root.querySelector<HTMLElement>(
    `.inv-slot[data-index="${originalIndex}"]`,
  );
  expect(li).toBeTruthy();
  li!.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      shiftKey,
      ctrlKey,
      metaKey,
    }),
  );
}

function contextmenuRow(root: HTMLElement, originalIndex: number): void {
  const li = root.querySelector<HTMLElement>(
    `.inv-slot[data-index="${originalIndex}"]`,
  );
  expect(li).toBeTruthy();
  li!.dispatchEvent(
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

    const rows = [...root.querySelectorAll<HTMLElement>(".inv-slot")];
    expect(rows.map((r) => r.dataset.index)).toEqual(["0", "2"]);
    expect(rows[1]?.dataset.id).toBe("water_bottle");
    expect(rows[1]?.style.cursor).toBe("pointer");

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
    expect(root.querySelector(".inv-slot")).toBeNull();
    expect(panel.consumeClick()).toBeNull();

    const inv = createInventory(8, 20, [{ id: "canned_food", qty: 1 }]);
    panel.sync({ open: true, data: buildInventoryPanelData(inv) });
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
