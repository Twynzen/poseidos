import { describe, expect, test } from "vitest";
import {
  LOOT_NAMEPLATE_FADE_DIST,
  LOOT_NAMEPLATE_MAX_CHARS,
  LOOT_NAMEPLATE_Y,
  lootNameplateLabel,
  lootNameplateOpacity,
  lootNameplateVisible,
  truncateLootLabel,
} from "../src/render/lootNameplate";

describe("constantes", () => {
  test("max 20 chars; fade dist 10; y 1.45", () => {
    expect(LOOT_NAMEPLATE_MAX_CHARS).toBe(20);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(10);
    expect(LOOT_NAMEPLATE_Y).toBe(1.45);
  });
});

describe("lootNameplateLabel", () => {
  test("corto sin cambio", () => {
    expect(lootNameplateLabel("cocina")).toBe("cocina");
    expect(lootNameplateLabel("pila de madera")).toBe("pila de madera");
    expect(truncateLootLabel("cocina")).toBe("cocina");
  });

  test("pila de madera ×12 cabe en 20", () => {
    expect(lootNameplateLabel("pila de madera ×12")).toBe("pila de madera ×12");
    expect("pila de madera ×12".length).toBe(18);
  });

  test("exacto 20 sin cambio", () => {
    const s = "12345678901234567890";
    expect(s.length).toBe(20);
    expect(lootNameplateLabel(s)).toBe(s);
    expect(truncateLootLabel(s)).toBe(s);
  });

  test("más de 20 → slice a 20", () => {
    expect(lootNameplateLabel("123456789012345678901")).toBe(
      "12345678901234567890",
    );
    expect(lootNameplateLabel("pila de madera extra!")).toBe(
      "pila de madera extra",
    );
    expect(lootNameplateLabel("pila de madera extra!").length).toBe(20);
  });

  test('vacío → ""', () => {
    expect(lootNameplateLabel("")).toBe("");
    expect(truncateLootLabel("")).toBe("");
  });
});

describe("lootNameplateOpacity", () => {
  test("1 en dist 0; 0 en fade 10; 0 fuera", () => {
    expect(lootNameplateOpacity(0)).toBe(1);
    expect(lootNameplateOpacity(10)).toBe(0);
    expect(lootNameplateOpacity(10.01)).toBe(0);
    expect(lootNameplateOpacity(80)).toBe(0);
  });

  test("lerp lineal dentro del fade", () => {
    expect(lootNameplateOpacity(5)).toBeCloseTo(0.5, 10);
    expect(lootNameplateOpacity(2.5)).toBeCloseTo(0.75, 10);
    const t = 0.25;
    expect(lootNameplateOpacity(10 * t)).toBeCloseTo(1 - t, 10);
  });

  test("NaN → 0", () => {
    expect(lootNameplateOpacity(Number.NaN)).toBe(0);
  });

  test("Infinity → 0", () => {
    expect(lootNameplateOpacity(Number.POSITIVE_INFINITY)).toBe(0);
    expect(lootNameplateOpacity(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  test("dist negativa se clampa a 0 → 1", () => {
    expect(lootNameplateOpacity(-0.4)).toBe(1);
  });
});

describe("lootNameplateVisible", () => {
  test("visible si opacity > 0; dist >= 10 oculto", () => {
    expect(lootNameplateVisible(0)).toBe(true);
    expect(lootNameplateVisible(9.99)).toBe(true);
    expect(lootNameplateVisible(10)).toBe(false);
    expect(lootNameplateVisible(11)).toBe(false);
  });

  test("empty → false; con loot → true", () => {
    expect(lootNameplateVisible(0, true)).toBe(false);
    expect(lootNameplateVisible(0, false)).toBe(true);
    expect(lootNameplateVisible(5, true)).toBe(false);
  });

  test("NaN → false", () => {
    expect(lootNameplateVisible(Number.NaN)).toBe(false);
  });

  test("Infinity → false", () => {
    expect(lootNameplateVisible(Number.POSITIVE_INFINITY)).toBe(false);
  });

  test("dist negativa en fade → true", () => {
    expect(lootNameplateVisible(-0.4)).toBe(true);
    expect(lootNameplateVisible(-0.4, true)).toBe(false);
  });
});
