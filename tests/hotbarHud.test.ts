/**
 * @vitest-environment happy-dom
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createInventory, createStarterInventory } from "../src/items";
import { hotbarSlots } from "../src/ui/hotbar";
import { createHotbarHud } from "../src/ui/hotbarHud";

function slotAt(root: HTMLElement, index: number): HTMLElement {
  const slot = root.querySelectorAll<HTMLElement>(".hotbar-slot")[index];
  expect(slot).toBeTruthy();
  return slot;
}

function clickSlot(
  root: HTMLElement,
  index: number,
  shiftKey = false,
  ctrlKey = false,
  metaKey = false,
): void {
  const slot = root.querySelectorAll<HTMLElement>(".hotbar-slot")[index];
  slot.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      shiftKey,
      ctrlKey,
      metaKey,
    }),
  );
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

  // CSS lock: `.hotbar-selected` gold matches `.inv-slot-selected` (see "selected CSS" below).
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

function pointerOnSlot(
  root: HTMLElement,
  index: number,
  type: string,
  extra: PointerEventInit = {},
): void {
  const slot = root.querySelectorAll<HTMLElement>(".hotbar-slot")[index];
  slot.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, ...extra }),
  );
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

describe("hotbarHud consumeSplit / consumeMerge", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  test("Shift+click slot → consumeSplit returns index, consumeClick/merge null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    clickSlot(root, 2, true);
    expect(hud.consumeSplit()).toBe(2);
    expect(hud.consumeClick()).toBeNull();
    expect(hud.consumeMerge()).toBeNull();
    expect(hud.consumeSplit()).toBeNull();
    hud.dispose();
  });

  test("two Shift+clicks without consume → last wins split", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    clickSlot(root, 1, true);
    clickSlot(root, 4, true);
    expect(hud.consumeSplit()).toBe(4);
    expect(hud.consumeClick()).toBeNull();
    expect(hud.consumeMerge()).toBeNull();
    hud.dispose();
  });

  test("Ctrl+click → consumeMerge, consumeClick/split null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    clickSlot(root, 3, false, true);
    expect(hud.consumeMerge()).toBe(3);
    expect(hud.consumeClick()).toBeNull();
    expect(hud.consumeSplit()).toBeNull();
    expect(hud.consumeMerge()).toBeNull();
    hud.dispose();
  });

  test("Cmd+click → consumeMerge", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    clickSlot(root, 0, false, false, true);
    expect(hud.consumeMerge()).toBe(0);
    expect(hud.consumeClick()).toBeNull();
    expect(hud.consumeSplit()).toBeNull();
    hud.dispose();
  });

  test("normal click still consumeClick; split/merge null", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    clickSlot(root, 1);
    expect(hud.consumeClick()).toBe(1);
    expect(hud.consumeSplit()).toBeNull();
    expect(hud.consumeMerge()).toBeNull();
    hud.dispose();
  });

  test("cross-slot drag with shiftKey still consumeDrag, not split", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    pointerOnSlot(root, 0, "pointerdown", { shiftKey: true });
    pointerOnSlot(root, 3, "pointerup", { shiftKey: true });
    expect(hud.consumeDrag()).toEqual({ from: 0, to: 3 });
    expect(hud.consumeSplit()).toBeNull();
    expect(hud.consumeMerge()).toBeNull();
    expect(hud.consumeClick()).toBeNull();
    hud.dispose();
  });

  test("same-slot pointerup with shiftKey → consumeSplit, not click", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createStarterInventory()), 0);

    pointerOnSlot(root, 2, "pointerdown", { shiftKey: true });
    pointerOnSlot(root, 2, "pointerup", { shiftKey: true });
    expect(hud.consumeSplit()).toBe(2);
    expect(hud.consumeClick()).toBeNull();
    expect(hud.consumeDrag()).toBeNull();
    hud.dispose();
  });
});

describe("createHotbarHud icons", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  test("slot ocupado tiene svg + title/aria-label; vacío ghost + vacío · N; qty>1 badge", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    const inv = createInventory(8, 20, [
      { id: "water_bottle", qty: 1 },
      { id: "canned_food", qty: 2 },
    ]);
    hud.sync(hotbarSlots(inv), 0);

    const water = slotAt(root, 0);
    const waterIcon = water.querySelector(".hotbar-slot-icon")?.innerHTML ?? "";
    expect(water.querySelector(".hotbar-slot-icon svg")).toBeTruthy();
    expect(waterIcon).toContain("<svg");
    expect(waterIcon).toContain("M13 3.5h6v3.2");
    expect(waterIcon).not.toContain("stroke-dasharray");
    expect(water.title).toBe("botella de agua");
    expect(water.getAttribute("aria-label")).toBe("botella de agua ×1");
    expect(water.querySelector(".hotbar-qty")).toBeNull();
    expect(water.querySelector(".hotbar-key")?.textContent).toBe("1");

    const food = slotAt(root, 1);
    expect(food.querySelector(".hotbar-slot-icon svg")).toBeTruthy();
    expect(food.querySelector(".hotbar-qty")?.textContent).toBe("2");
    expect(food.querySelector(".hotbar-key")?.textContent).toBe("2");

    const empty = slotAt(root, 2);
    const emptyIcon = empty.querySelector(".hotbar-slot-icon")?.innerHTML ?? "";
    expect(empty.classList.contains("hotbar-empty")).toBe(true);
    expect(empty.querySelector(".hotbar-slot-icon svg")).toBeTruthy();
    expect(emptyIcon).toContain("stroke-dasharray");
    expect(emptyIcon).toContain("M16 6.5");
    expect(emptyIcon).not.toContain("M16 3.5");
    expect(empty.querySelector(".hotbar-qty")).toBeNull();
    expect(empty.title).toBe("vacío · 3");
    expect(empty.getAttribute("aria-label")).toBe("vacío · 3");
    expect(empty.querySelector(".hotbar-key")?.textContent).toBe("3");

    hud.dispose();
  });

  test("inventario vacío: 5 ghosts dashed + tecla + vacío · N", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    hud.sync(hotbarSlots(createInventory()), 0);

    for (let i = 0; i < 5; i++) {
      const slot = slotAt(root, i);
      expect(slot.classList.contains("hotbar-empty")).toBe(true);
      const iconHtml = slot.querySelector(".hotbar-slot-icon")?.innerHTML ?? "";
      expect(iconHtml).toContain("stroke-dasharray");
      expect(iconHtml).toContain("M16 6.5");
      expect(iconHtml).not.toContain("M16 3.5");
      expect(slot.querySelector(".hotbar-key")?.textContent).toBe(String(i + 1));
      expect(slot.title).toBe(`vacío · ${i + 1}`);
      expect(slot.getAttribute("aria-label")).toBe(`vacío · ${i + 1}`);
      expect(slot.querySelector(".hotbar-qty")).toBeNull();
    }
    hud.dispose();
  });

  test("click en icono SVG sigue consumeClick (burbuja al slot)", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createHotbarHud(root);
    const inv = createInventory(8, 20, [
      { id: "water_bottle", qty: 1 },
      { id: "canned_food", qty: 2 },
    ]);
    hud.sync(hotbarSlots(inv), 0);

    const icon = slotAt(root, 1).querySelector(".hotbar-slot-icon");
    expect(icon).toBeTruthy();
    icon!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(hud.consumeClick()).toBe(1);
    hud.dispose();
  });
});

describe("hotbar selected CSS", () => {
  test(".hotbar-selected gold matches .inv-slot-selected; key #e8c36a", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toMatch(
      /\.hotbar-slot\.hotbar-selected\s*\{[^}]*border-color:\s*rgba\(232,\s*196,\s*106,\s*0\.95\)/s,
    );
    expect(html).toMatch(
      /\.hotbar-slot\.hotbar-selected\s*\{[^}]*0 0 0 1px rgba\(232,\s*196,\s*106,\s*0\.55\)/s,
    );
    expect(html).toMatch(
      /\.hotbar-slot\.hotbar-selected\s*\{[^}]*0 0 14px rgba\(212,\s*168,\s*75,\s*0\.28\)/s,
    );
    expect(html).toMatch(
      /\.hotbar-slot\.hotbar-selected\s+\.hotbar-key\s*\{\s*color:\s*#e8c36a;/,
    );
    expect(html).not.toMatch(
      /\.hotbar-slot\.hotbar-selected\s*\{[^}]*rgba\(96,\s*165,\s*250/s,
    );
  });
});
