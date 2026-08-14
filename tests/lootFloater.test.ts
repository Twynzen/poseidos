import { describe, expect, test } from "vitest";
import {
  LOOT_FLOATER_MAX_CHARS,
  lootFloaterLabel,
} from "../src/render/lootFloater";

describe("constantes", () => {
  test("max 16 chars", () => {
    expect(LOOT_FLOATER_MAX_CHARS).toBe(16);
  });
});

describe("lootFloaterLabel", () => {
  test("corto sin cambio", () => {
    expect(lootFloaterLabel("+scrap")).toBe("+scrap");
    expect(lootFloaterLabel("+canned_food")).toBe("+canned_food");
    expect(lootFloaterLabel("+lata de comida")).toBe("+lata de comida");
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

  test("qty>1 sufija ×n; qty 1 no cambia", () => {
    expect(lootFloaterLabel("+madera", 6)).toBe("+madera×6");
    expect(lootFloaterLabel("+munición", 8)).toBe("+munición×8");
    expect(lootFloaterLabel("+madera", 1)).toBe("+madera");
  });
});
