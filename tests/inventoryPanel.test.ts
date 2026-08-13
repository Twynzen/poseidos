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

function invWithHole(): Inventory {
  const inv = createInventory(8, 20);
  inv.slots.push(
    { id: "canned_food", qty: 1 },
    { id: "scrap", qty: 0 },
    { id: "water_bottle", qty: 1 },
  );
  return inv;
}

function clickRow(root: HTMLElement, originalIndex: number): void {
  const li = root.querySelector<HTMLElement>(
    `.inv-slot[data-index="${originalIndex}"]`,
  );
  expect(li).toBeTruthy();
  li!.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true }),
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
