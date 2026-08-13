import { describe, expect, test } from "vitest";
import {
  LOOT_FLOATER_HUD_MS,
  LOOT_FLOATER_HUD_PLAY_CLASS,
  showLootFloaterHud,
  type LootFloaterHudEl,
} from "../src/ui/lootFloaterHud";

function makeEl(): LootFloaterHudEl & { classes: Set<string>; reads: number } {
  const classes = new Set<string>();
  const el = {
    textContent: "" as string | null,
    classes,
    reads: 0,
    get offsetWidth() {
      el.reads += 1;
      return 1;
    },
    classList: {
      add: (...tokens: string[]) => {
        for (const t of tokens) classes.add(t);
      },
      remove: (...tokens: string[]) => {
        for (const t of tokens) classes.delete(t);
      },
    },
  };
  return el;
}

describe("constantes", () => {
  test("1.8s y clase loot-floater-play", () => {
    expect(LOOT_FLOATER_HUD_MS).toBe(1800);
    expect(LOOT_FLOATER_HUD_PLAY_CLASS).toBe("loot-floater-play");
  });
});

describe("showLootFloaterHud", () => {
  test("null / undefined → no-op", () => {
    expect(() => showLootFloaterHud(null, "+scrap")).not.toThrow();
    expect(() => showLootFloaterHud(undefined, "+scrap")).not.toThrow();
  });

  test("pone el label", () => {
    const el = makeEl();
    showLootFloaterHud(el, "+scrap");
    expect(el.textContent).toBe("+scrap");
    showLootFloaterHud(el, "+lata de comida");
    expect(el.textContent).toBe("+lata de comida");
  });

  test("añade loot-floater-play", () => {
    const el = makeEl();
    showLootFloaterHud(el, "+madera");
    expect(el.classes.has(LOOT_FLOATER_HUD_PLAY_CLASS)).toBe(true);
  });

  test("reinicia animación: remove + reflow + add", () => {
    const el = makeEl();
    el.classes.add(LOOT_FLOATER_HUD_PLAY_CLASS);
    const before = el.reads;
    showLootFloaterHud(el, "+scrap");
    expect(el.reads).toBeGreaterThan(before);
    expect(el.classes.has(LOOT_FLOATER_HUD_PLAY_CLASS)).toBe(true);
  });

  test('vacío → textContent "" y igual dispara play', () => {
    const el = makeEl();
    showLootFloaterHud(el, "");
    expect(el.textContent).toBe("");
    expect(el.classes.has(LOOT_FLOATER_HUD_PLAY_CLASS)).toBe(true);
  });

  test("no-string → text vacío", () => {
    const el = makeEl();
    showLootFloaterHud(el, 12 as unknown as string);
    expect(el.textContent).toBe("");
    showLootFloaterHud(el, null as unknown as string);
    expect(el.textContent).toBe("");
  });

  test("retrigger reemplaza label", () => {
    const el = makeEl();
    showLootFloaterHud(el, "+scrap");
    showLootFloaterHud(el, "+pila");
    expect(el.textContent).toBe("+pila");
    expect(el.classes.has(LOOT_FLOATER_HUD_PLAY_CLASS)).toBe(true);
  });

  test("no muta otros tokens de classList", () => {
    const el = makeEl();
    el.classes.add("keep-me");
    showLootFloaterHud(el, "+scrap");
    expect(el.classes.has("keep-me")).toBe(true);
    expect(el.classes.has(LOOT_FLOATER_HUD_PLAY_CLASS)).toBe(true);
  });
});
