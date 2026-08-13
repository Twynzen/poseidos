import { describe, expect, test } from "vitest";
import {
  ContainerRegistry,
  createInventory,
  createStarterInventory,
  dropOnTile,
  takeFromSlot,
} from "../src/items";

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
