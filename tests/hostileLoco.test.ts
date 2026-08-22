import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { AnimationClip, Group, VectorKeyframeTrack } from "three";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { bindMixer } from "../src/render/characterMixer";
import { PLAYER_SOLDIER_MANIFEST } from "../src/render/characterManifest";
import type { LoadedCharacterGltf } from "../src/render/characterGltf";
import {
  HOSTILE_LOCO_BOB_AMP,
  HOSTILE_LOCO_IDLE_DIST,
  HOSTILE_LOCO_RUN_SPEED,
  hostileIdleApplies,
  hostileLocoFromDelta,
  hostileMixerDt,
} from "../src/render/hostileLoco";

function fakeClip(name: string): AnimationClip {
  const track = new VectorKeyframeTrack(".position", [0, 1], [0, 0, 0, 0, 0, 0]);
  return new AnimationClip(name, 1, [track]);
}

function fakeLoaded(names: string[]): LoadedCharacterGltf {
  const scene = new Group();
  const animations = names.map(fakeClip);
  return {
    root: scene,
    scene,
    animations,
    clipNames: names,
  };
}

describe("hostileLocoFromDelta", () => {
  test("quieto o micro-jitter → idle", () => {
    expect(hostileLocoFromDelta(0, 0, 1 / 60)).toBe("idle");
    expect(hostileLocoFromDelta(HOSTILE_LOCO_IDLE_DIST, 0, 1 / 60)).toBe(
      "idle",
    );
    expect(
      hostileLocoFromDelta(HOSTILE_LOCO_IDLE_DIST / Math.SQRT2, HOSTILE_LOCO_IDLE_DIST / Math.SQRT2, 0.016),
    ).toBe("idle");
  });

  test("walk bajo umbral de run", () => {
    const dt = 1 / 60;
    // speed = 2.4 < 3.5
    const dist = 2.4 * dt;
    expect(hostileLocoFromDelta(dist, 0, dt)).toBe("walk");
    expect(hostileLocoFromDelta(0, dist, dt)).toBe("walk");
  });

  test("run cuando speed ≥ RUN_SPEED", () => {
    const dt = 1 / 60;
    const dist = HOSTILE_LOCO_RUN_SPEED * dt;
    expect(hostileLocoFromDelta(dist, 0, dt)).toBe("run");
    expect(hostileLocoFromDelta(dist * 1.1, 0, dt)).toBe("run");
  });

  test("dt≤0 / no finito → idle (sin división)", () => {
    expect(hostileLocoFromDelta(1, 0, 0)).toBe("idle");
    expect(hostileLocoFromDelta(1, 0, -0.01)).toBe("idle");
    expect(hostileLocoFromDelta(1, 0, Number.NaN)).toBe("idle");
    expect(hostileLocoFromDelta(1, 0, Number.POSITIVE_INFINITY)).toBe("idle");
  });

  test("dx/dz no finitos se tratan como 0", () => {
    // NaN + 1 → dist 1 → run a 10 u/s
    expect(hostileLocoFromDelta(Number.NaN, 1, 0.1)).toBe("run");
    expect(hostileLocoFromDelta(Number.NaN, Number.NaN, 0.1)).toBe("idle");
  });

  test("constantes coherentes", () => {
    expect(HOSTILE_LOCO_IDLE_DIST).toBe(0.02);
    expect(HOSTILE_LOCO_RUN_SPEED).toBe(3.5);
  });

  test("sin bob/lean/sway — lock HOSTILE_LOCO_BOB_AMP 0; clasifica igual", () => {
    expect(HOSTILE_LOCO_BOB_AMP).toBe(0);
    expect(HOSTILE_LOCO_IDLE_DIST).toBe(0.02);
    expect(HOSTILE_LOCO_RUN_SPEED).toBe(3.5);
    const locoSrc = readFileSync(
      resolve(process.cwd(), "src/render/hostileLoco.ts"),
      "utf8",
    );
    expect(locoSrc).not.toMatch(/LEAN_AMP|SWAY_AMP|WALK_BOB|IDLE_BOB|SPRINT_BOB/);
    expect(locoSrc).not.toMatch(/from ["']\.\/locoBob["']/);
    const view = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    const start = view.indexOf("syncHostiles(entities");
    expect(start).toBeGreaterThan(-1);
    const hostiles = view.slice(start, view.indexOf("syncDoor(tx", start));
    expect(hostiles).toMatch(/hostileLocoFromDelta/);
    expect(hostiles).not.toMatch(/tickLocoBob|bobY|HOSTILE_LOCO_BOB_AMP|locoBob/);
    expect(existsSync(resolve(process.cwd(), "src/render/hostileBob.ts"))).toBe(
      false,
    );
  });
});

describe("hostileIdleApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: no aplica; load-muerto no; vivo/load-vivo sí", () => {
    expect(hostileIdleApplies(true)).toBe(false);
    expect(hostileIdleApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(hostileIdleApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(hostileIdleApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver no avanza mixer Idle; vivo sí; dt<=0 no-op", () => {
    expect(hostileMixerDt(0.05, true)).toBe(0);
    expect(hostileMixerDt(0.05, false)).toBe(0.05);
    expect(hostileMixerDt(0, false)).toBe(0);
    expect(hostileMixerDt(-1, false)).toBe(0);
    expect(hostileMixerDt(Number.NaN, false)).toBe(0);

    const handle = bindMixer(
      fakeLoaded(["Idle", "Walk", "Run"]),
      PLAYER_SOLDIER_MANIFEST,
    );
    expect(handle).not.toBeNull();
    handle!.syncFromAnimator("idle");
    expect(handle!.activeRole).toBe("idle");
    expect(handle!.activeClipName).toBe("Idle");
    handle!.update(0.05, "idle");
    expect(handle!.activeActionTime).toBeGreaterThan(0);
    const frozen = handle!.activeActionTime;

    handle!.update(hostileMixerDt(0.05, true), "idle");
    expect(handle!.activeRole).toBe("idle");
    expect(handle!.activeActionTime).toBe(frozen);

    handle!.update(0.05, "idle");
    const advanced = handle!.activeActionTime;
    expect(advanced).toBeGreaterThan(frozen);
    handle!.update(hostileMixerDt(0.05, false), "idle");
    expect(handle!.activeRole).toBe("idle");
    expect(handle!.activeActionTime).toBeGreaterThan(advanced);

    const still = handle!.activeActionTime;
    handle!.update(hostileMixerDt(0, false), "idle");
    expect(handle!.activeActionTime).toBe(still);
    handle!.update(hostileMixerDt(-1, false), "idle");
    expect(handle!.activeActionTime).toBe(still);
    handle!.update(hostileMixerDt(Number.NaN, false), "idle");
    expect(handle!.activeActionTime).toBe(still);
    handle!.dispose();
  });

  test("Game freeze / enterGameOver / F9 load-muerto congelan Idle; vivo tickea; mixer death se queda", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("hostileIdleApplies(");
    expect(src).toMatch(
      /syncHostileView\(dt = 0\): void \{[\s\S]{0,480}hostileIdleApplies\(\s*this\.gameOver\) \? dt : 0/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,1400}this\.syncHostileView\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,800}this\.syncHostileView\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.syncHostileView\(dt\)/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.view\.syncHostiles\([\s\S]{0,200}\bdt\b/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeLoad\(\)/,
    );
    expect(src).toMatch(
      /Mixer must keep ticking during freeze[\s\S]{0,160}this\.view\.tickPlayerLoco\(dt, false, false\)/,
    );

    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("hostileIdleApplies(");
    expect(viewSrc).toContain("hostileMixerDt(");
    expect(viewSrc).toContain("mixer.update(safeDt, currentRole(anim))");
    expect(viewSrc).toContain("mesh.visible = e.visible");
    expect(viewSrc).toContain(
      "playerMixer.update(dt, currentRole(playerAnimator))",
    );
    expect(viewSrc).not.toMatch(
      /if \(hostileIdleApplies\(gameOver\)\) \{[\s\S]{0,400}mesh\.visible = false/,
    );
  });
});
