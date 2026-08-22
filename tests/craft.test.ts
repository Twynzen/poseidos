import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  BARRICADE_WOOD_COST,
  BANDAGE_CLOTH_COST,
  BANDAGE_SCRAP_COST,
  CONTAINER_REACH,
  addItem,
  applyBuildInput,
  applyCraftInput,
  attemptBuildBarricade,
  barricadeFailMessage,
  buildInputApplies,
  canPlaceBarricade,
  craftInputApplies,
  createInventory,
  diagnoseBarricade,
  getItemDef,
  hasBandageMaterials,
  hasBarricadeMaterials,
  tryBuildBarricade,
  tryCraftBandage,
  craftFullMessage,
  refillFailMessage,
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

describe("buildInputApplies / applyBuildInput (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: B no aplica; vivo / load-vivo sí", () => {
    expect(buildInputApplies(true)).toBe(false);
    expect(buildInputApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(buildInputApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(buildInputApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver + wantsBuild no muta madera ni tiles; vivo B coloca o toast de hoy", () => {
    const deadMap = new TileMap(8, 8, makeFloor);
    const deadInv = createInventory(8, 20);
    addItem(deadInv, "wood", 2);
    const beforeDeadSlots = deadInv.slots.map((s) => ({ ...s }));
    const beforeDeadTile = deadMap.getTile(4, 3)?.kind;

    expect(
      applyBuildInput(true, true, () => tryBuildBarricade(deadMap, deadInv, 4, 3)),
    ).toBeNull();
    expect(deadInv.slots).toEqual(beforeDeadSlots);
    expect(deadInv.slots.find((s) => s.id === "wood")?.qty).toBe(2);
    expect(deadMap.getTile(4, 3)?.kind).toBe(beforeDeadTile);
    expect(deadMap.getTile(4, 3)?.kind).toBe("floor");

    const deadRt = loadAliveRuntime(false);
    expect(
      applyBuildInput(deadRt.gameOver, true, () =>
        tryBuildBarricade(deadMap, deadInv, 4, 3),
      ),
    ).toBeNull();
    expect(deadInv.slots.find((s) => s.id === "wood")?.qty).toBe(2);
    expect(deadMap.getTile(4, 3)?.kind).toBe("floor");

    const liveMap = new TileMap(8, 8, makeFloor);
    const liveInv = createInventory(8, 20);
    addItem(liveInv, "wood", 2);
    const placed = applyBuildInput(false, true, () =>
      tryBuildBarricade(liveMap, liveInv, 4, 3),
    );
    expect(placed).toEqual({ x: 4, y: 3 });
    expect(liveMap.getTile(4, 3)?.kind).toBe("barricade");
    expect(liveInv.slots.find((s) => s.id === "wood")?.qty).toBe(1);
    expect(
      applyBuildInput(false, false, () =>
        tryBuildBarricade(liveMap, liveInv, 5, 3),
      ),
    ).toBeNull();
    expect(liveInv.slots.find((s) => s.id === "wood")?.qty).toBe(1);
    expect(liveMap.getTile(5, 3)?.kind).toBe("floor");

    const liveRt = loadAliveRuntime(true);
    const againMap = new TileMap(10, 10, makeFloor);
    const againPlayer = new PlayerSim({ x: 5.2, y: 5.2 });
    addItem(againPlayer.inventory, "wood", 1);
    againPlayer.facingX = 1;
    againPlayer.facingY = 0;
    const again = applyBuildInput(liveRt.gameOver, true, () =>
      againPlayer.tryPlaceBarricade(againMap),
    );
    expect(again?.ok).toBe(true);
    if (again?.ok) expect(again.result).toEqual({ x: 6, y: 5 });
    expect(againMap.getTile(6, 5)?.kind).toBe("barricade");
    expect(againPlayer.inventory.slots.find((s) => s.id === "wood")).toBeUndefined();

    const toastMap = new TileMap(6, 6, makeFloor);
    toastMap.set(2, 2, makeDoor(false));
    const toastInv = createInventory();
    addItem(toastInv, "wood", 1);
    const occupied = applyBuildInput(false, true, () =>
      attemptBuildBarricade(toastMap, toastInv, 2, 2),
    );
    expect(occupied?.ok).toBe(false);
    if (occupied && !occupied.ok) {
      expect(occupied.reason).toBe("bad_tile");
      expect(occupied.message).toBe("no se puede aquí (puerta/mueble/muro)");
    }
    expect(toastInv.slots.find((s) => s.id === "wood")?.qty).toBe(1);
    expect(toastMap.getTile(2, 2)?.kind).toBe("door");

    const noWood = applyBuildInput(false, true, () =>
      attemptBuildBarricade(new TileMap(6, 6, makeFloor), createInventory(), 1, 1),
    );
    expect(noWood?.ok).toBe(false);
    if (noWood && !noWood.ok) {
      expect(noWood.reason).toBe("no_wood");
      expect(noWood.message).toBe("falta madera");
    }

    const deadPlayer = new PlayerSim({ x: 5.2, y: 5.2 });
    addItem(deadPlayer.inventory, "wood", 1);
    deadPlayer.facingX = 1;
    deadPlayer.facingY = 0;
    const deadPlayerMap = new TileMap(10, 10, makeFloor);
    const beforePlayer = deadPlayer.inventory.slots.map((s) => ({ ...s }));
    expect(
      applyBuildInput(true, true, () => deadPlayer.tryPlaceBarricade(deadPlayerMap)),
    ).toBeNull();
    expect(deadPlayer.inventory.slots).toEqual(beforePlayer);
    expect(deadPlayerMap.getTile(6, 5)?.kind).toBe("floor");
  });

  test("Game freeze / enterGameOver / F9 load-muerto drenan B sin colocar; vivo gatea", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("buildInputApplies(");
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3000}consumeBuild\(\)/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}consumeBuild\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}if \(loaded\.gameOver\) this\.input\.consumeBuild\(\)/,
    );
    expect(gameSrc).toMatch(
      /buildInputApplies\(\s*this\.gameOver[\s\S]{0,80}wantsBuild[\s\S]{0,200}tryPlaceBarricade/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3000}tryPlaceBarricade/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}tryPlaceBarricade/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3000}consumeRestOrRestart\(\)/,
    );
  });
});

describe("tryCraftBandage", () => {
  test("receta: 1 tela + 1 chatarra → 1 vendaje", () => {
    const inv = createInventory(8, 20);
    addItem(inv, "cloth", 2);
    addItem(inv, "scrap", 2);
    expect(hasBandageMaterials(inv)).toBe(true);
    expect(tryCraftBandage(inv)).toEqual({ added: 1 });
    expect(inv.slots.find((s) => s.id === "bandage")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "cloth")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "scrap")?.qty).toBe(1);
    expect(craftFullMessage(1)).toBeNull();
  });

  test("falla sin tela o sin chatarra", () => {
    const onlyCloth = createInventory();
    addItem(onlyCloth, "cloth", 2);
    const clothBefore = onlyCloth.slots.map((s) => ({ ...s }));
    expect(tryCraftBandage(onlyCloth)).toEqual({ added: 0 });
    expect(onlyCloth.slots).toEqual(clothBefore);

    const onlyScrap = createInventory();
    addItem(onlyScrap, "scrap", 2);
    const scrapBefore = onlyScrap.slots.map((s) => ({ ...s }));
    expect(tryCraftBandage(onlyScrap)).toEqual({ added: 0 });
    expect(onlyScrap.slots).toEqual(scrapBefore);
    expect(onlyScrap.slots.find((s) => s.id === "scrap")?.qty).toBe(2);
  });

  test("dest slots llenos: mats intactas, toast inventario lleno", () => {
    const inv = createInventory(2, 20);
    addItem(inv, "cloth", 2);
    addItem(inv, "scrap", 2);
    const before = inv.slots.map((s) => ({ ...s }));
    expect(hasBandageMaterials(inv)).toBe(true);
    const { added } = tryCraftBandage(inv);
    expect(added).toBe(0);
    expect(inv.slots).toEqual(before);
    expect(inv.slots.find((s) => s.id === "cloth")?.qty).toBe(2);
    expect(inv.slots.find((s) => s.id === "scrap")?.qty).toBe(2);
    expect(inv.slots.find((s) => s.id === "bandage")).toBeUndefined();
    expect(craftFullMessage(added)).toBe("inventario lleno");
    expect(craftFullMessage(added)).toBe(refillFailMessage("inv_full"));
  });

  test("dest max stack: mats intactas, toast inventario lleno", () => {
    const inv = createInventory(3, 20);
    addItem(inv, "bandage", 5);
    addItem(inv, "cloth", 2);
    addItem(inv, "scrap", 2);
    const before = inv.slots.map((s) => ({ ...s }));
    const { added } = tryCraftBandage(inv);
    expect(added).toBe(0);
    expect(inv.slots).toEqual(before);
    expect(inv.slots.find((s) => s.id === "bandage")?.qty).toBe(5);
    expect(craftFullMessage(added)).toBe("inventario lleno");
  });

  test("slots llenos pero mats liberan hueco: entra el vendaje", () => {
    const inv = createInventory(8, 20);
    addItem(inv, "cloth", 1);
    addItem(inv, "scrap", 1);
    addItem(inv, "wood", 1);
    addItem(inv, "knife", 1);
    addItem(inv, "flashlight", 1);
    addItem(inv, "canned_food", 1);
    addItem(inv, "water_bottle", 1);
    addItem(inv, "ammo", 1);
    expect(inv.slots).toHaveLength(8);
    expect(tryCraftBandage(inv)).toEqual({ added: 1 });
    expect(inv.slots.find((s) => s.id === "bandage")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "cloth")).toBeUndefined();
    expect(inv.slots.find((s) => s.id === "scrap")).toBeUndefined();
    expect(craftFullMessage(1)).toBeNull();
  });

  test("player craft + Q cura HP", () => {
    const player = new PlayerSim({ x: 1, y: 1 }, undefined, undefined, {
      health: 40,
    });
    addItem(player.inventory, "cloth", 1);
    addItem(player.inventory, "scrap", 1);
    expect(player.tryCraftBandage()).toEqual({ added: 1 });
    expect(player.inventory.slots.some((s) => s.id === "bandage")).toBe(true);
    expect(player.tryConsume("heal")).toBe("heal");
    expect(player.health).toBe(65);
    expect(player.inventory.slots.find((s) => s.id === "bandage")).toBeUndefined();
    // Cap a MAX
    addItem(player.inventory, "bandage", 1);
    player.tryConsume("heal");
    expect(player.health).toBeLessThanOrEqual(MAX_HEALTH);
  });

  test("player dest lleno: mats se quedan", () => {
    const player = new PlayerSim({ x: 1, y: 1 }, undefined, createInventory(2, 20));
    addItem(player.inventory, "cloth", 2);
    addItem(player.inventory, "scrap", 2);
    const before = player.inventory.slots.map((s) => ({ ...s }));
    expect(player.tryCraftBandage()).toEqual({ added: 0 });
    expect(player.inventory.slots).toEqual(before);
    expect(craftFullMessage(0)).toBe("inventario lleno");
  });
});

describe("craftFullMessage", () => {
  test("added 0 → inventario lleno (mismo copy refill)", () => {
    expect(craftFullMessage(0)).toBe("inventario lleno");
    expect(craftFullMessage(0)).toBe(refillFailMessage("inv_full"));
  });

  test("added > 0 → null (éxito / leftover mats no toastea)", () => {
    expect(craftFullMessage(1)).toBeNull();
  });
});

describe("craftInputApplies / applyCraftInput (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: C no aplica; vivo / load-vivo sí", () => {
    expect(craftInputApplies(true)).toBe(false);
    expect(craftInputApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(craftInputApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(craftInputApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver + wantsCraft no muta inventario; vivo C craftea y dest-lleno rollback", () => {
    const deadInv = createInventory(8, 20);
    addItem(deadInv, "cloth", 2);
    addItem(deadInv, "scrap", 2);
    const beforeDead = deadInv.slots.map((s) => ({ ...s }));

    expect(
      applyCraftInput(true, true, () => tryCraftBandage(deadInv)),
    ).toBeNull();
    expect(deadInv.slots).toEqual(beforeDead);
    expect(deadInv.slots.find((s) => s.id === "cloth")?.qty).toBe(2);
    expect(deadInv.slots.find((s) => s.id === "scrap")?.qty).toBe(2);
    expect(deadInv.slots.find((s) => s.id === "bandage")).toBeUndefined();

    const deadRt = loadAliveRuntime(false);
    expect(
      applyCraftInput(deadRt.gameOver, true, () => tryCraftBandage(deadInv)),
    ).toBeNull();
    expect(deadInv.slots).toEqual(beforeDead);

    const liveInv = createInventory(8, 20);
    addItem(liveInv, "cloth", 2);
    addItem(liveInv, "scrap", 2);
    expect(
      applyCraftInput(false, true, () => tryCraftBandage(liveInv)),
    ).toEqual({ added: 1 });
    expect(liveInv.slots.find((s) => s.id === "bandage")?.qty).toBe(1);
    expect(liveInv.slots.find((s) => s.id === "cloth")?.qty).toBe(1);
    expect(liveInv.slots.find((s) => s.id === "scrap")?.qty).toBe(1);
    expect(
      applyCraftInput(false, false, () => tryCraftBandage(liveInv)),
    ).toBeNull();
    expect(liveInv.slots.find((s) => s.id === "cloth")?.qty).toBe(1);

    const liveRt = loadAliveRuntime(true);
    const again = createInventory(8, 20);
    addItem(again, "cloth", 1);
    addItem(again, "scrap", 1);
    expect(
      applyCraftInput(liveRt.gameOver, true, () => tryCraftBandage(again)),
    ).toEqual({ added: 1 });
    expect(again.slots.find((s) => s.id === "bandage")?.qty).toBe(1);
    expect(again.slots.find((s) => s.id === "cloth")).toBeUndefined();
    expect(again.slots.find((s) => s.id === "scrap")).toBeUndefined();

    const fullInv = createInventory(2, 20);
    addItem(fullInv, "cloth", 2);
    addItem(fullInv, "scrap", 2);
    const beforeFull = fullInv.slots.map((s) => ({ ...s }));
    expect(
      applyCraftInput(false, true, () => tryCraftBandage(fullInv)),
    ).toEqual({ added: 0 });
    expect(fullInv.slots).toEqual(beforeFull);
    expect(fullInv.slots.find((s) => s.id === "cloth")?.qty).toBe(2);
    expect(fullInv.slots.find((s) => s.id === "scrap")?.qty).toBe(2);
    expect(fullInv.slots.find((s) => s.id === "bandage")).toBeUndefined();
    expect(craftFullMessage(0)).toBe("inventario lleno");

    const deadPlayer = new PlayerSim(
      { x: 1, y: 1 },
      undefined,
      createInventory(8, 20, [
        { id: "cloth", qty: 1 },
        { id: "scrap", qty: 1 },
      ]),
    );
    const beforePlayer = deadPlayer.inventory.slots.map((s) => ({ ...s }));
    expect(
      applyCraftInput(true, true, () => deadPlayer.tryCraftBandage()),
    ).toBeNull();
    expect(deadPlayer.inventory.slots).toEqual(beforePlayer);
  });

  test("Game freeze / enterGameOver / F9 load-muerto drenan C sin craft; vivo gatea", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("craftInputApplies(");
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}consumeCraft\(\)/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,1800}consumeCraft\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,1800}if \(loaded\.gameOver\) this\.input\.consumeCraft\(\)/,
    );
    expect(gameSrc).toMatch(
      /craftInputApplies\(\s*this\.gameOver[\s\S]{0,80}wantsCraft[\s\S]{0,200}tryCraftBandage/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}tryCraftBandage/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}tryCraftBandage/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}consumeRestOrRestart\(\)/,
    );
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
    expect(pile!.x).toBe(25);
    expect(pile!.y).toBe(15);
    expect(map.getTile(25, 15)?.kind).toBe("furniture");
    expect(map.getTile(26, 15)?.kind).toBe("floor");
    expect(containers.nearest(spawn.x, spawn.y, CONTAINER_REACH)?.id).toBe(
      "madera-spawn",
    );
    expect(map.canOccupy(spawn.x, spawn.y, PLAYER_RADIUS)).toBe(true);

    const player = new PlayerSim({ x: pile!.x + 0.5, y: pile!.y + 0.5 });
    const taken = player.tryLoot(containers);
    expect(taken?.id).toBe("wood");
  });
});
