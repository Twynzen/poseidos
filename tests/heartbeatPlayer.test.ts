import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  heartbeatBeepSpec,
  shouldPlayHeartbeatSfx,
  createHeartbeatPlayer,
  heartbeatBeepsAfterRestart,
  heartbeatPlayerScheduled,
  resetHeartbeatPlayerAfterRestart,
  playHeartbeat,
  type HeartbeatPlayer,
  type HeartbeatVoice,
} from "../src/audio/heartbeatPlayer";
import {
  createAmbientBus,
  toggleAmbientMute,
} from "../src/audio/ambientStub";

describe("heartbeatBeepSpec", () => {
  test("~55Hz sine 80ms, gain 0.08", () => {
    expect(heartbeatBeepSpec()).toEqual({
      hz: 55,
      type: "sine",
      durationSec: 0.08,
      gain: 0.08,
    });
  });
});

describe("shouldPlayHeartbeatSfx", () => {
  test("unmuted → true", () => {
    expect(shouldPlayHeartbeatSfx(false)).toBe(true);
  });

  test("muted → false", () => {
    expect(shouldPlayHeartbeatSfx(true)).toBe(false);
  });
});

describe("createHeartbeatPlayer / playHeartbeat (headless)", () => {
  test("sin window AudioContext → ctx null; lazy no abre; play no rompe", () => {
    const player = createHeartbeatPlayer();
    expect(player.ctx).toBeNull();
    expect(player.voices).toEqual([]);

    playHeartbeat(player, false);
    expect(player.ctx).toBeNull();
  });

  test("mute → no-op; no crea ctx", () => {
    const player = createHeartbeatPlayer();
    playHeartbeat(player, true);
    expect(player.ctx).toBeNull();
    expect(heartbeatPlayerScheduled(player)).toBe(0);
    expect(shouldPlayHeartbeatSfx(true)).toBe(false);
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

function leftoverVoice(gainValue = 0.08): HeartbeatVoice {
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

function playerWithLeftover(count: number): HeartbeatPlayer {
  return {
    ctx: null,
    voices: Array.from({ length: count }, () => leftoverVoice()),
  };
}

describe("resetHeartbeatPlayerAfterRestart (R / softReset)", () => {
  test("reinicio corta beep leftover; sine previo no filtra el barrio nuevo", () => {
    const boot = createHeartbeatPlayer();
    expect(boot.ctx).toBeNull();
    expect(boot.voices).toEqual([]);
    expect(heartbeatPlayerScheduled(boot)).toBe(0);
    expect(heartbeatBeepsAfterRestart()).toBe(0);

    playHeartbeat(boot, false);
    expect(boot.ctx).toBeNull();
    expect(heartbeatPlayerScheduled(boot)).toBe(1);
    expect(heartbeatBeepSpec()).toEqual({
      hz: 55,
      type: "sine",
      durationSec: 0.08,
      gain: 0.08,
    });
    expect(heartbeatPlayerScheduled(boot)).not.toBe(heartbeatBeepsAfterRestart());

    resetHeartbeatPlayerAfterRestart(boot);
    expect(heartbeatPlayerScheduled(boot)).toBe(heartbeatBeepsAfterRestart());
    expect(boot.voices).toEqual([]);
    expect(boot.ctx).toBeNull();

    const leftover = playerWithLeftover(1);
    const beatOsc = leftover.voices[0]?.osc as unknown as { stopCalls: number };
    const beatGain = leftover.voices[0]?.gain?.gain;
    expect(beatOsc.stopCalls).toBe(0);
    expect(beatGain?.value).toBe(0.08);

    resetHeartbeatPlayerAfterRestart(leftover);
    expect(heartbeatPlayerScheduled(leftover)).toBe(heartbeatBeepsAfterRestart());
    expect(beatOsc.stopCalls).toBe(1);
    expect(beatGain?.value).toBe(0);
    expect(leftover.ctx).toBeNull();

    const lazy = createHeartbeatPlayer();
    resetHeartbeatPlayerAfterRestart(lazy);
    expect(lazy.ctx).toBeNull();
    expect(lazy.voices).toEqual([]);
    expect(heartbeatPlayerScheduled(lazy)).toBe(0);
  });

  test("muted se preserva; tick vivo / playHeartbeat no usa el helper (igual que hoy)", () => {
    const bus = createAmbientBus();
    bus.muted = true;
    const player = playerWithLeftover(1);
    expect(heartbeatPlayerScheduled(player)).toBe(1);

    resetHeartbeatPlayerAfterRestart(player);
    expect(bus.muted).toBe(true);
    expect(heartbeatPlayerScheduled(player)).toBe(heartbeatBeepsAfterRestart());
    expect(toggleAmbientMute(bus)).toBe(false);
    resetHeartbeatPlayerAfterRestart(player);
    expect(bus.muted).toBe(false);
    expect(heartbeatPlayerScheduled(player)).toBe(0);

    const live = createHeartbeatPlayer();
    playHeartbeat(live, false);
    expect(live.ctx).toBeNull();
    expect(heartbeatPlayerScheduled(live)).toBe(1);
    expect(shouldPlayHeartbeatSfx(false)).toBe(true);
  });

  test("Game softReset usa helper; F9 load no toca player; freeze drena R/F9/M", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("resetHeartbeatPlayerAfterRestart(");
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,4100}resetHeartbeatPlayerAfterRestart\(this\.heartbeatPlayer\)/,
    );
    expect(gameSrc).toMatch(
      /this\.isoFrustum = isoFrustumAfterRestart\(\);[\s\S]{0,240}resetHeartbeatPlayerAfterRestart\(this\.heartbeatPlayer\)/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}resetHeartbeatPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2000}resetHeartbeatPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}resetHeartbeatPlayerAfterRestart/,
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
