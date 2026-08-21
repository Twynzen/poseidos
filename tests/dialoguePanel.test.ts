/**
 * @vitest-environment happy-dom
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  createDialoguePanel,
  formatGateLine,
  wouldRejectDialogueOption,
} from "../src/ui/dialoguePanel";

describe("dialogue panel CSS", () => {
  test("#dialogue-panel font 13.5px", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toMatch(/#dialogue-panel\s*\{[^}]*font:\s*13\.5px\/1\.5/s);
  });
});

describe("dialogue panel close (muerte / T / Esc / F9 load-muerto)", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  test("sync open false oculta el panel; ya cerrado sigue oculto", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const panel = createDialoguePanel(root);
    const el = root.querySelector<HTMLElement>("#dialogue-panel");
    expect(el).toBeTruthy();
    expect(el!.hidden).toBe(true);

    panel.sync({
      open: true,
      targetId: "poss-a",
      trust: 50,
      lastLine: null,
      lastTone: null,
    });
    expect(el!.hidden).toBe(false);
    expect(el!.textContent).toContain("Hablar · poss-a");

    panel.sync({
      open: false,
      targetId: null,
      trust: 50,
      lastLine: null,
      lastTone: null,
    });
    expect(el!.hidden).toBe(true);

    panel.sync({
      open: false,
      targetId: null,
      trust: 50,
      lastLine: null,
      lastTone: null,
    });
    expect(el!.hidden).toBe(true);
    panel.dispose();
  });
});

describe("formatGateLine", () => {
  test("applied nonempty → código: aplicado (tags)", () => {
    expect(
      formatGateLine({ applied: ["pacify_ttl"], rejected: [] }),
    ).toBe("código: aplicado (pacify_ttl)");
  });

  test("applied joins tags", () => {
    expect(
      formatGateLine({
        applied: ["threat_noise", "threat_chase", "threat_speed"],
        rejected: [],
      }),
    ).toBe("código: aplicado (threat_noise, threat_chase, threat_speed)");
  });

  test("only rejected → código: rechazado (trust)", () => {
    expect(
      formatGateLine({ applied: [], rejected: ["pacify_ttl"] }),
    ).toBe("código: rechazado (trust)");
  });

  test("both empty → null", () => {
    expect(formatGateLine({ applied: [], rejected: [] })).toBeNull();
  });
});

describe("wouldRejectDialogueOption", () => {
  test("calmar at low trust → blocked", () => {
    expect(wouldRejectDialogueOption("calmar", 40)).toBe(true);
  });

  test("calmar at high trust → open", () => {
    expect(wouldRejectDialogueOption("calmar", 70)).toBe(false);
  });

  test("ofrecer without food → blocked", () => {
    expect(wouldRejectDialogueOption("ofrecer", 80, { hasOfferFood: false })).toBe(
      true,
    );
    expect(wouldRejectDialogueOption("ofrecer", 80)).toBe(true);
  });

  test("ofrecer with food + enough trust → open", () => {
    expect(wouldRejectDialogueOption("ofrecer", 50, { hasOfferFood: true })).toBe(
      false,
    );
  });
});

describe("dialogue panel gate line", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  function mount() {
    root = document.createElement("div");
    document.body.appendChild(root);
    return createDialoguePanel(root);
  }

  function gateEl(): HTMLElement {
    const el = root.querySelector<HTMLElement>(".dialogue-gate");
    expect(el).toBeTruthy();
    return el!;
  }

  test("muestra la línea cuando gateLine está presente", () => {
    const panel = mount();
    panel.sync({
      open: true,
      targetId: "poss-1",
      trust: 70,
      lastLine: "tranquilo…",
      lastTone: "lucidez",
      gateLine: "código: aplicado (pacify_ttl)",
    });
    const el = gateEl();
    expect(el.hidden).toBe(false);
    expect(el.textContent).toBe("código: aplicado (pacify_ttl)");
    panel.dispose();
  });

  test("oculta la línea cuando gateLine está vacío", () => {
    const panel = mount();
    panel.sync({
      open: true,
      targetId: "poss-1",
      trust: 40,
      lastLine: null,
      lastTone: null,
      gateLine: "código: rechazado (trust)",
    });
    expect(gateEl().hidden).toBe(false);
    panel.sync({
      open: true,
      targetId: "poss-1",
      trust: 40,
      lastLine: null,
      lastTone: null,
      gateLine: null,
    });
    const el = gateEl();
    expect(el.hidden).toBe(true);
    expect(el.textContent).toBe("");
    panel.dispose();
  });
});

describe("dialogue panel preview-gate", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  function mount() {
    root = document.createElement("div");
    document.body.appendChild(root);
    return createDialoguePanel(root);
  }

  function btn(intent: string): HTMLButtonElement {
    const el = root.querySelector<HTMLButtonElement>(
      `button[data-intent="${intent}"]`,
    );
    expect(el).toBeTruthy();
    return el!;
  }

  function expectBlocked(intent: string, blocked: boolean): void {
    const el = btn(intent);
    expect(el.disabled).toBe(blocked);
    expect(el.classList.contains("dialogue-btn-blocked")).toBe(blocked);
    expect(el.getAttribute("aria-disabled")).toBe(blocked ? "true" : "false");
    expect(el.hidden).toBe(false);
  }

  test("marca calmar bloqueado a trust bajo y abierto a trust alto", () => {
    const panel = mount();
    panel.sync({
      open: true,
      targetId: "poss-1",
      trust: 40,
      lastLine: null,
      lastTone: null,
    });
    expectBlocked("calmar", true);
    panel.sync({
      open: true,
      targetId: "poss-1",
      trust: 70,
      lastLine: null,
      lastTone: null,
    });
    expectBlocked("calmar", false);
    panel.dispose();
  });

  test("marca ofrecer bloqueado sin comida y abierto con comida + trust", () => {
    const panel = mount();
    panel.sync({
      open: true,
      targetId: "poss-1",
      trust: 80,
      lastLine: null,
      lastTone: null,
      hasOfferFood: false,
    });
    expectBlocked("ofrecer", true);
    panel.sync({
      open: true,
      targetId: "poss-1",
      trust: 50,
      lastLine: null,
      lastTone: null,
      hasOfferFood: true,
    });
    expectBlocked("ofrecer", false);
    panel.dispose();
  });

  test("clic en botón bloqueado no aplica la elección", () => {
    const panel = mount();
    const seen: string[] = [];
    panel.onChoice((intent) => {
      seen.push(intent);
    });
    panel.sync({
      open: true,
      targetId: "poss-1",
      trust: 40,
      lastLine: null,
      lastTone: null,
      hasOfferFood: false,
    });
    btn("calmar").click();
    btn("ofrecer").click();
    expect(seen).toEqual([]);
    panel.sync({
      open: true,
      targetId: "poss-1",
      trust: 70,
      lastLine: null,
      lastTone: null,
      hasOfferFood: true,
    });
    btn("calmar").click();
    expect(seen).toEqual(["calmar"]);
    panel.dispose();
  });
});
