import { describe, expect, test } from "vitest";
import { GameClock } from "../src/core/clock";
import {
  SAVE_SLOT_KEY,
  SAVE_VERSION,
  applySave,
  captureSave,
  clearSave,
  createMemoryStorage,
  loadFromString,
  persistSave,
  readSave,
  saveToString,
  writeSave,
} from "../src/core/save";
import { createNeighborhood } from "../src/world/neighborhood";
import { PlayerSim } from "../src/actors/player";
import { addItem, inventorySummary, totalQty, tryBuildBarricade } from "../src/items";
import {
  DialogueBehaviorGates,
  SpeechDirector,
  ShortMemory,
  TrustLedger,
  proposeDialogueGates,
  GATE_CALM_PACIFY_TTL,
  GATE_THREAT_SPEED_TTL,
  GATE_THREAT_SPEED_MUL,
} from "../src/possession";

function makeWorld() {
  const neighborhood = createNeighborhood(48);
  const player = new PlayerSim(neighborhood.spawn);
  const clock = new GameClock(48);
  return {
    clock,
    player,
    map: neighborhood.map,
    containers: neighborhood.containers,
  };
}

describe("save/load", () => {
  test("captureSave incluye versión, clock, player, doors, barricades, containers", () => {
    const world = makeWorld();
    const save = captureSave(world);
    expect(save.v).toBe(SAVE_VERSION);
    expect(save.clock.elapsed).toBe(0);
    expect(save.player.x).toBeCloseTo(24.5);
    expect(save.player.y).toBeCloseTo(15.5);
    expect(save.doors.length).toBeGreaterThan(0);
    expect(save.doors.every((d) => d.open === false)).toBe(true);
    expect(save.barricades).toEqual([]);
    expect(save.containers.length).toBe(world.containers.list.length);
    expect(save.containers.some((c) => c.id === "cocina-spawn")).toBe(true);
    expect(save.containers.some((c) => c.id === "madera-spawn")).toBe(true);
    expect(save.possession).toEqual({
      trust: {},
      gates: {},
      moodBias: {},
      memory: {},
      lastApplied: {},
    });
  });

  test("roundtrip JSON string restaura estado mutado", () => {
    const world = makeWorld();
    world.clock.advance(12.5);

    const kitchen = world.containers.list.find((c) => c.id === "cocina-spawn")!;
    const kitchenQtyBefore = totalQty(kitchen.inv);
    expect(kitchenQtyBefore).toBeGreaterThan(0);

    // Posición junto al mueble (centro tile + 0.5)
    world.player.x = kitchen.x + 0.5;
    world.player.y = kitchen.y + 0.5;
    world.player.needs.hunger = 40;
    world.player.needs.thirst = 55;
    world.player.needs.fatigue = 10;
    addItem(world.player.inventory, "canned_food", 2);
    addItem(world.player.inventory, "scrap", 1);
    addItem(world.player.inventory, "wood", 2);

    // Abrir puerta sur de la casa spawn
    const door = world.map.nearestDoor(world.player.x, world.player.y, 8);
    expect(door).not.toBeNull();
    world.map.toggleDoor(door!.x, door!.y);
    expect(world.map.getTile(door!.x, door!.y)?.open).toBe(true);

    const taken = world.player.tryLoot(world.containers);
    expect(taken).not.toBeNull();
    const kitchenQtyAfterLoot = totalQty(kitchen.inv);
    expect(kitchenQtyAfterLoot).toBe(kitchenQtyBefore - 1);

    // Barricada en tile libre cerca del player
    const bx = Math.floor(world.player.x) + 1;
    const by = Math.floor(world.player.y);
    const built = tryBuildBarricade(world.map, world.player.inventory, bx, by);
    expect(built).not.toBeNull();
    expect(world.map.getTile(bx, by)?.kind).toBe("barricade");

    const json = saveToString(world);
    expect(typeof json).toBe("string");
    expect(json.length).toBeGreaterThan(50);

    const world2 = makeWorld();
    expect(world2.player.inventory.slots.length).toBeGreaterThan(0); // kit inicial
    expect(world2.clock.elapsed).toBe(0);
    expect(world2.map.getTile(bx, by)?.kind).toBe("floor");
    applySave(world2, loadFromString(json));

    expect(world2.clock.elapsed).toBeCloseTo(12.5);
    expect(world2.player.x).toBeCloseTo(kitchen.x + 0.5);
    expect(world2.player.y).toBeCloseTo(kitchen.y + 0.5);
    expect(world2.player.needs.hunger).toBeCloseTo(40);
    expect(world2.player.needs.thirst).toBeCloseTo(55);
    expect(world2.player.needs.fatigue).toBeCloseTo(10);
    expect(inventorySummary(world2.player.inventory)).toContain("lata");
    expect(world2.map.getTile(door!.x, door!.y)?.open).toBe(true);
    expect(world2.map.getTile(bx, by)?.kind).toBe("barricade");
    const kitchen2 = world2.containers.list.find((c) => c.id === "cocina-spawn")!;
    expect(totalQty(kitchen2.inv)).toBe(kitchenQtyAfterLoot);
  });

  test("memory storage write/read roundtrip (headless localStorage)", () => {
    const world = makeWorld();
    world.player.x = 10.5;
    world.player.y = 11.5;
    world.clock.advance(3);
    addItem(world.player.inventory, "water_bottle", 1);

    const storage = createMemoryStorage();
    writeSave(storage, world);
    expect(storage.data.has(SAVE_SLOT_KEY)).toBe(true);

    const loaded = readSave(storage);
    expect(loaded).not.toBeNull();
    expect(loaded!.player.x).toBeCloseTo(10.5);
    expect(loaded!.player.inventory.slots[0]?.id).toBe("water_bottle");
    expect(loaded!.barricades).toEqual([]);

    const world2 = makeWorld();
    applySave(world2, loaded!);
    expect(world2.player.x).toBeCloseTo(10.5);
    expect(world2.player.invSummary()).toContain("agua");
    expect(world2.clock.elapsed).toBeCloseTo(3);

    clearSave(storage);
    expect(readSave(storage)).toBeNull();
  });

  test("loadFromString rechaza JSON / versión inválida", () => {
    expect(() => loadFromString("{")).toThrow(/JSON/);
    expect(() => loadFromString("{}")).toThrow(/versión/);
    expect(() =>
      loadFromString(JSON.stringify({ v: 999, clock: { elapsed: 0 } })),
    ).toThrow(/versión/);
  });

  test("persistSave + readSave no mutan al re-serializar", () => {
    const world = makeWorld();
    world.player.needs.hunger = 12;
    const save = captureSave(world);
    const storage = createMemoryStorage();
    persistSave(storage, save);
    const again = readSave(storage)!;
    expect(again.player.needs.hunger).toBeCloseTo(12);
    expect(again.doors.length).toBe(save.doors.length);
    expect(again.barricades.length).toBe(save.barricades.length);
    expect(again.containers.length).toBe(save.containers.length);
  });

  test("applySave limpia barricadas ausentes del save", () => {
    const world = makeWorld();
    addItem(world.player.inventory, "wood", 2);
    tryBuildBarricade(world.map, world.player.inventory, 24, 14);
    tryBuildBarricade(world.map, world.player.inventory, 25, 14);
    expect(world.map.countKind("barricade")).toBe(2);

    const save = captureSave(world);
    expect(save.barricades).toHaveLength(2);

    // Solo conservar una
    save.barricades = [{ x: 24, y: 14 }];
    applySave(world, save);
    expect(world.map.getTile(24, 14)?.kind).toBe("barricade");
    expect(world.map.getTile(25, 14)?.kind).toBe("floor");
    expect(world.map.countKind("barricade")).toBe(1);
  });

  test("save antiguo sin possession sigue cargando (vacío)", () => {
    const world = makeWorld();
    const save = captureSave(world);
    const { possession: _dropped, ...legacy } = save;
    expect("possession" in legacy).toBe(false);
    const loaded = loadFromString(JSON.stringify(legacy));
    expect(loaded.v).toBe(SAVE_VERSION);
    expect(loaded.possession).toEqual({
      trust: {},
      gates: {},
      moodBias: {},
      memory: {},
      lastApplied: {},
    });
    applySave(world, loaded);
    expect(world.player.x).toBeCloseTo(save.player.x);
  });

  test("roundtrip possession: trust + ambos TTLs + lucidez + memory", () => {
    const trust = new TrustLedger();
    const gates = new DialogueBehaviorGates();
    const speech = new SpeechDirector({}, () => 0.1);
    const memory = new ShortMemory();
    trust.set("poss-a", 72);
    gates.apply("poss-a", proposeDialogueGates("calmar", 72));
    gates.apply("poss-a", proposeDialogueGates("amenazar", 20));
    speech.setMoodBias("poss-a", "lucidez");
    memory.remember("poss-a", {
      who: "player",
      intent: "calmar",
      trustDelta: 14,
      tone: "ruega",
    });
    memory.remember("poss-a", {
      who: "player",
      intent: "amenazar",
      trustDelta: -20,
      tone: "demonio",
    });

    const world = { ...makeWorld(), possession: { trust, gates, speech, memory } };
    const json = saveToString(world);
    const loaded = loadFromString(json);
    expect(loaded.v).toBe(SAVE_VERSION);
    expect(loaded.possession.trust["poss-a"]).toBe(72);
    expect(loaded.possession.gates["poss-a"]).toEqual({
      pacifiedLeft: GATE_CALM_PACIFY_TTL,
      speedBumpLeft: GATE_THREAT_SPEED_TTL,
      speedBumpMul: GATE_THREAT_SPEED_MUL,
    });
    expect(loaded.possession.moodBias["poss-a"]).toBe("lucidez");
    expect(loaded.possession.memory["poss-a"]).toEqual([
      { who: "player", intent: "calmar", trustDelta: 14, tone: "ruega" },
      { who: "player", intent: "amenazar", trustDelta: -20, tone: "demonio" },
    ]);
    expect(loaded.possession.lastApplied["poss-a"]).toEqual([
      "threat_noise",
      "threat_chase",
      "threat_speed",
    ]);

    const trust2 = new TrustLedger();
    const gates2 = new DialogueBehaviorGates();
    const speech2 = new SpeechDirector({}, () => 0.9);
    const memory2 = new ShortMemory();
    trust2.set("leftover", 11);
    gates2.apply("leftover", proposeDialogueGates("calmar", 80));
    memory2.remember("leftover", {
      who: "player",
      intent: "preguntar",
      trustDelta: 6,
      tone: "lucidez",
    });
    applySave(
      {
        ...makeWorld(),
        possession: { trust: trust2, gates: gates2, speech: speech2, memory: memory2 },
      },
      loaded,
    );
    expect(trust2.has("leftover")).toBe(false);
    expect(memory2.has("leftover")).toBe(false);
    expect(trust2.get("poss-a")).toBe(72);
    expect(gates2.pacifiedLeft("poss-a")).toBe(GATE_CALM_PACIFY_TTL);
    expect(gates2.speedBumpLeft("poss-a")).toBe(GATE_THREAT_SPEED_TTL);
    expect(gates2.speedBumpMul("poss-a")).toBe(GATE_THREAT_SPEED_MUL);
    expect(speech2.getMoodBias("poss-a")).toBe("lucidez");
    expect(memory2.recent("poss-a")).toEqual(loaded.possession.memory["poss-a"]);
    expect(memory2.toneBias("poss-a")).toBe("demonio");
    expect(gates2.lastApplied("poss-a")).toEqual([
      "threat_noise",
      "threat_chase",
      "threat_speed",
    ]);
    expect(gates2.lastApplied("leftover")).toEqual([]);
  });

  test("possession viejo sin memory sigue cargando (vacío)", () => {
    const world = makeWorld();
    const save = captureSave(world);
    const legacyPossession = {
      trust: { "poss-a": 64 },
      gates: {},
      moodBias: { "poss-a": "ruega" as const },
    };
    const loaded = loadFromString(
      JSON.stringify({ ...save, possession: legacyPossession }),
    );
    expect(loaded.possession.trust["poss-a"]).toBe(64);
    expect(loaded.possession.moodBias["poss-a"]).toBe("ruega");
    expect(loaded.possession.memory).toEqual({});
    expect(loaded.possession.lastApplied).toEqual({});
  });
});
