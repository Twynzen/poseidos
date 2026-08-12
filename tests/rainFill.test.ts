import { describe, expect, test } from "vitest";
import { PlayerSim } from "../src/actors/player";
import { NEEDS_RELIEF } from "../src/actors/needs";
import {
  addItem,
  canRefillFromRain,
  createInventory,
  diagnoseRefill,
  findSlot,
  getItemDef,
  inventorySummary,
  refillFailMessage,
  tryRefillFromRain,
} from "../src/items";
import {
  applySave,
  createMemoryStorage,
  loadFromString,
  readSave,
  saveToString,
  writeSave,
} from "../src/core/save";
import { GameClock } from "../src/core/clock";
import { createNeighborhood } from "../src/world/neighborhood";
import { WeatherSystem } from "../src/world/weather";

describe("empty_bottle def", () => {
  test("catálogo: botella vacía peso/stack/uso none", () => {
    const def = getItemDef("empty_bottle");
    expect(def.name).toBe("botella vacía");
    expect(def.weight).toBeCloseTo(0.2, 5);
    expect(def.stackable).toBe(true);
    expect(def.maxStack).toBe(5);
    expect(def.use).toBe("none");
    expect(def.relief).toBe(0);
  });

  test("inventorySummary label corto vacía", () => {
    const inv = createInventory(4, 20, [{ id: "empty_bottle", qty: 2 }]);
    expect(inventorySummary(inv)).toContain("vacía×2");
  });
});

describe("beber water_bottle → empty_bottle", () => {
  test("tryConsume drink deja empty_bottle y baja sed", () => {
    const inv = createInventory(8, 20, [{ id: "water_bottle", qty: 1 }]);
    const player = new PlayerSim(
      { x: 0, y: 0 },
      { hunger: 10, thirst: 70, fatigue: 0 },
      inv,
    );
    expect(player.tryConsume("drink")).toBe("drink");
    expect(player.needs.thirst).toBeCloseTo(70 - NEEDS_RELIEF.drink, 5);
    expect(findSlot(player.inventory, "water_bottle")).toBe(-1);
    expect(findSlot(player.inventory, "empty_bottle")).toBeGreaterThanOrEqual(0);
    expect(player.inventory.slots.find((s) => s.id === "empty_bottle")?.qty).toBe(
      1,
    );
  });

  test("si no cabe empty_bottle tras beber, se pierde el vacío (ok)", () => {
    // 2 slots: water×2 + scrap. Tras beber queda water×1 + scrap → sin slot para vacía.
    const packed = createInventory(2, 20, [
      { id: "water_bottle", qty: 2 },
      { id: "scrap", qty: 1 },
    ]);
    const player = new PlayerSim(
      { x: 0, y: 0 },
      { thirst: 80 },
      packed,
    );
    expect(player.tryConsume("drink")).toBe("drink");
    expect(findSlot(player.inventory, "empty_bottle")).toBe(-1);
    expect(player.inventory.slots.find((s) => s.id === "water_bottle")?.qty).toBe(
      1,
    );
  });
});

describe("rainFill", () => {
  test("canRefillFromRain requiere lluvia + outdoor + vacía", () => {
    const withBottle = createInventory(4, 20, [{ id: "empty_bottle", qty: 1 }]);
    const empty = createInventory(4, 20);
    expect(canRefillFromRain(true, true, withBottle)).toBe(true);
    expect(canRefillFromRain(false, true, withBottle)).toBe(false);
    expect(canRefillFromRain(true, false, withBottle)).toBe(false);
    expect(canRefillFromRain(true, true, empty)).toBe(false);
  });

  test("tryRefillFromRain ok: vacía → agua bajo lluvia outdoor", () => {
    const inv = createInventory(4, 20, [{ id: "empty_bottle", qty: 1 }]);
    expect(tryRefillFromRain(true, true, inv)).toBe(true);
    expect(findSlot(inv, "empty_bottle")).toBe(-1);
    expect(findSlot(inv, "water_bottle")).toBeGreaterThanOrEqual(0);
    expect(inv.slots.find((s) => s.id === "water_bottle")?.qty).toBe(1);
  });

  test("tryRefill falla indoor / no rain / sin vacía", () => {
    const inv = createInventory(4, 20, [{ id: "empty_bottle", qty: 1 }]);
    expect(tryRefillFromRain(true, false, inv)).toBe(false);
    expect(findSlot(inv, "empty_bottle")).toBeGreaterThanOrEqual(0);
    expect(tryRefillFromRain(false, true, inv)).toBe(false);
    const noBottle = createInventory(4, 20, [{ id: "scrap", qty: 1 }]);
    expect(tryRefillFromRain(true, true, noBottle)).toBe(false);
  });

  test("tryRefill rollback si no cabe water_bottle", () => {
    // empty 0.2 en maxWeight 0.25; water 0.4 no cabe → rollback
    const inv = createInventory(2, 0.25, [{ id: "empty_bottle", qty: 1 }]);
    expect(tryRefillFromRain(true, true, inv)).toBe(false);
    expect(findSlot(inv, "empty_bottle")).toBeGreaterThanOrEqual(0);
    expect(findSlot(inv, "water_bottle")).toBe(-1);
  });

  test("diagnose + mensajes fail", () => {
    const inv = createInventory(4, 20);
    expect(diagnoseRefill(false, true, inv)).toBe("no_rain");
    expect(refillFailMessage("no_rain")).toMatch(/llueve/);
    expect(diagnoseRefill(true, false, inv)).toBe("indoor");
    expect(refillFailMessage("indoor")).toMatch(/outdoor/);
    expect(diagnoseRefill(true, true, inv)).toBe("no_bottle");
    expect(refillFailMessage("no_bottle")).toMatch(/vacía/);
    expect(refillFailMessage("inv_full")).toMatch(/lleno/);
  });

  test("WeatherSystem.isRaining alinea con canRefill", () => {
    const w = new WeatherSystem({ initial: "clear" });
    const inv = createInventory(4, 20, [{ id: "empty_bottle", qty: 1 }]);
    expect(canRefillFromRain(w.isRaining, true, inv)).toBe(false);
    w.setKind("rain");
    expect(w.isRaining).toBe(true);
    expect(canRefillFromRain(w.isRaining, true, inv)).toBe(true);
    w.setKind("drizzle");
    expect(canRefillFromRain(w.isRaining, true, inv)).toBe(true);
  });
});

describe("empty_bottle save roundtrip", () => {
  test("save/load acepta empty_bottle vía isItemId", () => {
    const neighborhood = createNeighborhood(42);
    const player = new PlayerSim(
      { x: 5, y: 5 },
      undefined,
      createInventory(8, 20),
    );
    addItem(player.inventory, "empty_bottle", 2);
    const world = {
      map: neighborhood.map,
      containers: neighborhood.containers,
      player,
      clock: new GameClock(48),
    };
    const storage = createMemoryStorage();
    writeSave(storage, world);
    const loaded = readSave(storage);
    expect(loaded).not.toBeNull();
    expect(loaded!.player.inventory.slots[0]?.id).toBe("empty_bottle");
    expect(loaded!.player.inventory.slots[0]?.qty).toBe(2);

    const json = saveToString(world);
    const parsed = loadFromString(json);
    expect(
      parsed.player.inventory.slots.some((s) => s.id === "empty_bottle"),
    ).toBe(true);

    const world2 = {
      map: createNeighborhood(99).map,
      containers: createNeighborhood(99).containers,
      player: new PlayerSim({ x: 0, y: 0 }),
      clock: new GameClock(48),
    };
    applySave(world2, loaded!);
    expect(inventorySummary(world2.player.inventory)).toContain("vacía");
  });
});
