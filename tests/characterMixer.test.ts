import { describe, expect, test } from "vitest";
import { AnimationClip, Group, VectorKeyframeTrack } from "three";
import {
  buildRoleClipMap,
  bindMixer,
  DEFAULT_MIXER_FADE_SEC,
} from "../src/render/characterMixer";
import {
  PLAYER_SOLDIER_MANIFEST,
  PLAYER_SURVIVOR_MANIFEST,
  type CharacterAssetManifest,
} from "../src/render/characterManifest";
import type { LoadedCharacterGltf } from "../src/render/characterGltf";
import {
  createCharacterAnimator,
  currentRole,
  setAction,
  tickCharacterAnimator,
} from "../src/render/characterAnimator";

function fakeClip(name: string): AnimationClip {
  const track = new VectorKeyframeTrack(".position", [0, 0.1], [0, 0, 0, 0, 0, 0]);
  return new AnimationClip(name, 0.1, [track]);
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

describe("buildRoleClipMap (headless)", () => {
  test("mapea idle/walk/run del Soldier si existen", () => {
    const map = buildRoleClipMap(
      ["Idle", "Walk", "Run", "TPose"],
      PLAYER_SOLDIER_MANIFEST,
    );
    expect(map.idle).toBe("Idle");
    expect(map.walk).toBe("Walk");
    expect(map.run).toBe("Run");
    expect(map["primary-attack"]).toBeUndefined();
    expect(map.hit).toBeUndefined();
    expect(map.death).toBeUndefined();
  });

  test("mapea Idle/Walk/Run/Attack/Hit/Death del Survivor si existen", () => {
    const map = buildRoleClipMap(
      ["Idle", "Walk", "Run", "Attack", "Hit", "Death"],
      PLAYER_SURVIVOR_MANIFEST,
    );
    expect(map.idle).toBe("Idle");
    expect(map.walk).toBe("Walk");
    expect(map.run).toBe("Run");
    expect(map["primary-attack"]).toBe("Attack");
    expect(map.hit).toBe("Hit");
    expect(map.death).toBe("Death");
  });

  test("omite roles cuyo clip no esta en el GLB", () => {
    const m: CharacterAssetManifest = {
      id: "partial",
      url: "/models/x.glb",
      roles: { idle: "Idle", walk: "MissingWalk", run: "Run" },
      scale: 1,
      yOffset: 0,
    };
    const map = buildRoleClipMap(["Idle", "Run"], m);
    expect(map.idle).toBe("Idle");
    expect(map.walk).toBeUndefined();
    expect(map.run).toBe("Run");
  });
});

describe("bindMixer", () => {
  test("fade default positivo; sync idle→walk→run cambia clip", () => {
    expect(DEFAULT_MIXER_FADE_SEC).toBeGreaterThan(0);
    const handle = bindMixer(
      fakeLoaded(["Idle", "Walk", "Run", "TPose"]),
      PLAYER_SOLDIER_MANIFEST,
    );
    expect(handle).not.toBeNull();
    handle!.syncFromAnimator("idle");
    expect(handle!.activeRole).toBe("idle");
    expect(handle!.activeClipName).toBe("Idle");
    handle!.update(1 / 60, "walk");
    expect(handle!.activeRole).toBe("walk");
    expect(handle!.activeClipName).toBe("Walk");
    handle!.update(1 / 60, "run");
    expect(handle!.activeRole).toBe("run");
    expect(handle!.activeClipName).toBe("Run");
    handle!.dispose();
  });

  test("sin clips mapeados => null", () => {
    const m: CharacterAssetManifest = {
      id: "none",
      url: "/models/x.glb",
      roles: { idle: "Nope" },
      scale: 1,
      yOffset: 0,
    };
    expect(bindMixer(fakeLoaded(["Idle"]), m)).toBeNull();
  });

  test("clip ausente (Soldier Attack/Hit/Death) = no-op; no cambia activeRole", () => {
    const handle = bindMixer(
      fakeLoaded(["Idle", "Walk", "Run", "TPose"]),
      PLAYER_SOLDIER_MANIFEST,
    );
    expect(handle).not.toBeNull();
    handle!.syncFromAnimator("idle");
    expect(handle!.activeRole).toBe("idle");
    handle!.syncFromAnimator("primary-attack");
    expect(handle!.activeRole).toBe("idle");
    expect(handle!.activeClipName).toBe("Idle");
    handle!.syncFromAnimator("hit");
    expect(handle!.activeRole).toBe("idle");
    expect(handle!.activeClipName).toBe("Idle");
    handle!.syncFromAnimator("death");
    expect(handle!.activeRole).toBe("idle");
    expect(handle!.activeClipName).toBe("Idle");
    handle!.update(1 / 60, "primary-attack");
    expect(handle!.activeRole).toBe("idle");
    handle!.update(1 / 60, "death");
    expect(handle!.activeRole).toBe("idle");
    handle!.dispose();
  });

  test("one-shot presente (Survivor Attack/Hit) se reproduce y reset al re-trigger", () => {
    const handle = bindMixer(
      fakeLoaded(["Idle", "Walk", "Run", "Attack", "Hit", "Death"]),
      PLAYER_SURVIVOR_MANIFEST,
    );
    expect(handle).not.toBeNull();
    handle!.syncFromAnimator("idle");
    handle!.syncFromAnimator("primary-attack");
    expect(handle!.activeRole).toBe("primary-attack");
    expect(handle!.activeClipName).toBe("Attack");
    handle!.update(0.05);
    expect(handle!.activeActionTime).toBeGreaterThan(0);
    const advanced = handle!.activeActionTime;
    handle!.update(0.05, "primary-attack");
    expect(handle!.activeRole).toBe("primary-attack");
    expect(handle!.activeActionTime).toBeGreaterThan(advanced);
    handle!.syncFromAnimator("primary-attack");
    expect(handle!.activeRole).toBe("primary-attack");
    expect(handle!.activeActionTime).toBe(0);
    handle!.syncFromAnimator("hit");
    expect(handle!.activeRole).toBe("hit");
    expect(handle!.activeClipName).toBe("Hit");
    expect(handle!.activeActionTime).toBe(0);
    handle!.update(1 / 60, "walk");
    expect(handle!.activeRole).toBe("walk");
    expect(handle!.activeClipName).toBe("Walk");
    handle!.dispose();
  });

  test("triggerPlayerAction contract: setAction + sync; Soldier no-op, Survivor Attack", () => {
    const soldier = bindMixer(
      fakeLoaded(["Idle", "Walk", "Run"]),
      PLAYER_SOLDIER_MANIFEST,
    )!;
    const survivor = bindMixer(
      fakeLoaded(["Idle", "Walk", "Run", "Attack", "Hit", "Death"]),
      PLAYER_SURVIVOR_MANIFEST,
    )!;
    const animS = createCharacterAnimator();
    const animV = createCharacterAnimator();
    soldier.syncFromAnimator("idle");
    survivor.syncFromAnimator("idle");

    setAction(animS, "primary-attack");
    soldier.syncFromAnimator(currentRole(animS));
    expect(currentRole(animS)).toBe("primary-attack");
    expect(soldier.activeRole).toBe("idle");

    setAction(animV, "hit");
    survivor.syncFromAnimator(currentRole(animV));
    expect(currentRole(animV)).toBe("hit");
    expect(survivor.activeRole).toBe("hit");
    expect(survivor.activeClipName).toBe("Hit");

    tickCharacterAnimator(animV, 1);
    survivor.update(1 / 60, currentRole(animV));
    expect(currentRole(animV)).toBe("idle");
    expect(survivor.activeRole).toBe("idle");

    soldier.dispose();
    survivor.dispose();
  });

  test("death LoopOnce + clampWhenFinished; update no reinicia; clear vuelve a idle", () => {
    const handle = bindMixer(
      fakeLoaded(["Idle", "Walk", "Run", "Attack", "Hit", "Death"]),
      PLAYER_SURVIVOR_MANIFEST,
    );
    expect(handle).not.toBeNull();
    handle!.syncFromAnimator("idle");
    handle!.syncFromAnimator("death");
    expect(handle!.activeRole).toBe("death");
    expect(handle!.activeClipName).toBe("Death");
    handle!.update(0.05, "death");
    expect(handle!.activeRole).toBe("death");
    expect(handle!.activeActionTime).toBeGreaterThan(0);
    const advanced = handle!.activeActionTime;
    handle!.update(0.05, "death");
    expect(handle!.activeActionTime).toBeGreaterThan(advanced);
    handle!.update(1);
    const clamped = handle!.activeActionTime;
    expect(clamped).toBeGreaterThan(0);
    handle!.update(1, "death");
    expect(handle!.activeRole).toBe("death");
    expect(handle!.activeClipName).toBe("Death");
    expect(handle!.activeActionTime).toBeCloseTo(clamped, 5);
    handle!.syncFromAnimator("idle");
    expect(handle!.activeRole).toBe("idle");
    expect(handle!.activeClipName).toBe("Idle");
    handle!.dispose();
  });

  test("triggerPlayerAction/clearPlayerAction contract: death sticky + clear a loco", () => {
    const soldier = bindMixer(
      fakeLoaded(["Idle", "Walk", "Run"]),
      PLAYER_SOLDIER_MANIFEST,
    )!;
    const survivor = bindMixer(
      fakeLoaded(["Idle", "Walk", "Run", "Attack", "Hit", "Death"]),
      PLAYER_SURVIVOR_MANIFEST,
    )!;
    const animS = createCharacterAnimator();
    const animV = createCharacterAnimator();
    soldier.syncFromAnimator("idle");
    survivor.syncFromAnimator("idle");

    setAction(animS, "death");
    soldier.syncFromAnimator(currentRole(animS));
    expect(currentRole(animS)).toBe("death");
    expect(soldier.activeRole).toBe("idle");

    setAction(animV, "death");
    survivor.syncFromAnimator(currentRole(animV));
    expect(currentRole(animV)).toBe("death");
    expect(survivor.activeRole).toBe("death");
    expect(survivor.activeClipName).toBe("Death");
    tickCharacterAnimator(animV, 10);
    survivor.update(1 / 60, currentRole(animV));
    expect(currentRole(animV)).toBe("death");
    expect(survivor.activeRole).toBe("death");

    setAction(animV, null);
    survivor.syncFromAnimator(currentRole(animV));
    expect(currentRole(animV)).toBe("idle");
    expect(survivor.activeRole).toBe("idle");
    expect(survivor.activeClipName).toBe("Idle");

    setAction(animS, null);
    soldier.syncFromAnimator(currentRole(animS));
    expect(currentRole(animS)).toBe("idle");
    expect(soldier.activeRole).toBe("idle");

    soldier.dispose();
    survivor.dispose();
  });
});
