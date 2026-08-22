import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { PlayerSim } from "../src/actors/player";
import { NEEDS_RELIEF } from "../src/actors/needs";
import {
  addItem,
  applyUseInput,
  attemptRefill,
  canRefillFromRain,
  createInventory,
  diagnoseRefill,
  findSlot,
  getItemDef,
  inventorySummary,
  refillFailMessage,
  refillFullMessage,
  tryRefillFromRain,
  useInputApplies,
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
    expect(player.inventory.slots[0]?.id).toBe("empty_bottle");
    expect(findSlot(player.inventory, "empty_bottle")).toBe(0);
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
    expect(inv.slots[0]?.id).toBe("water_bottle");
    expect(inv.slots[0]?.qty).toBe(1);
  });

  test("leftover con hueco: vacía×2 → agua + vacía", () => {
    const inv = createInventory(4, 20, [{ id: "empty_bottle", qty: 2 }]);
    expect(diagnoseRefill(true, true, inv)).toBeNull();
    const ok = attemptRefill(true, true, inv);
    expect(ok.ok).toBe(true);
    expect(inv.slots.find((s) => s.id === "empty_bottle")?.qty).toBe(1);
    expect(inv.slots.find((s) => s.id === "water_bottle")?.qty).toBe(1);
    expect(refillFullMessage(1)).toBeNull();
  });

  test("tryRefill in-place: vacía→agua mismo índice; lata no se corre", () => {
    const inv = createInventory(8, 20, [
      { id: "empty_bottle", qty: 1 },
      { id: "canned_food", qty: 1 },
      { id: "flashlight", qty: 1 },
    ]);
    expect(tryRefillFromRain(true, true, inv)).toBe(true);
    expect(inv.slots[0]?.id).toBe("water_bottle");
    expect(inv.slots[1]?.id).toBe("canned_food");
    expect(inv.slots[2]?.id).toBe("flashlight");
    expect(findSlot(inv, "empty_bottle")).toBe(-1);
  });

  test("starter Q then Q: beber + refill deja agua slot 0 y lata slot 1", () => {
    const player = new PlayerSim({ x: 1, y: 1 });
    expect(player.tryConsumeAt(0)).toBe("drink");
    expect(player.inventory.slots[0]?.id).toBe("empty_bottle");
    expect(player.inventory.slots[1]?.id).toBe("canned_food");
    expect(tryRefillFromRain(true, true, player.inventory)).toBe(true);
    expect(player.inventory.slots[0]?.id).toBe("water_bottle");
    expect(player.inventory.slots[1]?.id).toBe("canned_food");
    expect(player.inventory.slots.map((s) => s.id)).toEqual([
      "water_bottle",
      "canned_food",
      "flashlight",
      "pistol",
      "ammo",
    ]);
  });

  test("tryRefill falla indoor / no rain / sin vacía", () => {
    const inv = createInventory(4, 20, [{ id: "empty_bottle", qty: 1 }]);
    expect(tryRefillFromRain(true, false, inv)).toBe(false);
    expect(findSlot(inv, "empty_bottle")).toBeGreaterThanOrEqual(0);
    expect(tryRefillFromRain(false, true, inv)).toBe(false);
    const noBottle = createInventory(4, 20, [{ id: "scrap", qty: 1 }]);
    expect(tryRefillFromRain(true, true, noBottle)).toBe(false);
  });

  test("tryRefill leftover rollback si no cabe water_bottle", () => {
    // qty>1 usa addItem; 1 slot → water no cabe → rollback
    const inv = createInventory(1, 20, [{ id: "empty_bottle", qty: 2 }]);
    expect(tryRefillFromRain(true, true, inv)).toBe(false);
    expect(inv.slots[0]?.id).toBe("empty_bottle");
    expect(inv.slots[0]?.qty).toBe(2);
    expect(findSlot(inv, "water_bottle")).toBe(-1);
  });

  test("dest slots llenos: botella intacta, toast inventario lleno", () => {
    const inv = createInventory(1, 20, [{ id: "empty_bottle", qty: 2 }]);
    const before = inv.slots.map((s) => ({ ...s }));
    expect(canRefillFromRain(true, true, inv)).toBe(true);
    expect(diagnoseRefill(true, true, inv)).toBe("inv_full");
    expect(tryRefillFromRain(true, true, inv)).toBe(false);
    expect(inv.slots).toEqual(before);
    expect(inv.slots[0]?.id).toBe("empty_bottle");
    expect(inv.slots[0]?.qty).toBe(2);
    expect(findSlot(inv, "water_bottle")).toBe(-1);
    const fail = attemptRefill(true, true, inv);
    expect(fail.ok).toBe(false);
    if (!fail.ok) {
      expect(fail.reason).toBe("inv_full");
      expect(fail.message).toBe("inventario lleno");
      expect(fail.message).toBe(refillFailMessage("inv_full"));
      expect(fail.message).not.toBe(refillFailMessage("no_rain"));
      expect(fail.message).not.toBe(refillFailMessage("indoor"));
      expect(fail.message).not.toBe(refillFailMessage("no_bottle"));
    }
    expect(inv.slots).toEqual(before);
    expect(refillFullMessage(0)).toBe("inventario lleno");
    expect(refillFullMessage(0)).toBe(refillFailMessage("inv_full"));
  });

  test("dest max stack: botella intacta, toast inventario lleno", () => {
    const inv = createInventory(2, 20);
    addItem(inv, "water_bottle", 5);
    addItem(inv, "empty_bottle", 2);
    const before = inv.slots.map((s) => ({ ...s }));
    expect(diagnoseRefill(true, true, inv)).toBe("inv_full");
    expect(tryRefillFromRain(true, true, inv)).toBe(false);
    expect(inv.slots).toEqual(before);
    expect(inv.slots.find((s) => s.id === "empty_bottle")?.qty).toBe(2);
    expect(inv.slots.find((s) => s.id === "water_bottle")?.qty).toBe(5);
    const fail = attemptRefill(true, true, inv);
    expect(fail.ok).toBe(false);
    if (!fail.ok) {
      expect(fail.reason).toBe("inv_full");
      expect(fail.message).toBe("inventario lleno");
    }
    expect(refillFullMessage(0)).toBe("inventario lleno");
  });

  test("dest peso lleno: botella intacta, toast inventario lleno", () => {
    // leftover: −0.2 vacía +0.4 agua → 0.6 > maxWeight 0.5
    const inv = createInventory(4, 0.5, [{ id: "empty_bottle", qty: 2 }]);
    const before = inv.slots.map((s) => ({ ...s }));
    expect(diagnoseRefill(true, true, inv)).toBe("inv_full");
    const fail = attemptRefill(true, true, inv);
    expect(fail.ok).toBe(false);
    if (!fail.ok) {
      expect(fail.reason).toBe("inv_full");
      expect(fail.message).toBe(refillFailMessage("inv_full"));
    }
    expect(inv.slots).toEqual(before);
    expect(inv.slots[0]?.qty).toBe(2);
  });

  test("última vacía (qty 1) libera hueco: entra el agua", () => {
    const inv = createInventory(1, 20, [{ id: "empty_bottle", qty: 1 }]);
    expect(diagnoseRefill(true, true, inv)).toBeNull();
    const ok = attemptRefill(true, true, inv);
    expect(ok.ok).toBe(true);
    expect(inv.slots[0]?.id).toBe("water_bottle");
    expect(inv.slots[0]?.qty).toBe(1);
    expect(refillFullMessage(1)).toBeNull();
  });

  test("diagnose + mensajes fail", () => {
    const inv = createInventory(4, 20);
    expect(diagnoseRefill(false, true, inv)).toBe("no_rain");
    expect(refillFailMessage("no_rain")).toBe("no llueve");
    expect(diagnoseRefill(true, false, inv)).toBe("indoor");
    expect(refillFailMessage("indoor")).toBe("necesitas estar outdoor");
    expect(diagnoseRefill(true, true, inv)).toBe("no_bottle");
    expect(refillFailMessage("no_bottle")).toBe("falta botella vacía");
    expect(refillFailMessage("inv_full")).toBe("inventario lleno");
    const noRain = attemptRefill(false, true, inv);
    expect(noRain.ok).toBe(false);
    if (!noRain.ok) {
      expect(noRain.reason).toBe("no_rain");
      expect(noRain.message).toBe("no llueve");
      expect(noRain.message).not.toBe(refillFailMessage("inv_full"));
    }
    const indoor = attemptRefill(true, false, createInventory(4, 20, [
      { id: "empty_bottle", qty: 1 },
    ]));
    expect(indoor.ok).toBe(false);
    if (!indoor.ok) {
      expect(indoor.reason).toBe("indoor");
      expect(indoor.message).toBe("necesitas estar outdoor");
      expect(indoor.message).not.toBe(refillFailMessage("inv_full"));
    }
    const noBottle = attemptRefill(true, true, inv);
    expect(noBottle.ok).toBe(false);
    if (!noBottle.ok) {
      expect(noBottle.reason).toBe("no_bottle");
      expect(noBottle.message).toBe("falta botella vacía");
      expect(noBottle.message).not.toBe(refillFailMessage("inv_full"));
    }
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

describe("refillFullMessage", () => {
  test("added 0 → inventario lleno (mismo copy dest-full)", () => {
    expect(refillFullMessage(0)).toBe("inventario lleno");
    expect(refillFullMessage(0)).toBe(refillFailMessage("inv_full"));
    expect(refillFailMessage("inv_full")).toBe("inventario lleno");
  });

  test("added > 0 → null (éxito)", () => {
    expect(refillFullMessage(1)).toBeNull();
  });

  test("otros fails siguen su copy", () => {
    expect(refillFailMessage("no_rain")).toBe("no llueve");
    expect(refillFailMessage("indoor")).toBe("necesitas estar outdoor");
    expect(refillFailMessage("no_bottle")).toBe("falta botella vacía");
    expect(refillFailMessage("no_rain")).not.toBe(refillFailMessage("inv_full"));
    expect(refillFailMessage("indoor")).not.toBe(refillFailMessage("inv_full"));
    expect(refillFailMessage("no_bottle")).not.toBe(refillFailMessage("inv_full"));
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

describe("useInputApplies / applyUseInput (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: Q no aplica; vivo / load-vivo sí", () => {
    expect(useInputApplies(true)).toBe(false);
    expect(useInputApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(useInputApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(useInputApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver + wantsUse no muta inventario ni needs; vivo Q usa o refill", () => {
    const deadInv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "water_bottle", qty: 1 },
    ]);
    const deadPlayer = new PlayerSim(
      { x: 0, y: 0 },
      { hunger: 40, thirst: 55, fatigue: 10 },
      deadInv,
    );
    const beforeInv = deadPlayer.inventory.slots.map((s) => ({ ...s }));
    const beforeNeeds = { ...deadPlayer.needs };
    const blockedRefill = createInventory(8, 20, [{ id: "empty_bottle", qty: 1 }]);

    expect(
      applyUseInput(true, true, () => deadPlayer.tryConsumeAt(0)),
    ).toBeNull();
    expect(
      applyUseInput(true, true, () =>
        tryRefillFromRain(true, true, blockedRefill) ? "refill" : null,
      ),
    ).toBeNull();
    expect(deadPlayer.inventory.slots).toEqual(beforeInv);
    expect(deadPlayer.needs).toEqual(beforeNeeds);
    expect(blockedRefill.slots[0]?.id).toBe("empty_bottle");

    const deadRt = loadAliveRuntime(false);
    expect(
      applyUseInput(deadRt.gameOver, true, () => deadPlayer.tryConsumeAt(1)),
    ).toBeNull();
    expect(deadPlayer.inventory.slots).toEqual(beforeInv);
    expect(deadPlayer.needs).toEqual(beforeNeeds);

    const liveFood = new PlayerSim(
      { x: 0, y: 0 },
      { hunger: 40, thirst: 55, fatigue: 10 },
      createInventory(8, 20, [{ id: "canned_food", qty: 1 }]),
    );
    expect(
      applyUseInput(false, true, () => liveFood.tryConsumeAt(0)),
    ).toBe("food");
    expect(findSlot(liveFood.inventory, "canned_food")).toBe(-1);
    expect(liveFood.needs.hunger).toBeCloseTo(40 - NEEDS_RELIEF.eat, 5);
    expect(
      applyUseInput(false, false, () => liveFood.tryConsume("food")),
    ).toBeNull();

    const liveDrink = new PlayerSim(
      { x: 0, y: 0 },
      { hunger: 40, thirst: 70, fatigue: 10 },
      createInventory(8, 20, [{ id: "water_bottle", qty: 1 }]),
    );
    const liveRt = loadAliveRuntime(true);
    expect(
      applyUseInput(liveRt.gameOver, true, () => liveDrink.tryConsumeAt(0)),
    ).toBe("drink");
    expect(liveDrink.inventory.slots[0]?.id).toBe("empty_bottle");
    expect(liveDrink.needs.thirst).toBeCloseTo(70 - NEEDS_RELIEF.drink, 5);

    const refillInv = createInventory(8, 20, [{ id: "empty_bottle", qty: 1 }]);
    expect(
      applyUseInput(false, true, () =>
        tryRefillFromRain(true, true, refillInv) ? "refill" : null,
      ),
    ).toBe("refill");
    expect(refillInv.slots[0]?.id).toBe("water_bottle");
    expect(
      applyUseInput(true, true, () =>
        tryRefillFromRain(true, true, refillInv) ? "refill" : null,
      ),
    ).toBeNull();
    expect(refillInv.slots[0]?.id).toBe("water_bottle");
  });

  test("Game freeze / enterGameOver / F9 load-muerto drenan Q sin use/refill; vivo gatea", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("useInputApplies(");
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}consumeUse\(\)/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2200}consumeUse\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,1600}if \(loaded\.gameOver\) this\.input\.consumeUse\(\)/,
    );
    expect(gameSrc).toMatch(
      /useInputApplies\(\s*this\.gameOver[\s\S]{0,80}wantsUse[\s\S]{0,400}attemptRefill[\s\S]{0,700}useHotbarSlot/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}attemptRefill/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}useHotbarSlot/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}attemptRefill/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}useHotbarSlot/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}consumeRestOrRestart\(\)/,
    );
  });
});
