import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  shouldEmitFootstep,
  createFootstepPlayer,
  footstepBeepsAfterRestart,
  footstepPlayerScheduled,
  resetFootstepPlayerAfterRestart,
  syncFootstepPlayer,
  type FootstepPlayer,
  type FootstepVoice,
} from "../src/audio/footstepPlayer";
import {
  createFootstepsBus,
  resetFootstepsAfterRestart,
  tickFootsteps,
} from "../src/audio/footstepsStub";

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
    expect(player.voices).toEqual([]);

    const bus = createFootstepsBus();
    tickFootsteps(bus, { moved: 0.2, sprint: true }, 0.05);
    syncFootstepPlayer(player, bus, { sprint: true });
    expect(player.prevPhase).toBe(bus.phase);
    expect(footstepPlayerScheduled(player)).toBe(0);
  });

  test("muted → no emite audio pero avanza prevPhase", () => {
    const player = createFootstepPlayer();
    const bus = createFootstepsBus(true);
    tickFootsteps(bus, { moved: 0.5, muted: true }, 0.1);
    const phaseBefore = bus.phase;
    expect(phaseBefore).toBeGreaterThan(0);
    syncFootstepPlayer(player, bus);
    expect(player.prevPhase).toBe(phaseBefore);
    expect(footstepPlayerScheduled(player)).toBe(0);
  });
});

function mockParam(value: number) {
  return {
    value,
    cancelScheduledValues() {},
    setValueAtTime(v: number) {
      this.value = v;
    },
  };
}

function leftoverVoice(gainValue = 0.07): FootstepVoice {
  let stopCalls = 0;
  return {
    osc: {
      get stopCalls() {
        return stopCalls;
      },
      stop() {
        stopCalls += 1;
      },
      disconnect() {},
    } as unknown as OscillatorNode,
    gain: {
      gain: mockParam(gainValue),
      disconnect() {},
    } as unknown as GainNode,
  };
}

function playerWithLeftover(count: number, prevPhase = 0): FootstepPlayer {
  return {
    ctx: null,
    prevPhase,
    voices: Array.from({ length: count }, () => leftoverVoice()),
  };
}

describe("resetFootstepPlayerAfterRestart (R / softReset)", () => {
  test("reinicio → prevPhase 0; stride previo no filtra el primer paso", () => {
    const boot = createFootstepPlayer();
    const bus = createFootstepsBus();
    const player = createFootstepPlayer();
    tickFootsteps(bus, { moved: 0.4, sprint: true }, 0.2);
    syncFootstepPlayer(player, bus, { sprint: true });
    expect(bus.phase).toBeGreaterThan(1);
    expect(player.prevPhase).toBe(bus.phase);
    expect(player.prevPhase).toBeGreaterThan(boot.prevPhase);

    resetFootstepsAfterRestart(bus);
    resetFootstepPlayerAfterRestart(player);
    expect(player.prevPhase).toBe(0);
    expect(player.prevPhase).toBe(boot.prevPhase);
    expect(bus.phase).toBe(0);
    expect(player.voices).toEqual([]);
    expect(footstepPlayerScheduled(player)).toBe(footstepBeepsAfterRestart());

    tickFootsteps(bus, { moved: 0.08 }, 0.05);
    expect(shouldEmitFootstep(player.prevPhase, bus.phase)).toBe(
      shouldEmitFootstep(0, bus.phase),
    );
    expect(shouldEmitFootstep(4.2, bus.phase)).toBe(false);
    syncFootstepPlayer(player, bus);
    expect(player.prevPhase).toBe(bus.phase);
    expect(player.prevPhase).toBeGreaterThan(0);
    expect(player.prevPhase).toBeLessThan(1);
  });

  test("reinicio corta beep leftover; sine previo no filtra el barrio nuevo", () => {
    const boot = createFootstepPlayer();
    expect(boot.ctx).toBeNull();
    expect(boot.voices).toEqual([]);
    expect(boot.prevPhase).toBe(0);
    expect(footstepPlayerScheduled(boot)).toBe(0);
    expect(footstepBeepsAfterRestart()).toBe(0);

    const leftover = playerWithLeftover(1, 4.2);
    const strideOsc = leftover.voices[0]?.osc as unknown as { stopCalls: number };
    const strideGain = leftover.voices[0]?.gain?.gain;
    expect(strideOsc.stopCalls).toBe(0);
    expect(strideGain?.value).toBe(0.07);
    expect(leftover.prevPhase).toBe(4.2);
    expect(footstepPlayerScheduled(leftover)).toBe(1);
    expect(footstepPlayerScheduled(leftover)).not.toBe(footstepBeepsAfterRestart());

    resetFootstepPlayerAfterRestart(leftover);
    expect(footstepPlayerScheduled(leftover)).toBe(footstepBeepsAfterRestart());
    expect(leftover.voices).toEqual([]);
    expect(leftover.prevPhase).toBe(0);
    expect(leftover.prevPhase).toBe(boot.prevPhase);
    expect(strideOsc.stopCalls).toBe(1);
    expect(strideGain?.value).toBe(0);
    expect(leftover.ctx).toBeNull();

    const empty = createFootstepPlayer();
    resetFootstepPlayerAfterRestart(empty);
    expect(empty.ctx).toBeNull();
    expect(empty.voices).toEqual([]);
    expect(empty.prevPhase).toBe(0);
    expect(footstepPlayerScheduled(empty)).toBe(0);
  });

  test("muted se preserva; tick vivo / stride no usa el helper (igual que hoy)", () => {
    const bus = createFootstepsBus();
    bus.muted = true;
    bus.level = 0.7;
    bus.phase = 3.5;
    const player = playerWithLeftover(1, 3.5);
    expect(footstepPlayerScheduled(player)).toBe(1);

    resetFootstepsAfterRestart(bus);
    resetFootstepPlayerAfterRestart(player);
    expect(bus.muted).toBe(true);
    expect(bus.level).toBe(0);
    expect(bus.phase).toBe(0);
    expect(player.prevPhase).toBe(0);
    expect(footstepPlayerScheduled(player)).toBe(footstepBeepsAfterRestart());

    bus.muted = false;
    resetFootstepsAfterRestart(bus);
    resetFootstepPlayerAfterRestart(player);
    expect(bus.muted).toBe(false);
    expect(footstepPlayerScheduled(player)).toBe(0);

    const live = createFootstepPlayer();
    const liveBus = createFootstepsBus();
    tickFootsteps(liveBus, { moved: 0.12, sprint: true }, 0.2);
    syncFootstepPlayer(live, liveBus, { sprint: true });
    expect(live.ctx).toBeNull();
    expect(live.prevPhase).toBe(liveBus.phase);
    expect(live.prevPhase).toBeGreaterThan(0);
    expect(footstepPlayerScheduled(live)).toBe(0);
  });

  test("Game softReset usa helper; F9 load no toca player; freeze drena R/F9/M", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("resetFootstepPlayerAfterRestart(");
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,2800}resetFootstepPlayerAfterRestart\(this\.footstepPlayer\)/,
    );
    expect(gameSrc).toMatch(
      /resetFootstepsAfterRestart\(this\.footsteps\);[\s\S]{0,80}resetFootstepPlayerAfterRestart\(this\.footstepPlayer\)/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}resetFootstepPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2000}resetFootstepPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}resetFootstepPlayerAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeLoad\(\)/,
    );
  });
});
