import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { PlayerSim } from "../src/actors/player";
import {
  createInventory,
  createStarterInventory,
  getItemDef,
} from "../src/items";
import {
  HOTBAR_SIZE,
  clampHotbarIndex,
  stepHotbarIndex,
  hotbarInputApplies,
  nextHotbarSelected,
  swapHotbarStacks,
  hotbarIndexFromKey,
  hotbarKey,
  hotbarSlotIsConsumable,
  hotbarInspectLabel,
  hotbarSlots,
} from "../src/ui/hotbar";

describe("hotbarKey", () => {
  test("índices 0..4 → teclas 1..5", () => {
    expect(hotbarKey(0)).toBe("1");
    expect(hotbarKey(1)).toBe("2");
    expect(hotbarKey(2)).toBe("3");
    expect(hotbarKey(3)).toBe("4");
    expect(hotbarKey(4)).toBe("5");
  });
});

describe("hotbarIndexFromKey", () => {
  test("Digit1–5 y Numpad1–5 → 0–4; resto null", () => {
    expect(hotbarIndexFromKey("Digit1")).toBe(0);
    expect(hotbarIndexFromKey("Digit5")).toBe(4);
    expect(hotbarIndexFromKey("Numpad3")).toBe(2);
    expect(hotbarIndexFromKey("Digit6")).toBeNull();
    expect(hotbarIndexFromKey("KeyQ")).toBeNull();
  });
});

describe("clampHotbarIndex", () => {
  test("clampa a [0, HOTBAR_SIZE-1]; NaN/no-positivo → 0", () => {
    expect(clampHotbarIndex(-1)).toBe(0);
    expect(clampHotbarIndex(99)).toBe(4);
    expect(clampHotbarIndex(2.7)).toBe(2);
    expect(clampHotbarIndex(Number.NaN)).toBe(0);
    expect(clampHotbarIndex(-0.2)).toBe(0);
  });
});

describe("stepHotbarIndex", () => {
  test("avanza, wrap y NaN", () => {
    expect(stepHotbarIndex(0, 1)).toBe(1);
    expect(stepHotbarIndex(4, 1)).toBe(0);
    expect(stepHotbarIndex(0, -1)).toBe(4);
    expect(stepHotbarIndex(2, 0)).toBe(2);
    expect(stepHotbarIndex(2, 3)).toBe(0);
    expect(stepHotbarIndex(Number.NaN, 1)).toBe(1);
  });
});

describe("hotbarSlots", () => {
  test("siempre exactamente HOTBAR_SIZE (5) entradas", () => {
    expect(HOTBAR_SIZE).toBe(5);
    expect(hotbarSlots(createInventory()).length).toBe(5);
    expect(hotbarSlots(createStarterInventory()).length).toBe(5);
  });

  test("inventario vacío → 5 empties con keys 1-5", () => {
    const inv = createInventory();
    const slots = hotbarSlots(inv);
    expect(slots).toHaveLength(5);
    for (let i = 0; i < 5; i++) {
      expect(slots[i]).toEqual({
        empty: true,
        index: i,
        key: String(i + 1),
      });
    }
    expect(inv.slots).toHaveLength(0);
  });

  test("kit inicial: nombres del catálogo en slots 0-4", () => {
    const inv = createStarterInventory();
    const before = inv.slots.map((s) => ({ ...s }));
    const slots = hotbarSlots(inv);

    expect(slots).toHaveLength(5);
    const expected = [
      { id: "water_bottle" as const, qty: 1 },
      { id: "canned_food" as const, qty: 1 },
      { id: "flashlight" as const, qty: 1 },
      { id: "pistol" as const, qty: 1 },
      { id: "ammo" as const, qty: 8 },
    ];
    for (let i = 0; i < 5; i++) {
      const slot = slots[i];
      expect(slot.empty).toBe(false);
      if (slot.empty) continue;
      expect(slot.index).toBe(i);
      expect(slot.key).toBe(String(i + 1));
      expect(slot.id).toBe(expected[i].id);
      expect(slot.qty).toBe(expected[i].qty);
      expect(slot.name).toBe(getItemDef(expected[i].id).name);
    }
    expect(slots.map((s) => (s.empty ? null : s.name))).toEqual([
      "botella de agua",
      "lata de comida",
      "linterna",
      "pistola",
      "munición",
    ]);
    expect(inv.slots).toEqual(before);
  });

  test("tras tryConsumeAt(0) starter: vacía, lata, linterna, pistola, munición", () => {
    const player = new PlayerSim({ x: 1, y: 1 });
    expect(player.tryConsumeAt(0)).toBe("drink");
    const slots = hotbarSlots(player.inventory);
    expect(slots.map((s) => (s.empty ? null : s.id))).toEqual([
      "empty_bottle",
      "canned_food",
      "flashlight",
      "pistol",
      "ammo",
    ]);
    expect(slots.map((s) => (s.empty ? null : s.name))).toEqual([
      "botella vacía",
      "lata de comida",
      "linterna",
      "pistola",
      "munición",
    ]);
  });

  test("2 stacks → 2 filled + 3 empty", () => {
    const inv = createInventory(8, 20, [
      { id: "water_bottle", qty: 1 },
      { id: "canned_food", qty: 2 },
    ]);
    const slots = hotbarSlots(inv);
    expect(slots).toHaveLength(5);
    expect(slots[0]).toEqual({
      empty: false,
      index: 0,
      key: "1",
      id: "water_bottle",
      name: getItemDef("water_bottle").name,
      qty: 1,
    });
    expect(slots[1]).toEqual({
      empty: false,
      index: 1,
      key: "2",
      id: "canned_food",
      name: getItemDef("canned_food").name,
      qty: 2,
    });
    expect(slots[2]).toEqual({ empty: true, index: 2, key: "3" });
    expect(slots[3]).toEqual({ empty: true, index: 3, key: "4" });
    expect(slots[4]).toEqual({ empty: true, index: 4, key: "5" });
    expect(inv.slots).toHaveLength(2);
  });
});

describe("swapHotbarStacks", () => {
  test("starter: swap 0 y 3 → pistola en 0, agua en 3, lata sigue en 1", () => {
    const inv = createStarterInventory();
    expect(swapHotbarStacks(inv, 0, 3)).toBe(true);
    expect(inv.slots[0]?.id).toBe("pistol");
    expect(inv.slots[3]?.id).toBe("water_bottle");
    expect(inv.slots[1]?.id).toBe("canned_food");
  });

  test("mismo índice → false, inventario intacto", () => {
    const inv = createStarterInventory();
    const before = inv.slots.map((s) => ({ ...s }));
    expect(swapHotbarStacks(inv, 2, 2)).toBe(false);
    expect(inv.slots).toEqual(before);
  });

  test("swap 0 y 4 con solo 2 stacks → false", () => {
    const inv = createInventory(8, 20, [
      { id: "water_bottle", qty: 1 },
      { id: "canned_food", qty: 2 },
    ]);
    const before = inv.slots.map((s) => ({ ...s }));
    expect(swapHotbarStacks(inv, 0, 4)).toBe(false);
    expect(inv.slots).toEqual(before);
  });

  test("swap(0, 99) con 5 stacks → intercambia 0 y 4", () => {
    const inv = createStarterInventory();
    expect(swapHotbarStacks(inv, 0, 99)).toBe(true);
    expect(inv.slots[0]?.id).toBe("ammo");
    expect(inv.slots[4]?.id).toBe("water_bottle");
  });
});

describe("hotbarSlotIsConsumable", () => {
  test("drink true, empty false, pistol false", () => {
    const slots = hotbarSlots(createStarterInventory());
    expect(slots[0]?.empty).toBe(false);
    expect(hotbarSlotIsConsumable(slots[0]!)).toBe(true);
    expect(slots[3]?.empty).toBe(false);
    if (!slots[3]?.empty) expect(slots[3].id).toBe("pistol");
    expect(hotbarSlotIsConsumable(slots[3]!)).toBe(false);
    expect(
      hotbarSlotIsConsumable({ empty: true, index: 2, key: "3" }),
    ).toBe(false);
  });
});

describe("hotbarInspectLabel", () => {
  test("empty → vacío", () => {
    expect(hotbarInspectLabel({ empty: true, index: 2, key: "3" })).toBe(
      "vacío",
    );
  });

  test("starter kit: beber / comer / linterna / disparar / sin uso", () => {
    const slots = hotbarSlots(createStarterInventory());
    expect(hotbarInspectLabel(slots[0]!)).toBe("botella de agua · beber");
    expect(hotbarInspectLabel(slots[1]!)).toBe("lata de comida · comer");
    expect(hotbarInspectLabel(slots[2]!)).toBe("linterna · linterna");
    expect(hotbarInspectLabel(slots[3]!)).toBe("pistola · disparar");
    expect(hotbarInspectLabel(slots[4]!)).toBe("munición · sin uso");
  });

  test("botella vacía, vendaje, cuchillo", () => {
    const player = new PlayerSim({ x: 1, y: 1 });
    expect(player.tryConsumeAt(0)).toBe("drink");
    const emptyBottle = hotbarSlots(player.inventory)[0]!;
    expect(hotbarInspectLabel(emptyBottle)).toBe(
      "botella vacía · rellenar (lluvia)",
    );

    const healMelee = hotbarSlots(
      createInventory(8, 20, [
        { id: "bandage", qty: 1 },
        { id: "knife", qty: 1 },
      ]),
    );
    expect(hotbarInspectLabel(healMelee[0]!)).toBe("vendaje · curar");
    expect(hotbarInspectLabel(healMelee[1]!)).toBe("cuchillo · melee");
  });
});

describe("hotbarInputApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: 1–5 / rueda / clic no cambian selección; load-muerto igual; vivo/load-vivo sí", () => {
    expect(hotbarInputApplies(true)).toBe(false);
    expect(nextHotbarSelected(true, 0, 3)).toBe(0);
    expect(nextHotbarSelected(true, 2, stepHotbarIndex(2, 1))).toBe(2);
    expect(nextHotbarSelected(true, 1, 4)).toBe(1);

    const alreadyIgnored = nextHotbarSelected(true, 0, 2);
    expect(alreadyIgnored).toBe(0);
    expect(nextHotbarSelected(true, 0, 2)).toBe(0);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(hotbarInputApplies(deadRt.gameOver)).toBe(false);
    expect(nextHotbarSelected(deadRt.gameOver, 0, 3)).toBe(0);
    expect(nextHotbarSelected(deadRt.gameOver, 2, stepHotbarIndex(2, -1))).toBe(
      2,
    );

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(hotbarInputApplies(liveRt.gameOver)).toBe(true);
    expect(nextHotbarSelected(liveRt.gameOver, 0, 3)).toBe(3);
    expect(nextHotbarSelected(liveRt.gameOver, 2, stepHotbarIndex(2, 1))).toBe(
      3,
    );

    expect(hotbarInputApplies(false)).toBe(true);
    expect(nextHotbarSelected(false, 0, 3)).toBe(3);
    expect(nextHotbarSelected(false, 4, stepHotbarIndex(4, 1))).toBe(0);
    expect(nextHotbarSelected(false, 1, 4)).toBe(4);
  });

  test("muerte no swapea stacks; vivo sí", () => {
    const deadInv = createStarterInventory();
    const before = deadInv.slots.map((s) => ({ ...s }));
    if (hotbarInputApplies(true)) {
      swapHotbarStacks(deadInv, 0, 3);
    }
    expect(deadInv.slots).toEqual(before);

    const liveInv = createStarterInventory();
    expect(hotbarInputApplies(false)).toBe(true);
    expect(swapHotbarStacks(liveInv, 0, 3)).toBe(true);
    expect(liveInv.slots[0]?.id).toBe("pistol");
    expect(liveInv.slots[3]?.id).toBe("water_bottle");
  });

  test("Game tick gatea 1–5 / rueda / clic / swap con gameOver; freeze sigue pintando hotbar", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("hotbarInputApplies(");
    expect(src).toContain("nextHotbarSelected(");
    expect(src).toMatch(
      /hotbarInputApplies\(\s*this\.gameOver[\s\S]{0,900}if \(this\.gameOver \|\| !this\.player\.alive\)/,
    );
    expect(src).toMatch(
      /this\.hotbarSelected = nextHotbarSelected\(\s*this\.gameOver/,
    );
    expect(src).toMatch(
      /refreshHud\(force: boolean\): void \{[\s\S]{0,500}if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,800}this\.hotbarHud\.sync\(hotbarSlots\(this\.player\.inventory\),\s*this\.hotbarSelected\)/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,900}this\.hotbarSelected = slot/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,900}this\.hotbarHud\.root\.hidden/,
    );
  });
});
