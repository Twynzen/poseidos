import { describe, expect, test } from "vitest";
import {
  BARRICADE_WOOD_COST,
  BANDAGE_CLOTH_COST,
  BANDAGE_SCRAP_COST,
  addItem,
  attemptBuildBarricade,
  barricadeFailMessage,
  canPlaceBarricade,
  createInventory,
  diagnoseBarricade,
  getItemDef,
  hasBandageMaterials,
  hasBarricadeMaterials,
  tryBuildBarricade,
  tryCraftBandage,
} from "../src/items";
import {
  blocksSight,
  isWalkable,
  makeBarricade,
  makeDoor,
  makeFloor,
  makeFurniture,
  makeWall,
} from "../src/world/tile";
import { TileMap } from "../src/world/tilemap";
import { createNeighborhood } from "../src/world/neighborhood";
import { PlayerSim, PLAYER_RADIUS } from "../src/actors/player";
import { hasLineOfSight } from "../src/world/los";
import { MAX_HEALTH } from "../src/actors/body";

describe("item wood", () => {
  test("madera en catálogo (craft)", () => {
    const w = getItemDef("wood");
    expect(w.name).toBe("madera");
    expect(w.use).toBe("none");
    expect(w.stackable).toBe(true);
    expect(BARRICADE_WOOD_COST).toBe(1);
  });
});

describe("item cloth/bandage", () => {
  test("tela y vendaje en catálogo", () => {
    expect(getItemDef("cloth").name).toBe("tela");
    expect(getItemDef("cloth").use).toBe("none");
    const b = getItemDef("bandage");
    expect(b.name).toBe("vendaje");
    expect(b.use).toBe("heal");
    expect(b.relief).toBe(25);
    expect(BANDAGE_CLOTH_COST).toBe(1);
    expect(BANDAGE_SCRAP_COST).toBe(1);
  });
});

describe("barricade tile", () => {
  test("bloquea movimiento y visión como muro", () => {
    const b = makeBarricade();
    expect(b.kind).toBe("barricade");
    expect(isWalkable(b)).toBe(false);
    expect(blocksSight(b)).toBe(true);
    expect(isWalkable(makeWall())).toBe(false);
    expect(blocksSight(makeFloor())).toBe(false);
  });

  test("canOccupy rechaza barricada; LOS cortado", () => {
    const map = new TileMap(7, 7, makeFloor);
    map.set(3, 3, makeBarricade());
    expect(map.canOccupy(3.5, 3.5, PLAYER_RADIUS)).toBe(false);
    expect(hasLineOfSight(map, 1, 3, 5, 3)).toBe(false);
    expect(hasLineOfSight(map, 1, 1, 1, 5)).toBe(true);
  });
});

describe("tryBuildBarricade", () => {
  test("receta: 1 madera → barricada en floor adyacente", () => {
    const map = new TileMap(8, 8, makeFloor);
    const inv = createInventory(8, 20);
    addItem(inv, "wood", 2);
    expect(hasBarricadeMaterials(inv)).toBe(true);
    expect(canPlaceBarricade(map, 4, 3)).toBe(true);

    const r = tryBuildBarricade(map, inv, 4, 3);
    expect(r).toEqual({ x: 4, y: 3 });
    expect(map.getTile(4, 3)?.kind).toBe("barricade");
    expect(inv.slots.find((s) => s.id === "wood")?.qty).toBe(1);
  });

  test("falla sin madera o en tile no-floor", () => {
    const map = new TileMap(6, 6, makeFloor);
    map.set(2, 2, makeWall());
    map.set(2, 3, makeDoor(false));
    map.set(2, 4, makeFurniture());
    const empty = createInventory();
    expect(tryBuildBarricade(map, empty, 1, 1)).toBeNull();

    const inv = createInventory();
    addItem(inv, "wood", 3);
    expect(tryBuildBarricade(map, inv, 2, 2)).toBeNull();
    expect(tryBuildBarricade(map, inv, 2, 3)).toBeNull();
    expect(tryBuildBarricade(map, inv, 2, 4)).toBeNull();
    expect(inv.slots.find((s) => s.id === "wood")?.qty).toBe(3);
  });

  test("mensajes HUD: falta madera vs tile ocupado", () => {
    const map = new TileMap(6, 6, makeFloor);
    map.set(2, 2, makeDoor(false));
    const empty = createInventory();
    expect(diagnoseBarricade(map, empty, 1, 1)).toBe("no_wood");
    expect(barricadeFailMessage("no_wood")).toBe("falta madera");

    const inv = createInventory();
    addItem(inv, "wood", 1);
    expect(diagnoseBarricade(map, inv, 2, 2)).toBe("bad_tile");
    expect(barricadeFailMessage("bad_tile")).toContain("puerta");

    const fail = attemptBuildBarricade(map, empty, 1, 1);
    expect(fail.ok).toBe(false);
    if (!fail.ok) expect(fail.message).toBe("falta madera");

    const ok = attemptBuildBarricade(map, inv, 1, 1);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.result).toEqual({ x: 1, y: 1 });
  });

  test("player tryPlaceBarricade usa facing + mensaje ok", () => {
    const map = new TileMap(10, 10, makeFloor);
    const player = new PlayerSim({ x: 5.2, y: 5.2 });
    addItem(player.inventory, "wood", 1);
    player.facingX = 1;
    player.facingY = 0;
    const r = player.tryPlaceBarricade(map);
    expect(r?.ok).toBe(true);
    if (r?.ok) expect(r.result).toEqual({ x: 6, y: 5 });
    expect(map.getTile(6, 5)?.kind).toBe("barricade");
    // Sin madera → mensaje claro
    const fail = player.tryPlaceBarricade(map);
    expect(fail?.ok).toBe(false);
    if (fail && !fail.ok) expect(fail.message).toBe("falta madera");
    // No atraviesa
    for (let i = 0; i < 30; i++) {
      player.move(0.05, { x: 1, z: 0 }, map);
    }
    expect(player.x).toBeLessThan(6 - PLAYER_RADIUS + 0.08);
  });
});

describe("tryCraftBandage", () => {
  test("receta: 1 tela + 1 chatarra → 1 vendaje", () => {
    const inv = createInventory(8, 20);
    addItem(inv, "cloth", 2);
    addItem(inv, "scrap", 2);
    expect(hasBandageMaterials(inv)).toBe(true);
    expect(tryCraftBandage(inv)).toBe(true);
    expect(inv.slots.find((s) => s.id === "bandage")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "cloth")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "scrap")?.qty).toBe(1);
  });

  test("falla sin tela o sin chatarra", () => {
    const onlyCloth = createInventory();
    addItem(onlyCloth, "cloth", 2);
    expect(tryCraftBandage(onlyCloth)).toBe(false);
    expect(onlyCloth.slots.find((s) => s.id === "cloth")?.qty).toBe(2);

    const onlyScrap = createInventory();
    addItem(onlyScrap, "scrap", 2);
    expect(tryCraftBandage(onlyScrap)).toBe(false);
  });

  test("player craft + Q cura HP", () => {
    const player = new PlayerSim({ x: 1, y: 1 }, undefined, undefined, {
      health: 40,
    });
    addItem(player.inventory, "cloth", 1);
    addItem(player.inventory, "scrap", 1);
    expect(player.tryCraftBandage()).toBe(true);
    expect(player.inventory.slots.some((s) => s.id === "bandage")).toBe(true);
    expect(player.tryConsume("heal")).toBe("heal");
    expect(player.health).toBe(65);
    expect(player.inventory.slots.find((s) => s.id === "bandage")).toBeUndefined();
    // Cap a MAX
    addItem(player.inventory, "bandage", 1);
    player.tryConsume("heal");
    expect(player.health).toBeLessThanOrEqual(MAX_HEALTH);
  });
});

describe("neighborhood madera", () => {
  test("pila de madera cerca del spawn + loot con wood", () => {
    const { containers, spawn, map } = createNeighborhood(48);
    const pile = containers.list.find((c) => c.id === "madera-spawn");
    expect(pile).toBeDefined();
    expect(pile!.inv.slots.some((s) => s.id === "wood" && s.qty >= 1)).toBe(
      true,
    );
    expect(pile!.inv.slots.some((s) => s.id === "cloth")).toBe(true);
    expect(pile!.inv.slots.some((s) => s.id === "scrap")).toBe(true);
    expect(map.getTile(pile!.x, pile!.y)?.kind).toBe("furniture");
    expect(map.canOccupy(spawn.x, spawn.y, PLAYER_RADIUS)).toBe(true);

    const player = new PlayerSim({ x: pile!.x + 0.5, y: pile!.y + 0.5 });
    const taken = player.tryLoot(containers);
    expect(taken?.id).toBe("wood");
  });
});
