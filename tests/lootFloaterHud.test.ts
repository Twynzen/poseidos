import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { itemIconSvg } from "../src/ui/itemIcons";
import {
  LOOT_FLOATER_HUD_MS,
  LOOT_FLOATER_HUD_PLAY_CLASS,
  LOOT_FLOATER_HUD_ERR_CLASS,
  LOOT_FLOATER_HUD_ID,
  createLootFloaterHud,
  showLootFloaterHud,
  lootFloaterVisible,
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
  test("2s y clase loot-floater-play", () => {
    expect(LOOT_FLOATER_HUD_MS).toBe(2000);
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
  innerHTML: string;
  style: Record<string, string>;
  offsetWidth: number;
  hidden?: boolean;
  attributes: Record<string, string>;
  classes: Set<string>;
  classList: {
    add: (...tokens: string[]) => void;
    remove: (...tokens: string[]) => void;
  };
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
    let innerHTML = "";
    let textContent = "";
    const classes = new Set<string>();
    const el: LiveNode = {
      id: "",
      style: {},
      offsetWidth: 1,
      attributes: {},
      classes,
      classList: {
        add: (...tokens: string[]) => {
          for (const t of tokens) classes.add(t);
        },
        remove: (...tokens: string[]) => {
          for (const t of tokens) classes.delete(t);
        },
      },
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
      get innerHTML() {
        return innerHTML;
      },
      set innerHTML(v: string) {
        innerHTML = String(v);
        textContent = innerHTML.replace(/<[^>]*>/g, "");
      },
      get textContent() {
        return textContent;
      },
      set textContent(v: string) {
        textContent = v ?? "";
        innerHTML = textContent;
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
    expect(el!.style.font).toMatch(/20px/);
    expect(el!.style.color).toBe("#ffe080");
    expect(el!.style.borderRadius).toBe("999px");
    expect(el!.style.gap).toBe("8px");
    expect(doc._bodyKids.at(-1)).toBe(el);
  });

  test('show("recogiste agua de lluvia") sets the toast element text', () => {
    const { doc, root } = installFakeDocument();
    const hud = createLootFloaterHud(root as unknown as HTMLElement);
    hud.show("recogiste agua de lluvia");
    const el = doc.getElementById(LOOT_FLOATER_HUD_ID)!;
    expect(el.textContent).toBe("recogiste agua de lluvia");
    expect(el.innerHTML).toBe("recogiste agua de lluvia");
    expect(el.innerHTML).not.toContain("loot-floater-icon");
  });

  test("show(label) backward compatible: +madera text-only chip", () => {
    const { doc, root } = installFakeDocument();
    const hud = createLootFloaterHud(root as unknown as HTMLElement);
    hud.show("+madera");
    const el = doc.getElementById(LOOT_FLOATER_HUD_ID)!;
    expect(el.textContent).toBe("+madera");
    expect(el.innerHTML).toBe("+madera");
    expect(el.innerHTML).not.toContain("loot-floater-icon");
    expect(el.classes.has(LOOT_FLOATER_HUD_ERR_CLASS)).toBe(false);
  });

  test("show: display inline-flex, 2s loot-float, opaco 50%", () => {
    const { doc, root } = installFakeDocument();
    const hud = createLootFloaterHud(root as unknown as HTMLElement);
    hud.show("+madera");
    const el = doc.getElementById(LOOT_FLOATER_HUD_ID)!;
    expect(el.textContent).toBe("+madera");
    expect(el.style.display).toBe("inline-flex");
    expect(el.attributes.hidden).toBeUndefined();
    expect(el.style.animation).toMatch(/loot-float/);
    expect(el.style.animation).toMatch(/2s/);
    const kf = doc.getElementById("loot-floater-kf");
    expect(kf).not.toBeNull();
    expect(kf!.textContent).toMatch(/50%/);
    expect(kf!.textContent).toMatch(/-48px/);
    expect(kf!.textContent).toMatch(/@keyframes loot-float/);
  });

  test("show(label, itemId) pone icono SVG", () => {
    const { doc, root } = installFakeDocument();
    const hud = createLootFloaterHud(root as unknown as HTMLElement);
    hud.show("+madera", "wood");
    const el = doc.getElementById(LOOT_FLOATER_HUD_ID)!;
    expect(el.innerHTML).toContain('class="loot-floater-icon"');
    expect(el.innerHTML).toContain(itemIconSvg("wood"));
    expect(el.innerHTML).toContain("+madera");
    expect(el.innerHTML).not.toContain("loot-floater-qty");
  });

  test("qty badge from ×N", () => {
    const { doc, root } = installFakeDocument();
    const hud = createLootFloaterHud(root as unknown as HTMLElement);
    hud.show("+madera×6", "wood");
    const el = doc.getElementById(LOOT_FLOATER_HUD_ID)!;
    expect(el.innerHTML).toContain('class="loot-floater-qty"');
    expect(el.innerHTML).toContain(">6</span>");
    expect(el.innerHTML).toContain("+madera");
    expect(el.innerHTML).not.toMatch(/\+madera×/);

    hud.show("partiste madera ×3", "wood");
    expect(el.innerHTML).toContain('class="loot-floater-qty"');
    expect(el.innerHTML).toContain(">3</span>");
    expect(el.innerHTML).toContain("partiste madera");
  });

  test("error tone: muted red, sin icono", () => {
    const { doc, root } = installFakeDocument();
    const hud = createLootFloaterHud(root as unknown as HTMLElement);
    hud.show("no se puede usar", "flashlight");
    const el = doc.getElementById(LOOT_FLOATER_HUD_ID)!;
    expect(el.classes.has(LOOT_FLOATER_HUD_ERR_CLASS)).toBe(true);
    expect(el.style.color).toBe("#fca5a5");
    expect(el.style.textShadow).toBe("none");
    expect(el.innerHTML).not.toContain("loot-floater-icon");
    expect(el.textContent).toBe("no se puede usar");

    hud.show("no se puede partir");
    expect(el.classes.has(LOOT_FLOATER_HUD_ERR_CLASS)).toBe(true);
    hud.show("no se puede juntar");
    expect(el.classes.has(LOOT_FLOATER_HUD_ERR_CLASS)).toBe(true);
    hud.show("vacío");
    expect(el.classes.has(LOOT_FLOATER_HUD_ERR_CLASS)).toBe(true);
    hud.show("inventario lleno");
    expect(el.classes.has(LOOT_FLOATER_HUD_ERR_CLASS)).toBe(true);
    expect(el.style.color).toBe("#fca5a5");
    expect(el.innerHTML).not.toContain("loot-floater-icon");
    expect(el.textContent).toBe("inventario lleno");

    hud.show("+madera");
    expect(el.classes.has(LOOT_FLOATER_HUD_ERR_CLASS)).toBe(false);
    expect(el.style.color).toBe("#ffe080");
  });

  test("vacío / whitespace → no-op", () => {
    const { doc, root } = installFakeDocument();
    const hud = createLootFloaterHud(root as unknown as HTMLElement);
    hud.show("");
    const el = doc.getElementById(LOOT_FLOATER_HUD_ID)!;
    expect(el.style.display).toBe("none");
    expect(el.innerHTML).toBe("");
    hud.show("   ");
    expect(el.style.display).toBe("none");
    hud.show("+madera");
    expect(el.style.display).toBe("inline-flex");
    hud.show("  ");
    expect(el.textContent).toBe("+madera");
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

describe("lootFloaterVisible (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte con floater activo: overlay hidden; ya vacío no-op; load-muerto hidden; vivo/load-vivo pinta", () => {
    expect(lootFloaterVisible(true, true)).toBe(false);

    const alreadyEmpty = lootFloaterVisible(true, false);
    expect(alreadyEmpty).toBe(false);
    expect(lootFloaterVisible(true, false)).toBe(false);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(lootFloaterVisible(deadRt.gameOver, true)).toBe(false);
    expect(lootFloaterVisible(deadRt.gameOver, false)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(lootFloaterVisible(liveRt.gameOver, true)).toBe(true);

    expect(lootFloaterVisible(false, true)).toBe(true);
    expect(lootFloaterVisible(false, false)).toBe(false);
  });

  test("Game enterGameOver / freeze / F9 load-muerto ocultan #loot-floater; vivo no hide", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("lootFloaterVisible(");
    expect(src).toContain("this.lootToast.hide()");
    expect(src).toMatch(
      /syncLootFloaterOverlay\(\): void \{[\s\S]{0,280}lootFloaterVisible\(\s*this\.gameOver/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,500}this\.syncLootFloaterOverlay\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,500}this\.syncLootFloaterOverlay\(\)/,
    );
    expect(src).toMatch(
      /this\.syncSpeechOverlay\(\);\s*this\.syncDialoguePanel\(\);\s*this\.syncLootFloaterOverlay\(\);\s*this\.syncInventoryPanel\(\);\s*this\.hudAcc \+= dt/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,900}this\.lootToast\.show/,
    );
  });
});

describe("createLootFloaterHud hide (HAS MUERTO)", () => {
  afterEach(() => {
    delete (globalThis as { document?: unknown }).document;
  });

  test("hide con toast activo: display none; ya vacío no-op; show vivo vuelve a pintar", () => {
    const { doc, root } = installFakeDocument();
    const hud = createLootFloaterHud(root as unknown as HTMLElement);
    hud.show("+madera", "wood");
    const el = doc.getElementById(LOOT_FLOATER_HUD_ID)!;
    expect(el.style.display).toBe("inline-flex");
    expect(el.innerHTML).toContain("+madera");

    hud.hide();
    expect(el.style.display).toBe("none");
    expect(el.innerHTML).toBe("");
    expect(el.style.animation).toBe("none");

    hud.hide();
    expect(el.style.display).toBe("none");
    expect(el.innerHTML).toBe("");

    hud.show("+scrap", "scrap");
    expect(el.style.display).toBe("inline-flex");
    expect(el.innerHTML).toContain("+scrap");
  });
});

describe("loot floater icon CSS", () => {
  test(".loot-floater-icon is 36px", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toMatch(
      /#loot-floater \.loot-floater-icon\s*\{[^}]*width:\s*36px;\s*height:\s*36px/s,
    );
    expect(html).toMatch(
      /#loot-floater \.loot-floater-icon\s*\{[^}]*flex:\s*0 0 36px/s,
    );
    expect(html).toMatch(
      /#loot-floater \.loot-floater-icon svg\s*\{\s*width:\s*36px;\s*height:\s*36px;/,
    );
  });
});
