import { describe, expect, test } from "vitest";
import {
  computeLayerGain,
  shouldBeSilent,
  createAmbientPlayer,
  syncAmbientPlayer,
} from "../src/audio/ambientPlayer";
import {
  createAmbientBus,
  tickAmbient,
  ambientLevels,
  type AmbientState,
} from "../src/audio/ambientStub";

const quiet: AmbientState = {
  raining: false,
  isNight: false,
  indoor: false,
  threatNearby: false,
};

const loud: AmbientState = {
  raining: true,
  isNight: true,
  indoor: true,
  threatNearby: true,
};

function settle(
  bus: ReturnType<typeof createAmbientBus>,
  state: AmbientState,
  seconds = 2,
): void {
  const steps = 20;
  const dt = seconds / steps;
  for (let i = 0; i < steps; i++) tickAmbient(bus, state, dt);
}

describe("computeLayerGain", () => {
  test("muted → 0 aunque level sea 1", () => {
    expect(computeLayerGain("rain", 1, true)).toBe(0);
    expect(computeLayerGain("night", 0.8, true)).toBe(0);
    expect(computeLayerGain("indoor", 0.5, true)).toBe(0);
    expect(computeLayerGain("threat", 1, true)).toBe(0);
  });

  test("level 0 / inválido → 0", () => {
    expect(computeLayerGain("rain", 0, false)).toBe(0);
    expect(computeLayerGain("night", -0.2, false)).toBe(0);
    expect(computeLayerGain("indoor", NaN, false)).toBe(0);
    expect(computeLayerGain("threat", Infinity, false)).toBe(0);
  });

  test("level positivo → gain > 0 y escala lineal", () => {
    const full = computeLayerGain("rain", 1, false);
    const half = computeLayerGain("rain", 0.5, false);
    expect(full).toBeGreaterThan(0);
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(full);
    expect(half).toBeCloseTo(full * 0.5, 8);
  });
});

describe("shouldBeSilent", () => {
  test("muted → true aunque haya niveles", () => {
    expect(
      shouldBeSilent({ rain: 1, night: 1, indoor: 1, threat: 1 }, true),
    ).toBe(true);
  });

  test("todos 0 → true", () => {
    expect(
      shouldBeSilent({ rain: 0, night: 0, indoor: 0, threat: 0 }, false),
    ).toBe(true);
  });

  test("cualquier capa > 0 → false", () => {
    expect(
      shouldBeSilent({ rain: 0.2, night: 0, indoor: 0, threat: 0 }, false),
    ).toBe(false);
    expect(
      shouldBeSilent({ rain: 0, night: 0.3, indoor: 0, threat: 0 }, false),
    ).toBe(false);
  });
});

describe("createAmbientPlayer / syncAmbientPlayer (headless)", () => {
  test("sin window AudioContext → ctx null; lazy no abre; sync no rompe", () => {
    const player = createAmbientPlayer();
    expect(player.ctx).toBeNull();
    expect(player.voices).toBeNull();

    const bus = createAmbientBus();
    settle(bus, loud);
    expect(ambientLevels(bus).rain).toBeGreaterThan(0);
    expect(shouldBeSilent(ambientLevels(bus), bus.muted)).toBe(false);

    syncAmbientPlayer(player, bus);
    expect(player.ctx).toBeNull();
    expect(player.voices).toBeNull();
  });

  test("silencio / mute → no crea ctx; gains lógicos 0", () => {
    const player = createAmbientPlayer();
    const quietBus = createAmbientBus();
    settle(quietBus, quiet);
    expect(shouldBeSilent(ambientLevels(quietBus), quietBus.muted)).toBe(true);
    syncAmbientPlayer(player, quietBus);
    expect(player.ctx).toBeNull();

    const muted = createAmbientBus();
    settle(muted, loud);
    muted.muted = true;
    expect(shouldBeSilent(ambientLevels(muted), muted.muted)).toBe(true);
    for (const layer of ["rain", "night", "indoor", "threat"] as const) {
      expect(computeLayerGain(layer, muted.levels[layer], muted.muted)).toBe(0);
    }
    syncAmbientPlayer(player, muted);
    expect(player.ctx).toBeNull();
  });
});
