/**
 * @vitest-environment happy-dom
 */

import { readFileSync } from "node:fs";
import { afterEach, describe, expect, test } from "vitest";
import { buildHudMoodles, clockMoodle } from "../src/actors/moodles";
import { createNeeds } from "../src/actors/needs";
import { createMoodlesHud } from "../src/ui/moodles";

describe("createMoodlesHud", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  test("pills: SVG + labels ES + value; ok/warn/critical en el pill, no el SVG", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createMoodlesHud(root);
    const moodles = buildHudMoodles(
      createNeeds({ hunger: 10, thirst: 50, fatigue: 80 }),
      25,
      true,
      1,
      true,
      10,
    );
    hud.sync(moodles);

    const pills = [...root.querySelectorAll<HTMLElement>(".moodle")];
    expect(pills).toHaveLength(6);

    const expected = [
      { id: "hunger", label: "Hambre", value: "10", level: "ok", snippet: "M6 16.5c.4 7.2" },
      { id: "thirst", label: "Sed", value: "50", level: "warn", snippet: "M16 3.8C16 3.8 8 15.6" },
      { id: "fatigue", label: "Cansancio", value: "80", level: "critical", snippet: "M5.2 14.4c3.4 3.2" },
      { id: "health", label: "Vida", value: "25", level: "critical", snippet: "M13.2 4.2h5.6v8.6h8.6v5.6" },
      { id: "ammo", label: "Balas", value: "1", level: "warn", snippet: "M12.6 27V14.2" },
      { id: "clock", label: "NOC", value: "10", level: "warn", snippet: "M19.8 5.4A10.4" },
    ];

    for (const exp of expected) {
      const el = pills.find((p) => p.dataset.id === exp.id);
      expect(el).toBeTruthy();
      expect(el!.dataset.level).toBe(exp.level);
      expect(el!.querySelector(".moodle-label")?.textContent).toBe(exp.label);
      expect(el!.querySelector(".moodle-value")?.textContent).toBe(exp.value);
      const glyph = el!.querySelector(".moodle-glyph");
      expect(glyph).toBeTruthy();
      const svg = glyph!.querySelector("svg");
      expect(svg).toBeTruthy();
      expect(svg!.getAttribute("aria-hidden")).toBe("true");
      expect(svg!.getAttribute("data-level")).toBeNull();
      expect(svg!.classList.contains("ok")).toBe(false);
      expect(svg!.classList.contains("warn")).toBe(false);
      expect(svg!.classList.contains("critical")).toBe(false);
      expect(glyph!.innerHTML).toContain(exp.snippet);
      expect(el!.textContent).not.toMatch(/[⬡◈◌✚◉☀☾]/);
    }

    hud.dispose();
  });

  test("clock noche vs día: path snippets distintos (happy-dom puede expandir tags)", () => {
    root = document.createElement("div");
    document.body.appendChild(root);
    const hud = createMoodlesHud(root);

    hud.sync([clockMoodle(false, 50)]);
    const dayGlyph = root.querySelector(".moodle-glyph");
    expect(dayGlyph).toBeTruthy();
    expect(dayGlyph!.innerHTML).toContain("M16 3.6v3.4");
    expect(root.querySelector(".moodle-label")?.textContent).toBe("DIA");
    expect(root.querySelector(".moodle")?.dataset.level).toBe("ok");

    hud.sync([clockMoodle(true, 10)]);
    const nightGlyph = root.querySelector(".moodle-glyph");
    expect(nightGlyph).toBeTruthy();
    expect(nightGlyph!.innerHTML).toContain("M19.8 5.4A10.4");
    expect(nightGlyph!.innerHTML).not.toContain("M16 3.6v3.4");
    expect(root.querySelector(".moodle-label")?.textContent).toBe("NOC");

    hud.dispose();
  });
});

describe("F1 lift CSS", () => {
  test("#hud.hud-help ~ #moodles bottom 340px", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    expect(html).toMatch(/#hud\.hud-help\s*~\s*#moodles/);
    expect(html).toMatch(/#hud\.hud-help\s*~\s*#moodles\s*\{\s*bottom:\s*340px;/);
    expect(html).toMatch(/\.moodle-glyph svg\s*\{\s*width:\s*12px;\s*height:\s*12px;/);
  });
});
