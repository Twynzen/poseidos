import { describe, expect, test } from "vitest";
import {
  LOOT_FLOATER_MAX_CHARS,
  LOOT_FLOATER_RISE,
  LOOT_FLOATER_TTL,
  LOOT_FLOATER_Y0,
  lootFloaterAlive,
  lootFloaterLabel,
  lootFloaterOpacity,
  lootFloaterY,
} from "../src/render/lootFloater";

describe("constantes", () => {
  test("TTL 1.8; rise 1.0; Y0 2.05; max 16 chars", () => {
    expect(LOOT_FLOATER_TTL).toBe(1.8);
    expect(LOOT_FLOATER_RISE).toBe(1.0);
    expect(LOOT_FLOATER_Y0).toBe(2.05);
    expect(LOOT_FLOATER_MAX_CHARS).toBe(16);
  });
});

describe("lootFloaterLabel", () => {
  test("corto sin cambio", () => {
    expect(lootFloaterLabel("+scrap")).toBe("+scrap");
    expect(lootFloaterLabel("+canned_food")).toBe("+canned_food");
  });

  test("exacto 16 sin cambio", () => {
    const s = "1234567890123456";
    expect(s.length).toBe(16);
    expect(lootFloaterLabel(s)).toBe(s);
  });

  test("más de 16 → slice a 16", () => {
    expect(lootFloaterLabel("12345678901234567")).toBe("1234567890123456");
    expect(lootFloaterLabel("+pila de madera extra").length).toBe(16);
  });

  test('vacío → ""', () => {
    expect(lootFloaterLabel("")).toBe("");
  });
});

describe("lootFloaterY", () => {
  test("Y0 al spawn; Y0+rise al TTL", () => {
    expect(lootFloaterY(0)).toBe(LOOT_FLOATER_Y0);
    expect(lootFloaterY(LOOT_FLOATER_TTL)).toBe(
      LOOT_FLOATER_Y0 + LOOT_FLOATER_RISE,
    );
    expect(lootFloaterY(LOOT_FLOATER_TTL + 1)).toBe(
      LOOT_FLOATER_Y0 + LOOT_FLOATER_RISE,
    );
  });

  test("lerp lineal a mitad", () => {
    expect(lootFloaterY(LOOT_FLOATER_TTL * 0.5)).toBeCloseTo(
      LOOT_FLOATER_Y0 + LOOT_FLOATER_RISE * 0.5,
      10,
    );
  });

  test("NaN / negativo → Y0", () => {
    expect(lootFloaterY(Number.NaN)).toBe(LOOT_FLOATER_Y0);
    expect(lootFloaterY(-0.4)).toBe(LOOT_FLOATER_Y0);
  });
});

describe("lootFloaterOpacity", () => {
  test("1 en 0; 0.5 a mitad; 0 al TTL", () => {
    expect(lootFloaterOpacity(0)).toBe(1);
    expect(lootFloaterOpacity(LOOT_FLOATER_TTL * 0.5)).toBeCloseTo(0.5, 10);
    expect(lootFloaterOpacity(LOOT_FLOATER_TTL)).toBe(0);
    expect(lootFloaterOpacity(LOOT_FLOATER_TTL + 0.01)).toBe(0);
  });

  test("NaN / Infinity → 0", () => {
    expect(lootFloaterOpacity(Number.NaN)).toBe(0);
    expect(lootFloaterOpacity(Number.POSITIVE_INFINITY)).toBe(0);
    expect(lootFloaterOpacity(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});

describe("lootFloaterAlive", () => {
  test("vivo si age < TTL", () => {
    expect(lootFloaterAlive(0)).toBe(true);
    expect(lootFloaterAlive(1.79)).toBe(true);
    expect(lootFloaterAlive(LOOT_FLOATER_TTL)).toBe(false);
    expect(lootFloaterAlive(2)).toBe(false);
  });

  test("NaN / Infinity → false", () => {
    expect(lootFloaterAlive(Number.NaN)).toBe(false);
    expect(lootFloaterAlive(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
