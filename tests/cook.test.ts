import { describe, expect, test } from "vitest";
import {
  addItem,
  attemptCook,
  canCookHere,
  cookFailMessage,
  createInventory,
  diagnoseCook,
  getItemDef,
  hasCookIngredients,
  nearFurniture,
  tryCook,
} from "../src/items";
import { TileMap } from "../src/world/tilemap";
import { makeFloor, makeFurniture, makeWall } from "../src/world/tile";
import { PlayerSim } from "../src/actors/player";

function openYard(): TileMap {
  return new TileMap(16, 16, makeFloor);
}

function room(): TileMap {
  const map = new TileMap(16, 16, makeFloor);
  for (let y = 4; y <= 8; y++) {
    for (let x = 4; x <= 8; x++) {
      const edge = x === 4 || x === 8 || y === 4 || y === 8;
      map.set(x, y, edge ? makeWall() : makeFloor());
    }
  }
  map.set(6, 6, makeFurniture());
  return map;
}

describe("hot_meal item", () => {
  test("catálogo: más relief que canned + fatigueRelief", () => {
    const canned = getItemDef("canned_food");
    const meal = getItemDef("hot_meal");
    expect(meal.use).toBe("food");
    expect(meal.name).toBe("plato caliente");
    expect(meal.relief).toBeGreaterThan(canned.relief);
    expect(meal.fatigueRelief ?? 0).toBeGreaterThan(0);
  });
});

describe("canCookHere / nearFurniture", () => {
  test("outdoor abierto no; indoor o junto a furniture sí", () => {
    const open = openYard();
    expect(canCookHere(open, 8.5, 8.5)).toBe(false);
    expect(nearFurniture(open, 8.5, 8.5)).toBe(false);

    open.set(5, 5, makeFurniture());
    expect(nearFurniture(open, 5.5, 6.2)).toBe(true);
    expect(canCookHere(open, 5.5, 6.2)).toBe(true);

    const indoor = room();
    expect(canCookHere(indoor, 6.5, 7.2)).toBe(true);
  });
});

describe("tryCook", () => {
  test("OK indoor: canned → hot_meal", () => {
    const map = room();
    const inv = createInventory(8, 20);
    addItem(inv, "canned_food", 2);
    expect(hasCookIngredients(inv)).toBe(true);
    expect(tryCook(map, inv, 6.5, 7.2)).toBe(true);
    expect(inv.slots.find((s) => s.id === "canned_food")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "hot_meal")?.qty).toBe(1);
  });

  test("fail outdoor sin furniture", () => {
    const map = openYard();
    const inv = createInventory();
    addItem(inv, "canned_food", 1);
    expect(diagnoseCook(map, inv, 8.5, 8.5)).toBe("bad_place");
    expect(cookFailMessage("bad_place")).toBe("no puedes cocinar aquí");
    expect(tryCook(map, inv, 8.5, 8.5)).toBe(false);
    expect(inv.slots.find((s) => s.id === "canned_food")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "hot_meal")).toBeUndefined();
  });

  test("fail sin item", () => {
    const map = room();
    const empty = createInventory();
    expect(diagnoseCook(map, empty, 6.5, 7.2)).toBe("no_food");
    expect(cookFailMessage("no_food")).toBe("falta comida");
    const fail = attemptCook(map, empty, 6.5, 7.2);
    expect(fail.ok).toBe(false);
    if (!fail.ok) expect(fail.message).toBe("falta comida");
  });

  test("player tryCook + Q hot_meal alivia hunger y fatigue", () => {
    const map = room();
    const player = new PlayerSim(
      { x: 6.5, y: 7.2 },
      { hunger: 80, thirst: 10, fatigue: 50 },
      createInventory(8, 20),
    );
    addItem(player.inventory, "canned_food", 1);
    const r = player.tryCook(map);
    expect(r?.ok).toBe(true);
    expect(player.inventory.slots.some((s) => s.id === "hot_meal")).toBe(true);
    expect(player.inventory.slots.some((s) => s.id === "canned_food")).toBe(
      false,
    );

    const meal = getItemDef("hot_meal");
    expect(player.tryConsume("food")).toBe("food");
    expect(player.needs.hunger).toBeCloseTo(80 - meal.relief, 5);
    expect(player.needs.fatigue).toBeCloseTo(
      50 - (meal.fatigueRelief ?? 0),
      5,
    );
  });
});

