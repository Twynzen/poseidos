import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  createAmbientBus,
  tickAmbient,
  ambientLevels,
  ambientTargets,
  describeAmbient,
  toggleAmbientMute,
  muteHudMsg,
  MUTE_HUD_MSG,
  SOUND_HUD_MSG,
  type AmbientState,
} from "../src/audio/ambientStub";

function settle(
  bus: ReturnType<typeof createAmbientBus>,
  state: AmbientState,
  seconds = 2,
): void {
  // Varios ticks cortos = mismo resultado determinista que un dt largo (lerp exp).
  const steps = 20;
  const dt = seconds / steps;
  for (let i = 0; i < steps; i++) tickAmbient(bus, state, dt);
}

const dayClearOutdoor: AmbientState = {
  raining: false,
  isNight: false,
  indoor: false,
  threatNearby: false,
};

describe("ambientTargets", () => {
  test("rain outdoor alto; indoor atenúa", () => {
    const out = ambientTargets({
      ...dayClearOutdoor,
      raining: true,
      indoor: false,
    });
    const inn = ambientTargets({
      ...dayClearOutdoor,
      raining: true,
      indoor: true,
    });
    expect(out.rain).toBeGreaterThan(0.7);
    expect(inn.rain).toBeGreaterThan(0);
    expect(inn.rain).toBeLessThan(out.rain);
  });

  test("night outdoor > 0; day ~0", () => {
    const night = ambientTargets({ ...dayClearOutdoor, isNight: true });
    const day = ambientTargets(dayClearOutdoor);
    expect(night.night).toBeGreaterThan(0.2);
    expect(day.night).toBe(0);
  });

  test("threatNearby → threat > 0", () => {
    const t = ambientTargets({ ...dayClearOutdoor, threatNearby: true }, 0);
    expect(t.threat).toBeGreaterThan(0.3);
    const calm = ambientTargets(dayClearOutdoor);
    expect(calm.threat).toBe(0);
  });
});

describe("tickAmbient / ambientLevels", () => {
  test("rain outdoor → rain level alto; indoor → más bajo", () => {
    const a = createAmbientBus();
    settle(a, { ...dayClearOutdoor, raining: true, indoor: false });
    const outdoorRain = ambientLevels(a).rain;
    expect(outdoorRain).toBeGreaterThan(0.7);

    const b = createAmbientBus();
    settle(b, { ...dayClearOutdoor, raining: true, indoor: true });
    expect(ambientLevels(b).rain).toBeGreaterThan(0);
    expect(ambientLevels(b).rain).toBeLessThan(outdoorRain);
  });

  test("night outdoor → night layer > 0; day → ~0", () => {
    const night = createAmbientBus();
    settle(night, { ...dayClearOutdoor, isNight: true });
    expect(ambientLevels(night).night).toBeGreaterThan(0.2);

    const day = createAmbientBus();
    settle(day, dayClearOutdoor);
    expect(ambientLevels(day).night).toBeLessThan(0.05);
  });

  test("threatNearby true → threat > 0", () => {
    const bus = createAmbientBus();
    settle(bus, { ...dayClearOutdoor, threatNearby: true });
    expect(ambientLevels(bus).threat).toBeGreaterThan(0.25);
  });

  test("muted → all levels 0 y describe dice mute", () => {
    const bus = createAmbientBus();
    settle(bus, {
      raining: true,
      isNight: true,
      indoor: true,
      threatNearby: true,
    });
    expect(ambientLevels(bus).rain).toBeGreaterThan(0);
    bus.muted = true;
    const L = ambientLevels(bus);
    expect(L.rain).toBe(0);
    expect(L.night).toBe(0);
    expect(L.indoor).toBe(0);
    expect(L.threat).toBe(0);
    expect(describeAmbient(bus)).toBe("mute");
  });

  test("tick es determinista / estable", () => {
    const s: AmbientState = {
      raining: true,
      isNight: true,
      indoor: false,
      threatNearby: true,
    };
    const a = createAmbientBus();
    const b = createAmbientBus();
    for (let i = 0; i < 15; i++) {
      tickAmbient(a, s, 0.1);
      tickAmbient(b, s, 0.1);
    }
    expect(ambientLevels(a)).toEqual(ambientLevels(b));
    // Un tick extra no explota
    const before = { ...ambientLevels(a) };
    tickAmbient(a, s, 0.1);
    const after = ambientLevels(a);
    for (const k of ["rain", "night", "indoor", "threat"] as const) {
      expect(after[k]).toBeGreaterThanOrEqual(0);
      expect(after[k]).toBeLessThanOrEqual(1);
      expect(Math.abs(after[k] - before[k])).toBeLessThan(0.15);
    }
  });

  test("describeAmbient: lluvia♪ / ♪ / mute", () => {
    const rain = createAmbientBus();
    settle(rain, { ...dayClearOutdoor, raining: true });
    expect(describeAmbient(rain)).toBe("lluvia♪");

    const night = createAmbientBus();
    settle(night, { ...dayClearOutdoor, isNight: true });
    expect(describeAmbient(night)).toBe("♪");

    const silent = createAmbientBus();
    settle(silent, dayClearOutdoor);
    expect(describeAmbient(silent)).toBeNull();

    toggleAmbientMute(silent);
    expect(describeAmbient(silent)).toBe(MUTE_HUD_MSG);
    expect(describeAmbient(silent)).toBe("mute");
  });

  test("muteHudMsg: mute vs sonido según el estado nuevo", () => {
    expect(MUTE_HUD_MSG).toBe("mute");
    expect(SOUND_HUD_MSG).toBe("sonido");
    expect(muteHudMsg(true)).toBe(MUTE_HUD_MSG);
    expect(muteHudMsg(false)).toBe(SOUND_HUD_MSG);
    expect(MUTE_HUD_MSG).not.toBe(SOUND_HUD_MSG);

    const bus = createAmbientBus();
    expect(bus.muted).toBe(false);
    const afterMute = muteHudMsg(toggleAmbientMute(bus));
    expect(bus.muted).toBe(true);
    expect(afterMute).toBe(MUTE_HUD_MSG);
    expect(ambientLevels(bus).rain).toBe(0);
    expect(describeAmbient(bus)).toBe(MUTE_HUD_MSG);

    const afterUnmute = muteHudMsg(toggleAmbientMute(bus));
    expect(bus.muted).toBe(false);
    expect(afterUnmute).toBe(SOUND_HUD_MSG);
    expect(describeAmbient(bus)).not.toBe(MUTE_HUD_MSG);
  });

  test("Game M vivo y muerto asignan lastLootMsg via muteHudMsg (sin lootToast)", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    const assign =
      "this.lastLootMsg = muteHudMsg(toggleAmbientMute(this.ambient))";
    const hits = src.match(
      /this\.lastLootMsg = muteHudMsg\(toggleAmbientMute\(this\.ambient\)\)/g,
    );
    expect(hits?.length).toBe(2);
    expect(src).toContain(assign);
    expect((src.match(/consumeMute\(\)/g) ?? []).length).toBe(2);
    expect(src).not.toMatch(
      /consumeMute\(\)[\s\S]{0,180}lootToast/,
    );
  });
});
