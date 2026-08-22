import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  addItem,
  applyCookInput,
  attemptCook,
  canCookHere,
  cookFailMessage,
  cookFullMessage,
  cookInputApplies,
  createInventory,
  diagnoseCook,
  getItemDef,
  hasCookIngredients,
  nearFurniture,
  refillFailMessage,
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
    const fail = attemptCook(map, inv, 8.5, 8.5);
    expect(fail.ok).toBe(false);
    if (!fail.ok) {
      expect(fail.reason).toBe("bad_place");
      expect(fail.message).toBe("no puedes cocinar aquí");
      expect(fail.message).not.toBe(refillFailMessage("inv_full"));
    }
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

  test("dest slots llenos: lata intacta, toast inventario lleno", () => {
    const map = room();
    const inv = createInventory(1, 20);
    addItem(inv, "canned_food", 2);
    const before = inv.slots.map((s) => ({ ...s }));
    expect(hasCookIngredients(inv)).toBe(true);
    expect(canCookHere(map, 6.5, 7.2)).toBe(true);
    expect(diagnoseCook(map, inv, 6.5, 7.2)).toBeNull();
    expect(tryCook(map, inv, 6.5, 7.2)).toBe(false);
    expect(inv.slots).toEqual(before);
    expect(inv.slots.find((s) => s.id === "canned_food")?.qty).toBe(2);
    expect(inv.slots.find((s) => s.id === "hot_meal")).toBeUndefined();
    const fail = attemptCook(map, inv, 6.5, 7.2);
    expect(fail.ok).toBe(false);
    if (!fail.ok) {
      expect(fail.reason).toBe("inv_full");
      expect(fail.message).toBe("inventario lleno");
      expect(fail.message).toBe(refillFailMessage("inv_full"));
      expect(fail.message).not.toBe(cookFailMessage("bad_place"));
    }
    expect(cookFullMessage(0)).toBe("inventario lleno");
    expect(cookFullMessage(0)).toBe(refillFailMessage("inv_full"));
  });

  test("dest max stack: lata intacta, toast inventario lleno", () => {
    const map = room();
    const inv = createInventory(2, 20);
    addItem(inv, "hot_meal", 5);
    addItem(inv, "canned_food", 2);
    const before = inv.slots.map((s) => ({ ...s }));
    expect(tryCook(map, inv, 6.5, 7.2)).toBe(false);
    expect(inv.slots).toEqual(before);
    expect(inv.slots.find((s) => s.id === "canned_food")?.qty).toBe(2);
    expect(inv.slots.find((s) => s.id === "hot_meal")?.qty).toBe(5);
    const fail = attemptCook(map, inv, 6.5, 7.2);
    expect(fail.ok).toBe(false);
    if (!fail.ok) {
      expect(fail.reason).toBe("inv_full");
      expect(fail.message).toBe("inventario lleno");
    }
    expect(cookFullMessage(0)).toBe("inventario lleno");
  });

  test("slots llenos pero la lata libera hueco: entra el plato", () => {
    const map = room();
    const inv = createInventory(1, 20);
    addItem(inv, "canned_food", 1);
    expect(tryCook(map, inv, 6.5, 7.2)).toBe(true);
    expect(inv.slots.find((s) => s.id === "hot_meal")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "canned_food")).toBeUndefined();
    expect(cookFullMessage(1)).toBeNull();
  });

  test("player dest lleno: lata se queda, toast inventario lleno", () => {
    const map = room();
    const player = new PlayerSim(
      { x: 6.5, y: 7.2 },
      undefined,
      createInventory(1, 20),
    );
    addItem(player.inventory, "canned_food", 2);
    const before = player.inventory.slots.map((s) => ({ ...s }));
    const fail = player.tryCook(map);
    expect(fail?.ok).toBe(false);
    if (fail && !fail.ok) {
      expect(fail.reason).toBe("inv_full");
      expect(fail.message).toBe("inventario lleno");
      expect(fail.message).toBe(refillFailMessage("inv_full"));
    }
    expect(player.inventory.slots).toEqual(before);
    expect(cookFullMessage(0)).toBe("inventario lleno");
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

describe("cookFullMessage", () => {
  test("added 0 → inventario lleno (mismo copy refill)", () => {
    expect(cookFullMessage(0)).toBe("inventario lleno");
    expect(cookFullMessage(0)).toBe(refillFailMessage("inv_full"));
    expect(cookFailMessage("inv_full")).toBe(refillFailMessage("inv_full"));
  });

  test("added > 0 → null (éxito)", () => {
    expect(cookFullMessage(1)).toBeNull();
  });

  test("bad_place sigue no puedes cocinar aquí", () => {
    expect(cookFailMessage("bad_place")).toBe("no puedes cocinar aquí");
    expect(cookFailMessage("bad_place")).not.toBe(refillFailMessage("inv_full"));
  });
});

describe("cookInputApplies / applyCookInput (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: H no aplica; vivo / load-vivo sí", () => {
    expect(cookInputApplies(true)).toBe(false);
    expect(cookInputApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(cookInputApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(cookInputApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver + wantsCook no muta inventario; vivo H cocina y dest-lleno toastea", () => {
    const map = room();
    const deadInv = createInventory(8, 20);
    addItem(deadInv, "canned_food", 2);
    const beforeDead = deadInv.slots.map((s) => ({ ...s }));

    expect(
      applyCookInput(true, true, () =>
        tryCook(map, deadInv, 6.5, 7.2) ? true : null,
      ),
    ).toBeNull();
    expect(deadInv.slots).toEqual(beforeDead);
    expect(deadInv.slots.find((s) => s.id === "canned_food")?.qty).toBe(2);
    expect(deadInv.slots.find((s) => s.id === "hot_meal")).toBeUndefined();

    const deadRt = loadAliveRuntime(false);
    expect(
      applyCookInput(deadRt.gameOver, true, () =>
        attemptCook(map, deadInv, 6.5, 7.2),
      ),
    ).toBeNull();
    expect(deadInv.slots).toEqual(beforeDead);

    const liveInv = createInventory(8, 20);
    addItem(liveInv, "canned_food", 2);
    expect(
      applyCookInput(false, true, () => attemptCook(map, liveInv, 6.5, 7.2)),
    ).toEqual({ ok: true });
    expect(liveInv.slots.find((s) => s.id === "hot_meal")?.qty).toBe(1);
    expect(liveInv.slots.find((s) => s.id === "canned_food")?.qty).toBe(1);
    expect(
      applyCookInput(false, false, () => attemptCook(map, liveInv, 6.5, 7.2)),
    ).toBeNull();
    expect(liveInv.slots.find((s) => s.id === "canned_food")?.qty).toBe(1);

    const liveRt = loadAliveRuntime(true);
    const again = createInventory(8, 20);
    addItem(again, "canned_food", 1);
    expect(
      applyCookInput(liveRt.gameOver, true, () =>
        attemptCook(map, again, 6.5, 7.2),
      ),
    ).toEqual({ ok: true });
    expect(again.slots.find((s) => s.id === "hot_meal")?.qty).toBe(1);
    expect(again.slots.find((s) => s.id === "canned_food")).toBeUndefined();

    const fullInv = createInventory(1, 20);
    addItem(fullInv, "canned_food", 2);
    const beforeFull = fullInv.slots.map((s) => ({ ...s }));
    const full = applyCookInput(false, true, () =>
      attemptCook(map, fullInv, 6.5, 7.2),
    );
    expect(full?.ok).toBe(false);
    if (full && !full.ok) {
      expect(full.reason).toBe("inv_full");
      expect(full.message).toBe("inventario lleno");
      expect(full.message).toBe(refillFailMessage("inv_full"));
    }
    expect(fullInv.slots).toEqual(beforeFull);
    expect(fullInv.slots.find((s) => s.id === "canned_food")?.qty).toBe(2);
    expect(fullInv.slots.find((s) => s.id === "hot_meal")).toBeUndefined();
    expect(cookFullMessage(0)).toBe("inventario lleno");

    const deadPlayer = new PlayerSim(
      { x: 6.5, y: 7.2 },
      undefined,
      createInventory(8, 20, [{ id: "canned_food", qty: 1 }]),
    );
    const beforePlayer = deadPlayer.inventory.slots.map((s) => ({ ...s }));
    expect(
      applyCookInput(true, true, () => deadPlayer.tryCook(map)),
    ).toBeNull();
    expect(deadPlayer.inventory.slots).toEqual(beforePlayer);
  });

  test("Game freeze / enterGameOver / F9 load-muerto drenan H sin cook; vivo gatea", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("cookInputApplies(");
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}consumeCook\(\)/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,1800}consumeCook\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,1800}if \(loaded\.gameOver\) this\.input\.consumeCook\(\)/,
    );
    expect(gameSrc).toMatch(
      /cookInputApplies\(\s*this\.gameOver[\s\S]{0,80}wantsCook[\s\S]{0,200}tryCook/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}tryCook/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}attemptCook/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}tryCook/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}attemptCook/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}consumeRestOrRestart\(\)/,
    );
  });
});

