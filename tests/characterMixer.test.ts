import { describe, expect, test } from "vitest";
import { AnimationClip, Group, VectorKeyframeTrack } from "three";
import {
  buildRoleClipMap,
  bindMixer,
  DEFAULT_MIXER_FADE_SEC,
} from "../src/render/characterMixer";
import {
  PLAYER_SOLDIER_MANIFEST,
  type CharacterAssetManifest,
} from "../src/render/characterManifest";
import type { LoadedCharacterGltf } from "../src/render/characterGltf";

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
});
