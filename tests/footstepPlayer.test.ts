import { describe, expect, test } from "vitest";
import {
  shouldEmitFootstep,
  createFootstepPlayer,
  syncFootstepPlayer,
} from "../src/audio/footstepPlayer";
import { createFootstepsBus, tickFootsteps } from "../src/audio/footstepsStub";

describe("shouldEmitFootstep", () => {
  test("mismo floor → false", () => {
    expect(shouldEmitFootstep(0.1, 0.9)).toBe(false);
    expect(shouldEmitFootstep(1.0, 1.99)).toBe(false);
  });

  test("cruza floor → true", () => {
    expect(shouldEmitFootstep(0.9, 1.0)).toBe(true);
    expect(shouldEmitFootstep(1.99, 2.01)).toBe(true);
    expect(shouldEmitFootstep(0, 1)).toBe(true);
  });

  test("phase no avanza o inválida → false", () => {
    expect(shouldEmitFootstep(2, 2)).toBe(false);
    expect(shouldEmitFootstep(3, 2.5)).toBe(false);
    expect(shouldEmitFootstep(NaN, 1)).toBe(false);
    expect(shouldEmitFootstep(0, Infinity)).toBe(false);
  });

  test("salta varios enteros → true (un emit)", () => {
    expect(shouldEmitFootstep(0.2, 3.1)).toBe(true);
  });
});

describe("createFootstepPlayer / syncFootstepPlayer (headless)", () => {
  test("sin window AudioContext → ctx null; sync no rompe", () => {
    const player = createFootstepPlayer();
    expect(player.ctx).toBeNull();
    expect(player.prevPhase).toBe(0);

    const bus = createFootstepsBus();
    tickFootsteps(bus, { moved: 0.2, sprint: true }, 0.05);
    syncFootstepPlayer(player, bus, { sprint: true });
    expect(player.prevPhase).toBe(bus.phase);
  });

  test("muted → no emite audio pero avanza prevPhase", () => {
    const player = createFootstepPlayer();
    const bus = createFootstepsBus(true);
    tickFootsteps(bus, { moved: 0.5, muted: true }, 0.1);
    const phaseBefore = bus.phase;
    expect(phaseBefore).toBeGreaterThan(0);
    syncFootstepPlayer(player, bus);
    expect(player.prevPhase).toBe(phaseBefore);
  });
});
