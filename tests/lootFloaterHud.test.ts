import { afterEach, describe, expect, test } from "vitest";
import {
  LOOT_FLOATER_HUD_MS,
  LOOT_FLOATER_HUD_PLAY_CLASS,
  LOOT_FLOATER_HUD_ID,
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

  test("bag querySelector #loot-floater", () => {
    const inner = makeEl();
    const bag = {
      querySelector: (sel: string) => (sel === "#loot-floater" ? inner : null),
    };
    showLootFloaterHud(bag, "+scrap");
    expect(inner.textContent).toBe("+scrap");
    expect(inner.classes.has(LOOT_FLOATER_HUD_PLAY_CLASS)).toBe(true);
  });

  test("bag sin #loot-floater → no-op", () => {
    const bag = { querySelector: () => null };
    expect(() => showLootFloaterHud(bag, "+scrap")).not.toThrow();
  });
});

type LiveNode = {
  id: string;
  textContent: string;
  style: Record<string, string>;
  offsetWidth: number;
  setAttribute: (name: string, value: string) => void;
};

function installFakeDocument() {
  const nodes = new Map<string, LiveNode>();
  const bodyKids: LiveNode[] = [];
  const headKids: LiveNode[] = [];
  const doc = {
    getElementById(id: string) {
      return nodes.get(id) ?? null;
    },
    createElement(_tag: string): LiveNode {
      const el: LiveNode = {
        id: "",
        textContent: "",
        style: {},
        offsetWidth: 1,
        setAttribute() {},
      };
      return el;
    },
    head: {
      appendChild(el: LiveNode) {
        if (el.id) nodes.set(el.id, el);
        headKids.push(el);
        return el;
      },
    },
    body: {
      appendChild(el: LiveNode) {
        if (el.id) nodes.set(el.id, el);
        const i = bodyKids.indexOf(el);
        if (i >= 0) bodyKids.splice(i, 1);
        bodyKids.push(el);
        return el;
      },
    },
    _bodyKids: bodyKids,
    _headKids: headKids,
    _nodes: nodes,
  };
  (globalThis as { document?: typeof doc }).document = doc;
  return doc;
}

describe("live path (document)", () => {
  afterEach(() => {
    delete (globalThis as { document?: unknown }).document;
  });

  test("crea #loot-floater al final de body con inline styles", () => {
    const doc = installFakeDocument();
    showLootFloaterHud("+scrap");
    const el = doc.getElementById(LOOT_FLOATER_HUD_ID);
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe("+scrap");
    expect(el!.style.position).toBe("fixed");
    expect(el!.style.zIndex).toBe("9999");
    expect(el!.style.font).toMatch(/36px/);
    expect(el!.style.color).toBe("#ffe080");
    expect(el!.style.animation).toMatch(/loot-float/);
    expect(el!.style.animation).toMatch(/1\.8s/);
    expect(doc._bodyKids.at(-1)).toBe(el);
  });

  test("reusa getElementById y re-append last", () => {
    const doc = installFakeDocument();
    showLootFloaterHud("+a");
    const first = doc.getElementById(LOOT_FLOATER_HUD_ID);
    const dummy = doc.createElement("div");
    dummy.id = "other";
    doc.body.appendChild(dummy);
    showLootFloaterHud("+b");
    const again = doc.getElementById(LOOT_FLOATER_HUD_ID);
    expect(again).toBe(first);
    expect(again!.textContent).toBe("+b");
    expect(doc._bodyKids.at(-1)).toBe(again);
  });

  test("inyecta @keyframes loot-float", () => {
    const doc = installFakeDocument();
    showLootFloaterHud("+madera");
    const style = doc.getElementById("loot-floater-keyframes");
    expect(style).not.toBeNull();
    expect(style!.textContent).toMatch(/@keyframes loot-float/);
  });
});
