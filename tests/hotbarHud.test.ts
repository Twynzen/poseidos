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

  test("slot vacío sigue seleccionando; cursor grab; data-hotbar-index", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createInventory()), 0);

    const empty = root.querySelectorAll<HTMLElement>(".hotbar-slot")[2];
    expect(empty.classList.contains("hotbar-empty")).toBe(true);
    expect(empty.style.cursor).toBe("grab");
    expect(empty.dataset.hotbarIndex).toBe("2");

    clickSlot(root, 2);
    expect(hud.consumeClick()).toBe(2);
    hud.dispose();
  });
});

function pointerOnSlot(root: HTMLElement, index: number, type: string): void {
  const slot = root.querySelectorAll<HTMLElement>(".hotbar-slot")[index];
  slot.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true }));
}

function dblclickSlot(root: HTMLElement, index: number): void {
  const slot = root.querySelectorAll<HTMLElement>(".hotbar-slot")[index];
  slot.dispatchEvent(
    new MouseEvent("dblclick", { bubbles: true, cancelable: true }),
  );
}

describe("hotbarHud consumeDrag", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  test("pointerdown 0, pointerup 3 → consumeDrag {from:0,to:3}, consumeClick null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    pointerOnSlot(root, 0, "pointerdown");
    pointerOnSlot(root, 3, "pointerup");
    expect(hud.consumeDrag()).toEqual({ from: 0, to: 3 });
    expect(hud.consumeClick()).toBeNull();
    hud.dispose();
  });

  test("pointerdown 0, pointerup 0 → consumeDrag null, consumeClick 0", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    pointerOnSlot(root, 0, "pointerdown");
    pointerOnSlot(root, 0, "pointerup");
    expect(hud.consumeDrag()).toBeNull();
    expect(hud.consumeClick()).toBe(0);
    hud.dispose();
  });

  test("segundo consumeDrag null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    pointerOnSlot(root, 0, "pointerdown");
    pointerOnSlot(root, 3, "pointerup");
    expect(hud.consumeDrag()).toEqual({ from: 0, to: 3 });
    expect(hud.consumeDrag()).toBeNull();
    hud.dispose();
  });

  test("dos drags sin consume: gana el último", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    pointerOnSlot(root, 0, "pointerdown");
    pointerOnSlot(root, 3, "pointerup");
    pointerOnSlot(root, 1, "pointerdown");
    pointerOnSlot(root, 4, "pointerup");
    expect(hud.consumeDrag()).toEqual({ from: 1, to: 4 });
    expect(hud.consumeClick()).toBeNull();
    hud.dispose();
  });
});

describe("hotbarHud consumeDblClick", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  test("dblclick slot 0 → consumeDblClick 0, segundo consume null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    dblclickSlot(root, 0);
    expect(hud.consumeDblClick()).toBe(0);
    expect(hud.consumeDblClick()).toBeNull();
    hud.dispose();
  });

  test("dblclick 1 luego 3 sin consume → consumeDblClick 3", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    dblclickSlot(root, 1);
    dblclickSlot(root, 3);
    expect(hud.consumeDblClick()).toBe(3);
    expect(hud.consumeDblClick()).toBeNull();
    hud.dispose();
  });

  test("dblclick no produce consumeDrag", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    dblclickSlot(root, 2);
    expect(hud.consumeDrag()).toBeNull();
    expect(hud.consumeDblClick()).toBe(2);
    hud.dispose();
  });
});

function contextmenuSlot(root: HTMLElement, index: number): MouseEvent {
  const slot = root.querySelectorAll<HTMLElement>(".hotbar-slot")[index];
  const ev = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
  slot.dispatchEvent(ev);
  return ev;
}

describe("hotbarHud consumeInspect", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  test("contextmenu slot 3 → consumeInspect 3; consumeDrag/dblclick null; defaultPrevented", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    const ev = contextmenuSlot(root, 3);
    expect(ev.defaultPrevented).toBe(true);
    expect(hud.consumeInspect()).toBe(3);
    expect(hud.consumeInspect()).toBeNull();
    expect(hud.consumeDrag()).toBeNull();
    expect(hud.consumeDblClick()).toBeNull();
    hud.dispose();
  });

  test("contextmenu 1 luego 4 sin consume → consumeInspect 4", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    contextmenuSlot(root, 1);
    contextmenuSlot(root, 4);
    expect(hud.consumeInspect()).toBe(4);
    hud.dispose();
  });

  test("contextmenu en la barra preventDefault", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    const bar = root.querySelector("#hotbar");
    const ev = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    bar?.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(hud.consumeInspect()).toBeNull();
    hud.dispose();
  });

  test("pointerdown no-primario no inicia drag", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    const from = root.querySelectorAll<HTMLElement>(".hotbar-slot")[0];
    const to = root.querySelectorAll<HTMLElement>(".hotbar-slot")[3];
    from.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        button: 2,
      }),
    );
    to.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        button: 2,
      }),
    );
    expect(hud.consumeDrag()).toBeNull();
    expect(hud.consumeClick()).toBeNull();
    hud.dispose();
  });
});
