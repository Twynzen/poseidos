import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_CONE_BLENDING,
  FLASHLIGHT_CONE_BLENDING_SPAWN,
  flashlightConeBlendingAfterRestart,
  flashlightConeBlendingFromLook,
} from "../src/render/flashlightCone";

describe("flashlightConeBlendingAfterRestart (R / softReset)", () => {
  test("blending fresco (idle THREE.AdditiveBlending / 2); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootBlending = flashlightConeBlendingAfterRestart();
    expect(bootBlending).toBe(
      flashlightConeBlendingFromLook(FLASHLIGHT_CONE_BLENDING),
    );
    expect(bootBlending).toBe(FLASHLIGHT_CONE_BLENDING);
    expect(bootBlending).toBe(FLASHLIGHT_CONE_BLENDING_SPAWN);
    expect(bootBlending).toBe(2);
    expect(flashlightConeBlendingAfterRestart()).toBe(bootBlending);

    const leftoverBlending = 1;
    expect(flashlightConeBlendingFromLook(leftoverBlending)).toBe(
      leftoverBlending,
    );
    expect(flashlightConeBlendingFromLook(leftoverBlending)).not.toBe(
      bootBlending,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(flashlightConeBlendingFromLook(FLASHLIGHT_CONE_BLENDING)).toBe(
      bootBlending,
    );
  });

  test("vivo on no cambia blending (ctor constant; sync no escribe)", () => {
    const bootBlending = flashlightConeBlendingAfterRestart();
    const liveBlending = flashlightConeBlendingFromLook(FLASHLIGHT_CONE_BLENDING);
    expect(liveBlending).toBe(bootBlending);
    expect(liveBlending).toBe(flashlightConeBlendingAfterRestart());
    expect(liveBlending).toBe(FLASHLIGHT_CONE_BLENDING_SPAWN);

    expect(flashlightConeBlendingFromLook(FLASHLIGHT_CONE_BLENDING)).toBe(
      bootBlending,
    );
    expect(flashlightConeBlendingFromLook(1)).not.toBe(bootBlending);
  });
});

describe("flashlight cone mesh blending recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace blending fresco; F9 no helper", () => {
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
    expect(coneSrc).toContain("flashlightConeBlendingAfterRestart(");
    expect(coneSrc).toContain("flashlightConeBlendingFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_CONE_BLENDING_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightConeBlendingAfterRestart\([\s\S]{0,200}flashlightConeBlendingFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightConeBlendingAfterRestart(");
    expect(viewSrc).toContain("flashlightConeBlendingAfterRestart()");
    expect(viewSrc).not.toContain("flashlightConeBlendingFromLook(");
    expect(viewSrc).toContain("blending: flashlightConeBlendingAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const coneMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,1040}blending:\s*THREE\.AdditiveBlending/,
    );
    expect(viewSrc).not.toMatch(/coneMat\.blending\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightConeBlendingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightConeBlendingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncTorchLight\([\s\S]{0,240}flashlightConeBlendingAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightConeBlendingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightConeBlendingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightConeBlendingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightConeBlendingAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightConeBlendingAfterRestart(");
    expect(gameSrc).not.toContain("flashlightConeBlendingFromLook(");
    expect(saveSrc).not.toContain("flashlightConeBlendingAfterRestart");
    expect(saveSrc).not.toContain("flashlightConeBlendingFromLook");
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
