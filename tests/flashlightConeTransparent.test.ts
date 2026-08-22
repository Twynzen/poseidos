import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_CONE_TRANSPARENT,
  FLASHLIGHT_CONE_TRANSPARENT_SPAWN,
  flashlightConeTransparentAfterRestart,
  flashlightConeTransparentFromLook,
} from "../src/render/flashlightCone";

describe("flashlightConeTransparentAfterRestart (R / softReset)", () => {
  test("transparent fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootTransparent = flashlightConeTransparentAfterRestart();
    expect(bootTransparent).toBe(
      flashlightConeTransparentFromLook(FLASHLIGHT_CONE_TRANSPARENT),
    );
    expect(bootTransparent).toBe(FLASHLIGHT_CONE_TRANSPARENT);
    expect(bootTransparent).toBe(FLASHLIGHT_CONE_TRANSPARENT_SPAWN);
    expect(bootTransparent).toBe(true);
    expect(flashlightConeTransparentAfterRestart()).toBe(bootTransparent);

    const leftoverTransparent = false;
    expect(flashlightConeTransparentFromLook(leftoverTransparent)).toBe(
      leftoverTransparent,
    );
    expect(flashlightConeTransparentFromLook(leftoverTransparent)).not.toBe(
      bootTransparent,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(flashlightConeTransparentFromLook(FLASHLIGHT_CONE_TRANSPARENT)).toBe(
      bootTransparent,
    );
  });

  test("vivo on no cambia transparent (ctor constant; sync no escribe)", () => {
    const bootTransparent = flashlightConeTransparentAfterRestart();
    const liveTransparent = flashlightConeTransparentFromLook(
      FLASHLIGHT_CONE_TRANSPARENT,
    );
    expect(liveTransparent).toBe(bootTransparent);
    expect(liveTransparent).toBe(flashlightConeTransparentAfterRestart());
    expect(liveTransparent).toBe(FLASHLIGHT_CONE_TRANSPARENT_SPAWN);

    expect(flashlightConeTransparentFromLook(FLASHLIGHT_CONE_TRANSPARENT)).toBe(
      bootTransparent,
    );
    expect(flashlightConeTransparentFromLook(false)).not.toBe(bootTransparent);
  });
});

describe("flashlight cone mesh transparent recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace transparent fresco; F9 no helper", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    const saveSrc = readFileSync(
      resolve(process.cwd(), "src/core/save.ts"),
      "utf8",
    );
    const coneSrc = readFileSync(
      resolve(process.cwd(), "src/render/flashlightCone.ts"),
      "utf8",
    );
    expect(coneSrc).toContain("flashlightConeTransparentAfterRestart(");
    expect(coneSrc).toContain("flashlightConeTransparentFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_CONE_TRANSPARENT_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightConeTransparentAfterRestart\([\s\S]{0,200}flashlightConeTransparentFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightConeTransparentAfterRestart(");
    expect(viewSrc).toContain("flashlightConeTransparentAfterRestart()");
    expect(viewSrc).not.toContain("flashlightConeTransparentFromLook(");
    expect(viewSrc).toContain(
      "transparent: flashlightConeTransparentAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const coneMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}transparent:\s*true/,
    );
    expect(viewSrc).not.toMatch(/coneMat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightConeTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightConeTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncTorchLight\([\s\S]{0,240}flashlightConeTransparentAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3700}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightConeTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightConeTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightConeTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightConeTransparentAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightConeTransparentAfterRestart(");
    expect(gameSrc).not.toContain("flashlightConeTransparentFromLook(");
    expect(saveSrc).not.toContain("flashlightConeTransparentAfterRestart");
    expect(saveSrc).not.toContain("flashlightConeTransparentFromLook");
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}this\.showHelp\s*=/,
    );
    expect(gameSrc).toMatch(
      /consumeRestOrRestart\(\)\) \{\s*this\.softReset\(\);/,
    );
    expect(gameSrc).not.toMatch(
      /consumeRestOrRestart\(\)\) \{\s*this\.softReset\(\);\s*this\.hudAcc = 1/,
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
