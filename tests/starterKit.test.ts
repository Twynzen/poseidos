import { describe, expect, test } from "vitest";
import {
  STARTER_KIT,
  applyStarterKit,
  createInventory,
  createStarterInventory,
  findSlot,
  hasFlashlight,
  totalQty,
} from "../src/items";
import { PlayerSim } from "../src/actors/player";

describe("starter kit", () => {
  test("applyStarterKit añade agua + lata + linterna + pistola + munición", () => {
    const inv = createInventory(8, 20);
    expect(totalQty(inv)).toBe(0);
    applyStarterKit(inv);
    expect(findSlot(inv, "water_bottle")).toBeGreaterThanOrEqual(0);
    expect(findSlot(inv, "canned_food")).toBeGreaterThanOrEqual(0);
    expect(findSlot(inv, "flashlight")).toBeGreaterThanOrEqual(0);
    expect(findSlot(inv, "pistol")).toBeGreaterThanOrEqual(0);
    expect(findSlot(inv, "ammo")).toBeGreaterThanOrEqual(0);
    expect(inv.slots.find((s) => s.id === "water_bottle")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "canned_food")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "flashlight")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "pistol")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "ammo")?.qty).toBe(8);
    expect(STARTER_KIT).toHaveLength(5);
  });

  test("createStarterInventory no vacío y hasFlashlight true", () => {
    const inv = createStarterInventory();
    expect(inv.slots.length).toBeGreaterThan(0);
    expect(totalQty(inv)).toBe(12);
    expect(hasFlashlight(inv)).toBe(true);
  });

  test("PlayerSim sin inventory usa kit por defecto", () => {
    const player = new PlayerSim({ x: 1, y: 1 });
    expect(hasFlashlight(player.inventory)).toBe(true);
    expect(findSlot(player.inventory, "water_bottle")).toBeGreaterThanOrEqual(
      0,
    );
    expect(findSlot(player.inventory, "canned_food")).toBeGreaterThanOrEqual(
      0,
    );
    expect(findSlot(player.inventory, "pistol")).toBeGreaterThanOrEqual(0);
    expect(player.inventory.slots.find((s) => s.id === "ammo")?.qty).toBe(8);
  });

  test("PlayerSim con inventory explícito no aplica kit", () => {
    const empty = createInventory(8, 20);
    const player = new PlayerSim({ x: 0, y: 0 }, undefined, empty);
    expect(player.inventory.slots).toHaveLength(0);
    expect(hasFlashlight(player.inventory)).toBe(false);
  });

  test("tryConsumeAt(0) bebe y deja empty_bottle en el mismo índice", () => {
    const player = new PlayerSim({ x: 1, y: 1 });
    expect(player.inventory.slots[0]?.id).toBe("water_bottle");
    expect(player.tryConsumeAt(0)).toBe("drink");
    expect(player.inventory.slots[0]?.id).toBe("empty_bottle");
    expect(player.inventory.slots[0]?.qty).toBe(1);
    expect(player.inventory.slots[1]?.id).toBe("canned_food");
    expect(player.inventory.slots.map((s) => s.id)).toEqual([
      "empty_bottle",
      "canned_food",
      "flashlight",
      "pistol",
      "ammo",
    ]);
  });

  test("tryConsumeAt leftover water_bottle: empty_bottle al final", () => {
    const inv = createInventory(8, 20, [
      { id: "water_bottle", qty: 2 },
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
    ]);
    const player = new PlayerSim({ x: 0, y: 0 }, { thirst: 80 }, inv);
    expect(player.tryConsumeAt(0)).toBe("drink");
    expect(player.inventory.slots[0]).toEqual({ id: "water_bottle", qty: 1 });
    expect(player.inventory.slots[1]?.id).toBe("canned_food");
    expect(player.inventory.slots[2]?.id).toBe("flashlight");
    expect(player.inventory.slots[3]).toEqual({ id: "empty_bottle", qty: 1 });
  });

  test("tryConsumeAt(3) pistola → null, pistola sigue", () => {
    const player = new PlayerSim({ x: 1, y: 1 });
    expect(player.inventory.slots[3]?.id).toBe("pistol");
    expect(player.tryConsumeAt(3)).toBeNull();
    expect(player.inventory.slots[3]?.id).toBe("pistol");
    expect(player.inventory.slots[0]?.id).toBe("water_bottle");
  });

  test("tryConsumeAt(4) ammo → null", () => {
    const player = new PlayerSim({ x: 1, y: 1 });
    expect(player.inventory.slots[4]?.id).toBe("ammo");
    expect(player.tryConsumeAt(4)).toBeNull();
    expect(player.inventory.slots[4]?.id).toBe("ammo");
    expect(player.inventory.slots[4]?.qty).toBe(8);
  });

  test("tryConsumeAt(99) → null", () => {
    const player = new PlayerSim({ x: 1, y: 1 });
    expect(player.tryConsumeAt(99)).toBeNull();
  });
});
