import { describe, expect, test } from "vitest";
import { moodleIconSvg } from "../src/ui/moodleIcons";

const IDS = ["hunger", "thirst", "fatigue", "health", "ammo", "clock"] as const;

describe("moodleIconSvg", () => {
  test("cada id conocido devuelve markup <svg no vacío", () => {
    for (const id of IDS) {
      const markup = moodleIconSvg(id);
      expect(markup).toBeTruthy();
      expect(markup.length).toBeGreaterThan(0);
      expect(markup).toContain("<svg");
      expect(markup).toContain('viewBox="0 0 32 32"');
      expect(markup).toContain("#e8c36a");
      expect(markup).toContain('aria-hidden="true"');
    }
  });

  test("clock día vs noche son distintos; night false = día", () => {
    const day = moodleIconSvg("clock");
    const night = moodleIconSvg("clock", { night: true });
    const dayFalse = moodleIconSvg("clock", { night: false });
    expect(day).toContain("<svg");
    expect(night).toContain("<svg");
    expect(day).not.toBe(night);
    expect(dayFalse).toBe(day);
    expect(day).toContain("M16 3.6v3.4");
    expect(night).toContain("M19.8 5.4A10.4");
    expect(night).not.toContain("M16 3.6v3.4");
  });

  test("id desconocido / vacío → fallback diamante, no vacío", () => {
    const unknown = moodleIconSvg("not_a_moodle");
    const emptyId = moodleIconSvg("");
    expect(unknown).toContain("<svg");
    expect(unknown.length).toBeGreaterThan(0);
    expect(emptyId).toBe(unknown);
    expect(moodleIconSvg("???")).toBe(unknown);
    expect(unknown).not.toBe(moodleIconSvg("hunger"));
    expect(unknown).toMatch(/d="M16 3.5/);
  });

  test("thirst usa fill agua; hunger no", () => {
    expect(moodleIconSvg("thirst")).toContain("rgba(91, 159, 212, 0.5)");
    expect(moodleIconSvg("hunger")).not.toContain("rgba(91, 159, 212, 0.5)");
  });

  test("cada id tiene path distintivo", () => {
    expect(moodleIconSvg("hunger")).toContain("M6 16.5c.4 7.2");
    expect(moodleIconSvg("thirst")).toContain("M16 3.8C16 3.8 8 15.6");
    expect(moodleIconSvg("fatigue")).toContain("M5.2 14.4c3.4 3.2");
    expect(moodleIconSvg("health")).toContain("M13.2 4.2h5.6v8.6h8.6v5.6");
    expect(moodleIconSvg("ammo")).toContain("M12.6 27V14.2");
  });
});
