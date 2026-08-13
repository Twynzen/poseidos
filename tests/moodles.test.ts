import { describe, expect, test } from "vitest";
import {
  AMMO_CRITICAL,
  AMMO_WARN,
  NEED_CRITICAL,
  NEED_WARN,
  HP_CRITICAL,
  HP_WARN,
  ammoMoodle,
  buildHudMoodles,
  buildMoodles,
  moodleLevelForAmmo,
  moodleLevelForHealth,
  moodleLevelForNeed,
} from "../src/actors/moodles";
import { createNeeds } from "../src/actors/needs";

describe("moodle thresholds (needs)", () => {
  test("ok / warn / critical por umbrales", () => {
    expect(moodleLevelForNeed(0)).toBe("ok");
    expect(moodleLevelForNeed(NEED_WARN - 1)).toBe("ok");
    expect(moodleLevelForNeed(NEED_WARN)).toBe("warn");
    expect(moodleLevelForNeed(NEED_CRITICAL - 1)).toBe("warn");
    expect(moodleLevelForNeed(NEED_CRITICAL)).toBe("critical");
    expect(moodleLevelForNeed(100)).toBe("critical");
  });
});

describe("moodle thresholds (HP)", () => {
  test("ok / warn / critical invertidos vs needs", () => {
    expect(moodleLevelForHealth(100)).toBe("ok");
    expect(moodleLevelForHealth(HP_WARN + 1)).toBe("ok");
    expect(moodleLevelForHealth(HP_WARN)).toBe("warn");
    expect(moodleLevelForHealth(HP_CRITICAL + 1)).toBe("warn");
    expect(moodleLevelForHealth(HP_CRITICAL)).toBe("critical");
    expect(moodleLevelForHealth(0)).toBe("critical");
  });
});

describe("moodle thresholds (ammo)", () => {
  test("ok / warn / critical invertidos vs needs", () => {
    expect(moodleLevelForAmmo(8)).toBe("ok");
    expect(moodleLevelForAmmo(AMMO_WARN + 1)).toBe("ok");
    expect(moodleLevelForAmmo(AMMO_WARN)).toBe("warn");
    expect(moodleLevelForAmmo(AMMO_CRITICAL + 1)).toBe("warn");
    expect(moodleLevelForAmmo(AMMO_CRITICAL)).toBe("critical");
    expect(moodleLevelForAmmo(0)).toBe("critical");
  });
});

describe("ammoMoodle", () => {
  test("null sin pistola", () => {
    expect(ammoMoodle(false, 8)).toBeNull();
    expect(ammoMoodle(false, 0)).toBeNull();
  });

  test("BAL con pistola y qty", () => {
    const m = ammoMoodle(true, 8);
    expect(m).not.toBeNull();
    expect(m!.id).toBe("ammo");
    expect(m!.label).toBe("BAL");
    expect(m!.glyph).toBe("◉");
    expect(m!.value).toBe(8);
    expect(m!.level).toBe("ok");
  });
});

describe("buildMoodles", () => {
  test("cuatro pills con labels técnicos y niveles", () => {
    const m = buildMoodles(
      createNeeds({ hunger: 10, thirst: 50, fatigue: 80 }),
      25,
    );
    expect(m).toHaveLength(4);
    expect(m.map((x) => x.id)).toEqual([
      "hunger",
      "thirst",
      "fatigue",
      "health",
    ]);
    expect(m[0]!.level).toBe("ok");
    expect(m[1]!.level).toBe("warn");
    expect(m[2]!.level).toBe("critical");
    expect(m[3]!.level).toBe("critical");
    expect(m[0]!.label).toBe("HMB");
    expect(m[3]!.label).toBe("HP");
    expect(m[3]!.value).toBe(25);
  });
});

describe("buildHudMoodles", () => {
  const needs = createNeeds({ hunger: 10, thirst: 50, fatigue: 80 });

  test("4 pills sin pistola", () => {
    const m = buildHudMoodles(needs, 25, false, 8);
    expect(m).toHaveLength(4);
    expect(m.map((x) => x.id)).not.toContain("ammo");
  });

  test("5 pills con pistola + BAL", () => {
    const m = buildHudMoodles(needs, 25, true, 1);
    expect(m).toHaveLength(5);
    expect(m.map((x) => x.id)).toEqual([
      "hunger",
      "thirst",
      "fatigue",
      "health",
      "ammo",
    ]);
    expect(m[4]!.label).toBe("BAL");
    expect(m[4]!.glyph).toBe("◉");
    expect(m[4]!.value).toBe(1);
    expect(m[4]!.level).toBe("warn");
  });
});
