import { describe, expect, test } from "vitest";
import {
  ContainerRegistry,
  createInventory,
  createStarterInventory,
  dropOnTile,
  dropQty,
  dropTargetTile,
  dropToastLabel,
  takeFromSlot,
} from "../src/items";

describe("dropTargetTile", () => {
  test("spawn facing +Y → 24,16", () => {
    expect(dropTargetTile(24.5, 15.5, 0, 1)).toEqual({ tx: 24, ty: 16 });
  });

  test("facing 0,0 → 24,15", () => {
    expect(dropTargetTile(24.5, 15.5, 0, 0)).toEqual({ tx: 24, ty: 15 });
  });

  test("facing +X → 25,15", () => {
    expect(dropTargetTile(24.5, 15.5, 1, 0)).toEqual({ tx: 25, ty: 15 });
  });

  test("blocked walkable → fallback feet", () => {
    const walkable = (x: number, y: number) => !(x === 24 && y === 16);
    expect(dropTargetTile(24.5, 15.5, 0, 1, walkable)).toEqual({
      tx: 24,
      ty: 15,
    });
  });

  test("non-finite pos → 0,0", () => {
    expect(
      dropTargetTile(Number.NaN, Number.POSITIVE_INFINITY, Number.NaN, Number.NaN),
    ).toEqual({ tx: 0, ty: 0 });
  });
});

describe("dropQty", () => {
  test("without wholeStack always 1", () => {
    expect(dropQty(8, false)).toBe(1);
  });

  test("wholeStack with finite qty>=1 → trunc(qty)", () => {
    expect(dropQty(8, true)).toBe(8);
  });

  test("wholeStack with undefined qty → 1", () => {
    expect(dropQty(undefined, true)).toBe(1);
  });
});

describe("dropToastLabel", () => {
  test("qty>1 includes ×qty", () => {
    expect(dropToastLabel("munición", 8)).toBe("tiraste munición ×8");
  });

  test("qty 1 has no multiplier", () => {
    expect(dropToastLabel("botella de agua", 1)).toBe("tiraste botella de agua");
  });
});

describe("takeFromSlot", () => {
  test("starter slot 0 → water×1, remaining kit shifts", () => {
    const inv = createStarterInventory();
    expect(inv.slots[0]?.id).toBe("water_bottle");
    const taken = takeFromSlot(inv, 0);
    expect(taken).toEqual({ id: "water_bottle", qty: 1 });
    expect(inv.slots.map((s) => s.id)).toEqual([
      "canned_food",
      "flashlight",
      "pistol",
      "ammo",
    ]);
    expect(inv.slots.find((s) => s.id === "ammo")?.qty).toBe(8);
  });

  test("invalid slot → null", () => {
    const inv = createStarterInventory();
    expect(takeFromSlot(inv, 99)).toBeNull();
    expect(takeFromSlot(inv, -1)).toBeNull();
    expect(inv.slots[0]?.id).toBe("water_bottle");
  });

  test("starter ammo index 4 qty 8 → ammo×8, no ammo left", () => {
    const inv = createStarterInventory();
    expect(inv.slots[4]?.id).toBe("ammo");
    expect(inv.slots[4]?.qty).toBe(8);
    const taken = takeFromSlot(inv, 4, dropQty(inv.slots[4]?.qty, true));
    expect(taken).toEqual({ id: "ammo", qty: 8 });
    expect(inv.slots.find((s) => s.id === "ammo")).toBeUndefined();
  });
});

describe("dropOnTile", () => {
  test('empty registry → container named "botella de agua" at (24,15)', () => {
    const reg = new ContainerRegistry();
    const c = dropOnTile(
      reg,
      24,
      15,
      { id: "water_bottle", qty: 1 },
      "drop-24-15-water_bottle",
    );
    expect(c.name).toBe("botella de agua");
    expect(c.x).toBe(24);
    expect(c.y).toBe(15);
    expect(c.id).toBe("drop-24-15-water_bottle");
    expect(reg.list).toHaveLength(1);
    expect(c.inv.slots[0]).toEqual({ id: "water_bottle", qty: 1 });
  });

  test("drop same tile again → merge, list.length 1", () => {
    const reg = new ContainerRegistry();
    const first = dropOnTile(
      reg,
      24,
      15,
      { id: "water_bottle", qty: 1 },
      "drop-24-15-water_bottle",
    );
    const again = dropOnTile(
      reg,
      24,
      15,
      { id: "water_bottle", qty: 1 },
      "drop-24-15-water_bottle",
    );
    expect(reg.list).toHaveLength(1);
    expect(again).toBe(first);
    expect(again.inv.slots).toHaveLength(1);
    expect(again.inv.slots[0]).toEqual({ id: "water_bottle", qty: 2 });
    expect(again.name).toBe("botella de agua ×2");
  });

  test("drop other tile → second container", () => {
    const reg = new ContainerRegistry();
    dropOnTile(
      reg,
      24,
      15,
      { id: "water_bottle", qty: 1 },
      "drop-24-15-water_bottle",
    );
    const other = dropOnTile(
      reg,
      10,
      10,
      { id: "canned_food", qty: 1 },
      "drop-10-10-canned_food",
    );
    expect(reg.list).toHaveLength(2);
    expect(other.name).toBe("lata de comida");
    expect(other.x).toBe(10);
    expect(other.y).toBe(10);
  });

  test("lootOne can pick 1 from the dropped pile", () => {
    const reg = new ContainerRegistry();
    dropOnTile(
      reg,
      24,
      15,
      { id: "water_bottle", qty: 1 },
      "drop-24-15-water_bottle",
    );
    const dest = createInventory();
    const taken = reg.lootOne(24.5, 15.5, dest);
    expect(taken).toEqual({ id: "water_bottle", qty: 1 });
    expect(dest.slots[0]).toEqual({ id: "water_bottle", qty: 1 });
    expect(reg.at(24, 15)?.inv.slots).toHaveLength(0);
  });
});
