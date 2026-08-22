import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  createFootstepsBus,
  resetFootstepsAfterRestart,
  tickFootsteps,
  footstepsLevel,
  footstepsTarget,
  describeFootsteps,
  type FootstepsState,
} from "../src/audio/footstepsStub";
import {
  createFootstepPlayer,
  resetFootstepPlayerAfterRestart,
  shouldEmitFootstep,
} from "../src/audio/footstepPlayer";

function settle(
  bus: ReturnType<typeof createFootstepsBus>,
  state: FootstepsState,
  seconds = 0.5,
): void {
  const steps = 10;
  const dt = seconds / steps;
  for (let i = 0; i < steps; i++) tickFootsteps(bus, state, dt);
}

describe("footstepsTarget", () => {
  test("sin movimiento → 0", () => {
    expect(footstepsTarget({ moved: 0 })).toBe(0);
  });

  test("con movimiento → > 0; sprint ≥ walk", () => {
    const walk = footstepsTarget({ moved: 0.1 });
    const sprint = footstepsTarget({ moved: 0.1, sprint: true });
    expect(walk).toBeGreaterThan(0.3);
    expect(sprint).toBeGreaterThanOrEqual(walk);
  });
});

describe("tickFootsteps / footstepsLevel", () => {
  test("movimiento → level alto; quieto → decae", () => {
    const bus = createFootstepsBus();
    settle(bus, { moved: 0.12 });
    expect(footstepsLevel(bus)).toBeGreaterThan(0.3);

    settle(bus, { moved: 0 }, 1);
    expect(footstepsLevel(bus)).toBeLessThan(0.05);
  });

  test("muted → level 0 y describe null", () => {
    const bus = createFootstepsBus();
    settle(bus, { moved: 0.15 });
    expect(footstepsLevel(bus)).toBeGreaterThan(0.2);
    expect(describeFootsteps(bus)).toBe("pisadas");

    bus.muted = true;
    expect(footstepsLevel(bus)).toBe(0);
    expect(describeFootsteps(bus)).toBeNull();
  });

  test("state.muted sincroniza el bus", () => {
    const bus = createFootstepsBus();
    tickFootsteps(bus, { moved: 0.1, muted: true }, 0.1);
    expect(bus.muted).toBe(true);
    expect(footstepsLevel(bus)).toBe(0);
    tickFootsteps(bus, { moved: 0.1, muted: false }, 0.1);
    expect(bus.muted).toBe(false);
  });

  test("tick es determinista", () => {
    const s: FootstepsState = { moved: 0.08, sprint: true };
    const a = createFootstepsBus();
    const b = createFootstepsBus();
    for (let i = 0; i < 12; i++) {
      tickFootsteps(a, s, 0.05);
      tickFootsteps(b, s, 0.05);
    }
    expect(footstepsLevel(a)).toEqual(footstepsLevel(b));
    expect(a.phase).toEqual(b.phase);
  });

  test('describeFootsteps: "pisadas" / null', () => {
    const moving = createFootstepsBus();
    settle(moving, { moved: 0.1 });
    expect(describeFootsteps(moving)).toBe("pisadas");

    const still = createFootstepsBus();
    settle(still, { moved: 0 });
    expect(describeFootsteps(still)).toBeNull();
  });
});

describe("resetFootstepsAfterRestart (R / softReset)", () => {
  test("reinicio → level 0 + phase 0 + prevPhase 0; stride previo no filtra", () => {
    const boot = createFootstepsBus();
    const bus = createFootstepsBus();
    settle(bus, { moved: 0.15, sprint: true });
    expect(bus.level).toBeGreaterThan(0.3);
    expect(bus.phase).toBeGreaterThan(1);
    expect(footstepsLevel(bus)).toBeGreaterThan(0.3);
    expect(describeFootsteps(bus)).toBe("pisadas");

    const player = createFootstepPlayer();
    player.prevPhase = bus.phase;
    expect(player.prevPhase).toBeGreaterThan(1);
    expect(shouldEmitFootstep(player.prevPhase, bus.phase + 0.05)).toBe(false);

    resetFootstepsAfterRestart(bus);
    resetFootstepPlayerAfterRestart(player);
    expect(bus.level).toBe(0);
    expect(bus.level).toBe(boot.level);
    expect(bus.phase).toBe(0);
    expect(bus.phase).toBe(boot.phase);
    expect(player.prevPhase).toBe(0);
    expect(bus.muted).toBe(false);
    expect(describeFootsteps(bus)).toBeNull();

    const leaked = createFootstepsBus();
    leaked.level = 0.82;
    leaked.phase = 4.2;
    const leakedPlayer = createFootstepPlayer();
    leakedPlayer.prevPhase = 4.2;
    resetFootstepsAfterRestart(leaked);
    resetFootstepPlayerAfterRestart(leakedPlayer);
    expect(leaked.level).toBe(0);
    expect(leaked.level).not.toBe(0.82);
    expect(leaked.phase).toBe(0);
    expect(leaked.phase).not.toBe(4.2);
    expect(leakedPlayer.prevPhase).toBe(0);
    expect(leakedPlayer.prevPhase).not.toBe(4.2);

    tickFootsteps(leaked, { moved: 0.08 }, 0.05);
    expect(leaked.phase).toBeGreaterThan(0);
    expect(leaked.phase).toBeLessThan(1);
    expect(leaked.phase).toBeLessThan(4.2);
    expect(shouldEmitFootstep(leakedPlayer.prevPhase, leaked.phase)).toBe(
      shouldEmitFootstep(0, leaked.phase),
    );
    expect(shouldEmitFootstep(4.2, leaked.phase)).toBe(false);
  });

  test("muted se preserva; tick vivo no usa el helper (igual que hoy)", () => {
    const muted = createFootstepsBus();
    muted.muted = true;
    muted.level = 0.7;
    muted.phase = 3.5;
    resetFootstepsAfterRestart(muted);
    expect(muted.muted).toBe(true);
    expect(muted.level).toBe(0);
    expect(muted.phase).toBe(0);
    expect(footstepsLevel(muted)).toBe(0);
    expect(describeFootsteps(muted)).toBeNull();

    const unmuted = createFootstepsBus(true);
    unmuted.level = 0.4;
    unmuted.phase = 1.2;
    resetFootstepsAfterRestart(unmuted);
    expect(unmuted.muted).toBe(true);
    unmuted.muted = false;
    resetFootstepsAfterRestart(unmuted);
    expect(unmuted.muted).toBe(false);
    expect(unmuted.level).toBe(0);
    expect(unmuted.phase).toBe(0);

    const live = createFootstepsBus();
    tickFootsteps(live, { moved: 0.12, sprint: true }, 0.2);
    expect(live.phase).toBeGreaterThan(0);
    expect(live.level).toBeGreaterThan(0);
    expect(live.phase).not.toBe(createFootstepsBus().phase);
    expect(live.level).not.toBe(createFootstepsBus().level);
  });

  test("Game softReset usa helper; F9 load no toca footsteps; freeze drena R/F9/M", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("resetFootstepsAfterRestart(");
    expect(gameSrc).toContain("resetFootstepPlayerAfterRestart(");
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,2200}resetFootstepsAfterRestart\(this\.footsteps\)/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,2200}resetFootstepPlayerAfterRestart\(this\.footstepPlayer\)/,
    );
    expect(gameSrc).toMatch(
      /resetAmbientAfterRestart\(this\.ambient\);[\s\S]{0,240}resetFootstepsAfterRestart\(this\.footsteps\);[\s\S]{0,80}resetFootstepPlayerAfterRestart\(this\.footstepPlayer\)/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}resetFootstepsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}resetFootstepPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2000}resetFootstepsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2000}resetFootstepPlayerAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}resetFootstepsAfterRestart/,
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
