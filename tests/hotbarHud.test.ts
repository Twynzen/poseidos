/**
 * @vitest-environment happy-dom
 */

import { afterEach, describe, expect, test } from "vitest";
import { createInventory, createStarterInventory } from "../src/items";
import { hotbarSlots } from "../src/ui/hotbar";
import { createHotbarHud } from "../src/ui/hotbarHud";

function clickSlot(root: HTMLElement, index: number): void {
  const slot = root.querySelectorAll<HTMLElement>(".hotbar-slot")[index];
  slot.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

describe("hotbarHud consumeClick", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  test("click slot 3 → consumeClick 3, segundo consume null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    clickSlot(root, 3);
    expect(hud.consumeClick()).toBe(3);
    expect(hud.consumeClick()).toBeNull();
    hud.dispose();
  });

  test("click 0 luego 4 sin consume → consumeClick 4", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    clickSlot(root, 0);
    clickSlot(root, 4);
    expect(hud.consumeClick()).toBe(4);
    expect(hud.consumeClick()).toBeNull();
    hud.dispose();
  });

  test("consume 3 luego sync(..., 3) → solo ese slot hotbar-selected", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    clickSlot(root, 3);
    expect(hud.consumeClick()).toBe(3);
    hud.sync(hotbarSlots(createStarterInventory()), 3);

    const slots = [...root.querySelectorAll(".hotbar-slot")];
    expect(slots.filter((s) => s.classList.contains("hotbar-selected"))).toHaveLength(
      1,
    );
    expect(slots[3].classList.contains("hotbar-selected")).toBe(true);
    hud.dispose();
  });

  test("slot vacío sigue seleccionando; cursor pointer; data-hotbar-index", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createInventory()), 0);

    const empty = root.querySelectorAll<HTMLElement>(".hotbar-slot")[2];
    expect(empty.classList.contains("hotbar-empty")).toBe(true);
    expect(empty.style.cursor).toBe("pointer");
    expect(empty.dataset.hotbarIndex).toBe("2");

    clickSlot(root, 2);
    expect(hud.consumeClick()).toBe(2);
    hud.dispose();
  });
});
