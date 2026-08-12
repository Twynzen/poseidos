import { describe, expect, test } from "vitest";
import {
  CHARACTER_CLIP_ROLES,
  DEFAULT_PLACEHOLDER_MANIFEST,
  PLAYER_SOLDIER_MANIFEST,
  PLAYER_SURVIVOR_MANIFEST,
  PLAYER_ONESHOT_ROLES,
  MUTE_SOLDIER_MANIFEST,
  POSSESSED_SOLDIER_MANIFEST,
  joinBaseUrl,
  usesPlaceholderMesh,
  clipNameForRole,
  isValidManifest,
  preferSurvivorManifest,
  playerManifestCandidates,
  shouldApplySurvivorLook,
  type CharacterAssetManifest,
} from "../src/render/characterManifest";

describe("joinBaseUrl", () => {
  test("base / + models path", () => {
    expect(joinBaseUrl("/", "models/Soldier.glb")).toBe("/models/Soldier.glb");
  });

  test("base /poseidos/ + models path", () => {
    expect(joinBaseUrl("/poseidos/", "models/Soldier.glb")).toBe(
      "/poseidos/models/Soldier.glb",
    );
  });

  test("base sin slash final + path con slash inicial", () => {
    expect(joinBaseUrl("/poseidos", "/models/Soldier.glb")).toBe(
      "/poseidos/models/Soldier.glb",
    );
  });
});

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

describe("PLAYER_SURVIVOR_MANIFEST", () => {
  test("id survivor, url Survivor.glb, roles Idle/Walk/Run/Attack/Hit/Death", () => {
    expect(usesPlaceholderMesh(PLAYER_SURVIVOR_MANIFEST)).toBe(false);
    expect(isValidManifest(PLAYER_SURVIVOR_MANIFEST)).toBe(true);
    expect(PLAYER_SURVIVOR_MANIFEST.id).toBe("survivor");
    expect(PLAYER_SURVIVOR_MANIFEST.url).toBe("/models/Survivor.glb");
    expect(clipNameForRole(PLAYER_SURVIVOR_MANIFEST, "idle")).toBe("Idle");
    expect(clipNameForRole(PLAYER_SURVIVOR_MANIFEST, "walk")).toBe("Walk");
    expect(clipNameForRole(PLAYER_SURVIVOR_MANIFEST, "run")).toBe("Run");
    expect(clipNameForRole(PLAYER_SURVIVOR_MANIFEST, "primary-attack")).toBe(
      "Attack",
    );
    expect(clipNameForRole(PLAYER_SURVIVOR_MANIFEST, "hit")).toBe("Hit");
    expect(clipNameForRole(PLAYER_SURVIVOR_MANIFEST, "death")).toBe("Death");
    expect(PLAYER_SURVIVOR_MANIFEST.scale).toBe(1.25);
    expect(PLAYER_SURVIVOR_MANIFEST.yOffset).toBe(0);
  });
});

describe("preferSurvivorManifest / playerManifestCandidates", () => {
  test("preferSurvivorManifest(true) → Survivor; false → Soldier", () => {
    expect(preferSurvivorManifest(true)).toBe(PLAYER_SURVIVOR_MANIFEST);
    expect(preferSurvivorManifest(false)).toBe(PLAYER_SOLDIER_MANIFEST);
  });

  test("playerManifestCandidates es [Survivor, Soldier]", () => {
    expect(playerManifestCandidates()).toEqual([
      PLAYER_SURVIVOR_MANIFEST,
      PLAYER_SOLDIER_MANIFEST,
    ]);
  });

  test("shouldApplySurvivorLook: skip Survivor, tint Soldier", () => {
    expect(shouldApplySurvivorLook(PLAYER_SURVIVOR_MANIFEST)).toBe(false);
    expect(shouldApplySurvivorLook(PLAYER_SOLDIER_MANIFEST)).toBe(true);
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
    expect(clipNameForRole(PLAYER_SOLDIER_MANIFEST, "primary-attack")).toBeUndefined();
    expect(clipNameForRole(PLAYER_SOLDIER_MANIFEST, "hit")).toBeUndefined();
    expect(clipNameForRole(PLAYER_SOLDIER_MANIFEST, "death")).toBeUndefined();
    expect(PLAYER_SOLDIER_MANIFEST.scale).toBe(1.25);
    expect(PLAYER_SOLDIER_MANIFEST.yOffset).toBe(0);
  });
});

describe("POSSESSED_SOLDIER_MANIFEST", () => {
  test("mismo Soldier.glb, id possessed-soldier, scale 1.25", () => {
    expect(usesPlaceholderMesh(POSSESSED_SOLDIER_MANIFEST)).toBe(false);
    expect(isValidManifest(POSSESSED_SOLDIER_MANIFEST)).toBe(true);
    expect(POSSESSED_SOLDIER_MANIFEST.id).toBe("possessed-soldier");
    expect(POSSESSED_SOLDIER_MANIFEST.url).toBe(PLAYER_SOLDIER_MANIFEST.url);
    expect(POSSESSED_SOLDIER_MANIFEST.url).toBe("/models/Soldier.glb");
    expect(POSSESSED_SOLDIER_MANIFEST.scale).toBe(1.25);
    expect(POSSESSED_SOLDIER_MANIFEST.yOffset).toBe(0);
    expect(clipNameForRole(POSSESSED_SOLDIER_MANIFEST, "idle")).toBe("Idle");
  });
});

describe("MUTE_SOLDIER_MANIFEST", () => {
  test("mismo Soldier.glb, id mute-soldier, scale 1.25", () => {
    expect(usesPlaceholderMesh(MUTE_SOLDIER_MANIFEST)).toBe(false);
    expect(isValidManifest(MUTE_SOLDIER_MANIFEST)).toBe(true);
    expect(MUTE_SOLDIER_MANIFEST.id).toBe("mute-soldier");
    expect(MUTE_SOLDIER_MANIFEST.url).toBe(PLAYER_SOLDIER_MANIFEST.url);
    expect(MUTE_SOLDIER_MANIFEST.url).toBe(POSSESSED_SOLDIER_MANIFEST.url);
    expect(MUTE_SOLDIER_MANIFEST.url).toBe("/models/Soldier.glb");
    expect(MUTE_SOLDIER_MANIFEST.scale).toBe(1.25);
    expect(MUTE_SOLDIER_MANIFEST.yOffset).toBe(0);
    expect(clipNameForRole(MUTE_SOLDIER_MANIFEST, "idle")).toBe("Idle");
    expect(clipNameForRole(MUTE_SOLDIER_MANIFEST, "walk")).toBe("Walk");
    expect(clipNameForRole(MUTE_SOLDIER_MANIFEST, "run")).toBe("Run");
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

describe("PLAYER_ONESHOT_ROLES", () => {
  test("incluye primary-attack, hit y death", () => {
    expect(PLAYER_ONESHOT_ROLES).toEqual(["primary-attack", "hit", "death"]);
    expect(PLAYER_ONESHOT_ROLES).toContain("death");
  });
});
