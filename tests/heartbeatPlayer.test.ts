import { describe, expect, test } from "vitest";
import {
  heartbeatBeepSpec,
  shouldPlayHeartbeatSfx,
  createHeartbeatPlayer,
  playHeartbeat,
} from "../src/audio/heartbeatPlayer";

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

    playHeartbeat(player, false);
    expect(player.ctx).toBeNull();
  });

  test("mute → no-op; no crea ctx", () => {
    const player = createHeartbeatPlayer();
    playHeartbeat(player, true);
    expect(player.ctx).toBeNull();
    expect(shouldPlayHeartbeatSfx(true)).toBe(false);
  });
});
