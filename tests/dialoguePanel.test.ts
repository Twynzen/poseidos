/**
 * @vitest-environment happy-dom
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  createDialoguePanel,
  formatGateLine,
} from "../src/ui/dialoguePanel";

describe("dialogue panel CSS", () => {
  test("#dialogue-panel font 13.5px", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toMatch(/#dialogue-panel\s*\{[^}]*font:\s*13\.5px\/1\.5/s);
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
