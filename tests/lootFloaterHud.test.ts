import { afterEach, describe, expect, test } from "vitest";
import {
  LOOT_FLOATER_HUD_MS,
  LOOT_FLOATER_HUD_PLAY_CLASS,
  LOOT_FLOATER_HUD_ID,
  createLootFloaterHud,
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
  test("4s y clase loot-floater-play", () => {
    expect(LOOT_FLOATER_HUD_MS).toBe(4000);
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

  test("showLootFloaterHud(label, bag)", () => {
    const inner = makeEl();
    const bag = {
      querySelector: (sel: string) => (sel === "#loot-floater" ? inner : null),
    };
    showLootFloaterHud("+madera", bag);
    expect(inner.textContent).toBe("+madera");
    expect(inner.classes.has(LOOT_FLOATER_HUD_PLAY_CLASS)).toBe(true);
  });

  test("bag sin #loot-floater → no-op", () => {
    const bag = { querySelector: () => null };
    expect(() => showLootFloaterHud(bag, "+scrap")).not.toThrow();
    expect(() => showLootFloaterHud("+scrap", bag)).not.toThrow();
  });
});

type LiveNode = {
  id: string;
  textContent: string;
  style: Record<string, string>;
  offsetWidth: number;
  hidden?: boolean;
  attributes: Record<string, string>;
  setAttribute: (name: string, value: string) => void;
  removeAttribute: (name: string) => void;
  remove: () => void;
  querySelector?: (sel: string) => LiveNode | null;
  appendChild?: (el: LiveNode) => LiveNode;
  ownerDocument?: unknown;
};

function installFakeDocument() {
  const nodes = new Map<string, LiveNode>();
  const bodyKids: LiveNode[] = [];
  const headKids: LiveNode[] = [];

  function makeNode(): LiveNode {
    const el: LiveNode = {
      id: "",
      textContent: "",
      style: {},
      offsetWidth: 1,
      attributes: {},
      setAttribute(name, value) {
        el.attributes[name] = value;
      },
      removeAttribute(name) {
        delete el.attributes[name];
        if (name === "hidden") el.hidden = false;
      },
      remove() {
        const i = bodyKids.indexOf(el);
        if (i >= 0) bodyKids.splice(i, 1);
        if (el.id) nodes.delete(el.id);
      },
    };
    return el;
  }

  const head = {
    appendChild(el: LiveNode) {
      if (el.id) nodes.set(el.id, el);
      headKids.push(el);
      return el;
    },
  };

  const root: LiveNode & {
    ownerDocument: unknown;
    querySelector: (sel: string) => LiveNode | null;
    appendChild: (el: LiveNode) => LiveNode;
  } = Object.assign(makeNode(), {
    ownerDocument: null as unknown,
    querySelector(sel: string) {
      return sel === "#loot-floater" ? (nodes.get(LOOT_FLOATER_HUD_ID) ?? null) : null;
    },
    appendChild(el: LiveNode) {
      if (el.id) nodes.set(el.id, el);
      const i = bodyKids.indexOf(el);
      if (i >= 0) bodyKids.splice(i, 1);
      bodyKids.push(el);
      return el;
    },
  });

  const doc = {
    getElementById(id: string) {
      return nodes.get(id) ?? null;
    },
    createElement(_tag: string): LiveNode {
      return makeNode();
    },
    head,
    body: root,
    _bodyKids: bodyKids,
    _headKids: headKids,
    _nodes: nodes,
  };
  root.ownerDocument = doc;
  (globalThis as { document?: typeof doc }).document = doc;
  return { doc, root };
}

describe("createLootFloaterHud", () => {
  afterEach(() => {
    delete (globalThis as { document?: unknown }).document;
  });

  test("crea #loot-floater en root, display none, sin hidden", () => {
    const { doc, root } = installFakeDocument();
    createLootFloaterHud(root as unknown as HTMLElement);
    const el = doc.getElementById(LOOT_FLOATER_HUD_ID);
    expect(el).not.toBeNull();
    expect(el!.style.display).toBe("none");
    expect(el!.attributes.hidden).toBeUndefined();
    expect(el!.style.position).toBe("fixed");
    expect(el!.style.zIndex).toBe("9999");
    expect(el!.style.font).toMatch(/42px/);
    expect(el!.style.color).toBe("#ffe080");
    expect(doc._bodyKids.at(-1)).toBe(el);
  });

  test('show("recogiste agua de lluvia") sets the toast element text', () => {
    const { doc, root } = installFakeDocument();
    const hud = createLootFloaterHud(root as unknown as HTMLElement);
    hud.show("recogiste agua de lluvia");
    const el = doc.getElementById(LOOT_FLOATER_HUD_ID)!;
    expect(el.textContent).toBe("recogiste agua de lluvia");
  });

  test("show: display block, 4s loot-float, opaco 55%", () => {
    const { doc, root } = installFakeDocument();
    const hud = createLootFloaterHud(root as unknown as HTMLElement);
    hud.show("+madera");
    const el = doc.getElementById(LOOT_FLOATER_HUD_ID)!;
    expect(el.textContent).toBe("+madera");
    expect(el.style.display).toBe("block");
    expect(el.attributes.hidden).toBeUndefined();
    expect(el.style.animation).toMatch(/loot-float/);
    expect(el.style.animation).toMatch(/4s/);
    const kf = doc.getElementById("loot-floater-kf");
    expect(kf).not.toBeNull();
    expect(kf!.textContent).toMatch(/55%/);
    expect(kf!.textContent).toMatch(/@keyframes loot-float/);
  });

  test("reusa #loot-floater y lo mueve al final del root", () => {
    const { doc, root } = installFakeDocument();
    const hud = createLootFloaterHud(root as unknown as HTMLElement);
    const first = doc.getElementById(LOOT_FLOATER_HUD_ID);
    const dummy = doc.createElement("div");
    dummy.id = "other";
    root.appendChild(dummy);
    hud.show("+a");
    hud.show("+b");
    const again = doc.getElementById(LOOT_FLOATER_HUD_ID);
    expect(again).toBe(first);
    expect(again!.textContent).toBe("+b");
  });
});
