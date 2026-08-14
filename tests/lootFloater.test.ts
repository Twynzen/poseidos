import { describe, expect, test } from "vitest";
import {
  LOOT_FLOATER_MAX_CHARS,
  lootFloaterLabel,
} from "../src/render/lootFloater";

describe("constantes", () => {
  test("max 18 chars", () => {
    expect(LOOT_FLOATER_MAX_CHARS).toBe(18);
  });
});

describe("lootFloaterLabel", () => {
  test("corto sin cambio", () => {
    expect(lootFloaterLabel("+scrap")).toBe("+scrap");
    expect(lootFloaterLabel("+canned_food")).toBe("+canned_food");
    expect(lootFloaterLabel("+lata de comida")).toBe("+lata de comida");
  });

  test("exacto 18 sin cambio", () => {
    const s = "123456789012345678";
    expect(s.length).toBe(18);
    expect(lootFloaterLabel(s)).toBe(s);
  });

  test("más de 18 → slice a 18", () => {
    expect(lootFloaterLabel("1234567890123456789")).toBe("123456789012345678");
    expect(lootFloaterLabel("+pila de madera extra").length).toBe(18);
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
