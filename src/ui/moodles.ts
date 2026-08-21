/**
 * Moodles HUD: pills glass técnicas (Skills P1) junto al panel #hud.
 * Solo DOM; umbrales en actors/moodles. Glifo = SVG (`moodleIconSvg`);
 * MoodleView.glyph unicode se conserva headless para tests.
 */

import type { MoodleView } from "../actors/moodles";
import { moodleIconSvg } from "./moodleIcons";

export interface MoodlesHud {
  sync(moodles: ReadonlyArray<MoodleView>): void;
  /** HAS MUERTO / F9 load-muerto: quita las pills. Ya oculto = no-op. */
  hide(): void;
  dispose(): void;
}

/**
 * HAS MUERTO / F9 load-muerto: no pintar #moodles junto a HAS MUERTO.
 * Vivo (incl. F9 load-vivo): showing igual que hoy.
 * Ya vacío (showing false) = hidden; gameOver no inventa pills.
 */
export function moodlesHudVisible(
  gameOver: boolean,
  showing: boolean,
): boolean {
  if (gameOver) return false;
  return showing;
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

  function clearPills(): void {
    for (const [, el] of pills) el.remove();
    pills.clear();
  }

  return {
    sync(moodles) {
      bar.hidden = false;
      const keep = new Set<string>(moodles.map((m) => m.id));
      for (const [id, el] of [...pills]) {
        if (keep.has(id)) continue;
        el.remove();
        pills.delete(id);
      }
      for (const m of moodles) {
        const el = ensurePill(m);
        el.dataset.level = m.level;
        const glyph = el.querySelector(".moodle-glyph");
        const label = el.querySelector(".moodle-label");
        const val = el.querySelector(".moodle-value");
        if (glyph) {
          glyph.innerHTML = moodleIconSvg(m.id, {
            night: m.id === "clock" && m.glyph === "☾",
          });
        }
        if (label) label.textContent = m.label;
        if (val) val.textContent = String(m.value);
        el.title = `${m.label} ${m.value} (${m.level})`;
      }
    },
    hide() {
      if (bar.hidden && pills.size === 0) return;
      clearPills();
      bar.hidden = true;
    },
    dispose() {
      bar.remove();
      pills.clear();
    },
  };
}
