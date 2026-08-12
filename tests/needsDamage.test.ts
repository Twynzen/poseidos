import { describe, expect, test } from "vitest";
import {
  NEED_DAMAGE_THRESHOLD,
  STARVE_DPS,
  DEHYDRATE_DPS,
  needsDamagePerSecond,
  computeNeedsDamage,
  needsDamageHudMessage,
} from "../src/actors/needsDamage";
import { PlayerSim } from "../src/actors/player";
import { createNeeds } from "../src/actors/needs";

describe("needsDamagePerSecond", () => {
  test("needs bajos → 0", () => {
    expect(needsDamagePerSecond({ hunger: 0, thirst: 0 })).toBe(0);
    expect(needsDamagePerSecond({ hunger: 99, thirst: 99 })).toBe(0);
    expect(
      needsDamagePerSecond({ hunger: NEED_DAMAGE_THRESHOLD - 0.01, thirst: 50 }),
    ).toBe(0);
  });

  test("hunger 100 → STARVE_DPS", () => {
    expect(needsDamagePerSecond({ hunger: 100, thirst: 0 })).toBe(STARVE_DPS);
  });

  test("thirst 100 → DEHYDRATE_DPS", () => {
    expect(needsDamagePerSecond({ hunger: 0, thirst: 100 })).toBe(
      DEHYDRATE_DPS,
    );
  });

  test("ambos → suma", () => {
    expect(needsDamagePerSecond({ hunger: 100, thirst: 100 })).toBe(
      STARVE_DPS + DEHYDRATE_DPS,
    );
  });

  test("fatigue no afecta (solo hunger/thirst en input)", () => {
    expect(needsDamagePerSecond({ hunger: 50, thirst: 50 })).toBe(0);
  });
});

describe("computeNeedsDamage", () => {
  test("needs bajos → amount 0", () => {
    const d = computeNeedsDamage({ hunger: 40, thirst: 60 }, 1);
    expect(d.amount).toBe(0);
    expect(d.starve).toBe(false);
    expect(d.dehydrate).toBe(false);
  });

  test("hunger 100 → starve DPS * dt", () => {
    const dt = 0.5;
    const d = computeNeedsDamage({ hunger: 100, thirst: 10 }, dt);
    expect(d.starve).toBe(true);
    expect(d.dehydrate).toBe(false);
    expect(d.amount).toBeCloseTo(STARVE_DPS * dt, 10);
  });

  test("thirst 100 → dehydrate", () => {
    const dt = 1;
    const d = computeNeedsDamage({ hunger: 0, thirst: 100 }, dt);
    expect(d.starve).toBe(false);
    expect(d.dehydrate).toBe(true);
    expect(d.amount).toBeCloseTo(DEHYDRATE_DPS * dt, 10);
  });

  test("ambos → suma", () => {
    const dt = 0.25;
    const d = computeNeedsDamage({ hunger: 100, thirst: 100 }, dt);
    expect(d.starve).toBe(true);
    expect(d.dehydrate).toBe(true);
    expect(d.amount).toBeCloseTo((STARVE_DPS + DEHYDRATE_DPS) * dt, 10);
  });

  test("dt 0 → 0 amount (flags pueden estar activos)", () => {
    const d = computeNeedsDamage({ hunger: 100, thirst: 100 }, 0);
    expect(d.amount).toBe(0);
    expect(d.starve).toBe(true);
    expect(d.dehydrate).toBe(true);
  });

  test("dt negativo → 0", () => {
    const d = computeNeedsDamage({ hunger: 100, thirst: 100 }, -1);
    expect(d.amount).toBe(0);
  });
});

describe("needsDamageHudMessage", () => {
  test("mensajes ES según razones", () => {
    expect(
      needsDamageHudMessage({ amount: 1, starve: true, dehydrate: false }),
    ).toBe("hambre te debilita");
    expect(
      needsDamageHudMessage({ amount: 1, starve: false, dehydrate: true }),
    ).toBe("sed te debilita");
    expect(
      needsDamageHudMessage({ amount: 1, starve: true, dehydrate: true }),
    ).toBe("hambre y sed te debilitan");
    expect(
      needsDamageHudMessage({ amount: 0, starve: true, dehydrate: true }),
    ).toBeNull();
  });
});

describe("PlayerSim integración ligera", () => {
  test("takeDamage con computeNeedsDamage baja HP", () => {
    const player = new PlayerSim(
      { x: 0, y: 0 },
      createNeeds({ hunger: 100, thirst: 100, fatigue: 100 }),
    );
    const hp0 = player.health;
    const d = computeNeedsDamage(player.needs, 1);
    expect(d.amount).toBe(STARVE_DPS + DEHYDRATE_DPS);
    player.takeDamage(d.amount);
    expect(player.health).toBeCloseTo(hp0 - d.amount, 5);
    expect(player.alive).toBe(true);
  });

  test("fatigue 100 solo no daña", () => {
    const player = new PlayerSim(
      { x: 0, y: 0 },
      { hunger: 0, thirst: 0, fatigue: 100 },
    );
    const d = computeNeedsDamage(player.needs, 5);
    expect(d.amount).toBe(0);
    player.takeDamage(d.amount);
    expect(player.health).toBe(100);
  });
});
