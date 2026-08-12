/**
 * Moodles HUD: pills glass técnicas (Skills P1) junto al panel #hud.
 * Solo DOM; umbrales en actors/moodles.
 */

import type { MoodleView } from "../actors/moodles";

export interface MoodlesHud {
  sync(moodles: ReadonlyArray<MoodleView>): void;
  dispose(): void;
}

export function createMoodlesHud(root: HTMLElement): MoodlesHud {
  const bar = document.createElement("div");
  bar.id = "moodles";
  bar.setAttribute("aria-label", "Estado de needs");
  root.appendChild(bar);

  const pills = new Map<string, HTMLElement>();

  function ensurePill(m: MoodleView): HTMLElement {
    let el = pills.get(m.id);
    if (el) return el;
    el = document.createElement("div");
    el.className = "moodle";
    el.dataset.id = m.id;
    const glyph = document.createElement("span");
    glyph.className = "moodle-glyph";
    const label = document.createElement("span");
    label.className = "moodle-label";
    const val = document.createElement("span");
    val.className = "moodle-value";
    el.append(glyph, label, val);
    bar.appendChild(el);
    pills.set(m.id, el);
    return el;
  }

  return {
    sync(moodles) {
      for (const m of moodles) {
        const el = ensurePill(m);
        el.dataset.level = m.level;
        const glyph = el.querySelector(".moodle-glyph");
        const label = el.querySelector(".moodle-label");
        const val = el.querySelector(".moodle-value");
        if (glyph) glyph.textContent = m.glyph;
        if (label) label.textContent = m.label;
        if (val) val.textContent = String(m.value);
        el.title = `${m.label} ${m.value} (${m.level})`;
      }
    },
    dispose() {
      bar.remove();
      pills.clear();
    },
  };
}
