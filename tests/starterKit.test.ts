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
  test("applyStarterKit añade agua + lata + linterna", () => {
    const inv = createInventory(8, 20);
    expect(totalQty(inv)).toBe(0);
    applyStarterKit(inv);
    expect(findSlot(inv, "water_bottle")).toBeGreaterThanOrEqual(0);
    expect(findSlot(inv, "canned_food")).toBeGreaterThanOrEqual(0);
    expect(findSlot(inv, "flashlight")).toBeGreaterThanOrEqual(0);
    expect(inv.slots.find((s) => s.id === "water_bottle")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "canned_food")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "flashlight")?.qty).toBe(1);
    expect(STARTER_KIT).toHaveLength(3);
  });

  test("createStarterInventory no vacío y hasFlashlight true", () => {
    const inv = createStarterInventory();
    expect(inv.slots.length).toBeGreaterThan(0);
    expect(totalQty(inv)).toBe(3);
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
  });

  test("PlayerSim con inventory explícito no aplica kit", () => {
    const empty = createInventory(8, 20);
    const player = new PlayerSim({ x: 0, y: 0 }, undefined, empty);
    expect(player.inventory.slots).toHaveLength(0);
    expect(hasFlashlight(player.inventory)).toBe(false);
  });
});
