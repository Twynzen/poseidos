import { describe, expect, test } from "vitest";
import {
  CHARACTER_CLIP_ROLES,
  DEFAULT_PLACEHOLDER_MANIFEST,
  PLAYER_SOLDIER_MANIFEST,
  usesPlaceholderMesh,
  clipNameForRole,
  isValidManifest,
  type CharacterAssetManifest,
} from "../src/render/characterManifest";

describe("DEFAULT_PLACEHOLDER_MANIFEST", () => {
  test("sin url => placeholder", () => {
    expect(DEFAULT_PLACEHOLDER_MANIFEST.url).toBe("");
    expect(usesPlaceholderMesh(DEFAULT_PLACEHOLDER_MANIFEST)).toBe(true);
    expect(isValidManifest(DEFAULT_PLACEHOLDER_MANIFEST)).toBe(true);
  });

  test("roles minimos mapeados", () => {
    for (const role of CHARACTER_CLIP_ROLES) {
      expect(clipNameForRole(DEFAULT_PLACEHOLDER_MANIFEST, role)).toBeTruthy();
    }
  });
});

describe("PLAYER_SOLDIER_MANIFEST", () => {
  test("url Soldier + roles Idle/Walk/Run", () => {
    expect(usesPlaceholderMesh(PLAYER_SOLDIER_MANIFEST)).toBe(false);
    expect(isValidManifest(PLAYER_SOLDIER_MANIFEST)).toBe(true);
    expect(PLAYER_SOLDIER_MANIFEST.url).toBe("/models/Soldier.glb");
    expect(clipNameForRole(PLAYER_SOLDIER_MANIFEST, "idle")).toBe("Idle");
    expect(clipNameForRole(PLAYER_SOLDIER_MANIFEST, "walk")).toBe("Walk");
    expect(clipNameForRole(PLAYER_SOLDIER_MANIFEST, "run")).toBe("Run");
    expect(PLAYER_SOLDIER_MANIFEST.scale).toBe(1.25);
    expect(PLAYER_SOLDIER_MANIFEST.yOffset).toBe(0);
  });
});

describe("usesPlaceholderMesh / clipNameForRole / isValidManifest", () => {
  test("url whitespace = placeholder; url real = no", () => {
    const m: CharacterAssetManifest = {
      ...DEFAULT_PLACEHOLDER_MANIFEST,
      id: "survivor",
      url: "   ",
    };
    expect(usesPlaceholderMesh(m)).toBe(true);
    m.url = "/models/survivor.glb";
    expect(usesPlaceholderMesh(m)).toBe(false);
  });

  test("clipNameForRole respeta mapa y omite vacios", () => {
    const m: CharacterAssetManifest = {
      id: "x",
      url: "/models/x.glb",
      roles: { idle: "Idle", walk: "  " },
      scale: 1,
      yOffset: 0,
    };
    expect(clipNameForRole(m, "idle")).toBe("Idle");
    expect(clipNameForRole(m, "walk")).toBeUndefined();
    expect(clipNameForRole(m, "run")).toBeUndefined();
  });

  test("isValidManifest rechaza id vacio / scale invalido", () => {
    expect(
      isValidManifest({ ...DEFAULT_PLACEHOLDER_MANIFEST, id: "" }),
    ).toBe(false);
    expect(
      isValidManifest({ ...DEFAULT_PLACEHOLDER_MANIFEST, scale: 0 }),
    ).toBe(false);
    expect(
      isValidManifest({ ...DEFAULT_PLACEHOLDER_MANIFEST, yOffset: NaN }),
    ).toBe(false);
  });
});
