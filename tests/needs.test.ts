import { describe, expect, test } from "vitest";
import {
  createNeeds,
  drink,
  eat,
  NEEDS_FULL_SEC,
  NEEDS_RATE,
  NEEDS_RELIEF,
  rest,
  tickNeeds,
} from "../src/actors/needs";
import { PlayerSim } from "../src/actors/player";
import { GameClock } from "../src/core/clock";
import { createInventory } from "../src/items";

describe("needs tick", () => {
  test("createNeeds inicia en 0 y respeta parciales clamp", () => {
    expect(createNeeds()).toEqual({ hunger: 0, thirst: 0, fatigue: 0 });
    const n = createNeeds({ hunger: 50, thirst: -10, fatigue: 200 });
    expect(n.hunger).toBe(50);
    expect(n.thirst).toBe(0);
    expect(n.fatigue).toBe(100);
  });

  test("NEEDS_FULL_SEC documenta tiempo real 0→100 a rate 1×", () => {
    expect(NEEDS_FULL_SEC.hunger).toBe(420);
    expect(NEEDS_FULL_SEC.thirst).toBe(280);
    expect(NEEDS_FULL_SEC.fatigue).toBe(560);
    expect(NEEDS_RATE.hunger).toBeCloseTo(100 / 420, 10);
    expect(NEEDS_RATE.thirst).toBeCloseTo(100 / 280, 10);
    expect(NEEDS_RATE.fatigue).toBeCloseTo(100 / 560, 10);
    // sed sigue siendo el need más rápido
    expect(NEEDS_FULL_SEC.thirst).toBeLessThan(NEEDS_FULL_SEC.hunger);
    expect(NEEDS_FULL_SEC.hunger).toBeLessThan(NEEDS_FULL_SEC.fatigue);
  });

  test("tickNeeds sube hambre/sed/cansancio con dt", () => {
    const n = createNeeds();
    tickNeeds(n, 10);
    expect(n.hunger).toBeCloseTo(NEEDS_RATE.hunger * 10, 5);
    expect(n.thirst).toBeCloseTo(NEEDS_RATE.thirst * 10, 5);
    expect(n.fatigue).toBeCloseTo(NEEDS_RATE.fatigue * 10, 5);
    expect(n.thirst).toBeGreaterThan(n.hunger);
    expect(n.hunger).toBeGreaterThan(n.fatigue);
  });

  test("tickNeeds no baja con dt<=0 y clampa a 100", () => {
    const n = createNeeds({ hunger: 99, thirst: 99, fatigue: 99 });
    tickNeeds(n, 0);
    expect(n.hunger).toBe(99);
    tickNeeds(n, -1);
    expect(n.hunger).toBe(99);
    tickNeeds(n, 1000);
    expect(n.hunger).toBe(100);
    expect(n.thirst).toBe(100);
    expect(n.fatigue).toBe(100);
  });

  test("rest / eat / drink bajan y no pasan de 0", () => {
    const n = createNeeds({ hunger: 20, thirst: 15, fatigue: 30 });
    rest(n);
    expect(n.fatigue).toBeCloseTo(30 - NEEDS_RELIEF.rest, 5);
    eat(n);
    expect(n.hunger).toBe(0);
    drink(n);
    expect(n.thirst).toBe(0);
  });
});

describe("PlayerSim + GameClock needs", () => {
  test("PlayerSim.tickNeeds avanza con el clock", () => {
    const player = new PlayerSim({ x: 1, y: 1 });
    const clock = new GameClock(48);
    expect(player.needs.hunger).toBe(0);

    clock.advance(12);
    player.tickNeeds(12);
    expect(player.needs.hunger).toBeCloseTo(NEEDS_RATE.hunger * 12, 5);
    expect(player.needs.thirst).toBeCloseTo(NEEDS_RATE.thirst * 12, 5);
    expect(player.needs.fatigue).toBeCloseTo(NEEDS_RATE.fatigue * 12, 5);
  });

  test("rest baja cansancio; tryConsume con items baja hambre/sed", () => {
    const inv = createInventory(8, 20, [
      { id: "canned_food", qty: 1 },
      { id: "water_bottle", qty: 1 },
    ]);
    const player = new PlayerSim(
      { x: 0, y: 0 },
      { hunger: 80, thirst: 70, fatigue: 60 },
      inv,
    );
    player.rest();
    expect(player.needs.fatigue).toBeCloseTo(60 - NEEDS_RELIEF.rest, 5);
    expect(player.tryConsume("food")).toBe("food");
    expect(player.needs.hunger).toBeCloseTo(80 - NEEDS_RELIEF.eat, 5);
    expect(player.tryConsume("drink")).toBe("drink");
    expect(player.needs.thirst).toBeCloseTo(70 - NEEDS_RELIEF.drink, 5);
    expect(player.inventory.slots.some((s) => s.id === "empty_bottle")).toBe(
      true,
    );
  });
});
