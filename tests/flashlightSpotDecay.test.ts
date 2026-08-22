import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_SPOT_DECAY_SPAWN,
  flashlightSpotDecayAfterRestart,
  flashlightSpotDecayFromLook,
} from "../src/render/flashlightCone";
import { FLASHLIGHT_SPOT_DECAY } from "../src/render/worldView";

describe("flashlightSpotDecayAfterRestart (R / softReset)", () => {
  test("decay fresco (idle FLASHLIGHT_SPOT_DECAY); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDecay = flashlightSpotDecayAfterRestart();
    expect(bootDecay).toBe(flashlightSpotDecayFromLook(FLASHLIGHT_SPOT_DECAY));
    expect(bootDecay).toBe(FLASHLIGHT_SPOT_DECAY);
    expect(bootDecay).toBe(FLASHLIGHT_SPOT_DECAY_SPAWN);
    expect(bootDecay).toBe(1.74);
    expect(flashlightSpotDecayAfterRestart()).toBe(bootDecay);

    const leftoverDecay = FLASHLIGHT_SPOT_DECAY * 2;
    expect(flashlightSpotDecayFromLook(leftoverDecay)).toBe(leftoverDecay);
    expect(flashlightSpotDecayFromLook(leftoverDecay)).not.toBe(bootDecay);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(flashlightSpotDecayFromLook(FLASHLIGHT_SPOT_DECAY)).toBe(bootDecay);
  });

  test("vivo on no cambia decay (ctor constant; sync no escribe)", () => {
    const bootDecay = flashlightSpotDecayAfterRestart();
    const liveDecay = flashlightSpotDecayFromLook(FLASHLIGHT_SPOT_DECAY);
    expect(liveDecay).toBe(bootDecay);
    expect(liveDecay).toBe(flashlightSpotDecayAfterRestart());
    expect(liveDecay).toBe(FLASHLIGHT_SPOT_DECAY_SPAWN);

    expect(flashlightSpotDecayFromLook(FLASHLIGHT_SPOT_DECAY)).toBe(bootDecay);
    expect(flashlightSpotDecayFromLook(FLASHLIGHT_SPOT_DECAY * 2)).not.toBe(
      bootDecay,
    );
  });
});

describe("flashlight spot decay recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace decay fresco; F9 no helper", () => {
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
    expect(coneSrc).toContain("flashlightSpotDecayAfterRestart(");
    expect(coneSrc).toContain("flashlightSpotDecayFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_SPOT_DECAY_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightSpotDecayAfterRestart\([\s\S]{0,200}flashlightSpotDecayFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightSpotDecayAfterRestart(");
    expect(viewSrc).toContain("flashlightSpotDecayAfterRestart()");
    expect(viewSrc).not.toContain("flashlightSpotDecayFromLook(");
    expect(viewSrc).not.toMatch(
      /new THREE\.SpotLight\(\s*FLASHLIGHT_SPOT_COLOR,\s*flashlightSpotIntensityAfterRestart\(\),\s*flashlightSpotDistanceAfterRestart\(\),\s*flashlightSpotAngleAfterRestart\(\),\s*flashlightSpotPenumbraAfterRestart\(\),\s*FLASHLIGHT_SPOT_DECAY/,
    );
    expect(viewSrc).not.toMatch(/torchSpot\.decay\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightSpotDecayAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightSpotDecayAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3500}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightSpotDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightSpotDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightSpotDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightSpotDecayAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightSpotDecayAfterRestart(");
    expect(gameSrc).not.toContain("flashlightSpotDecayFromLook(");
    expect(saveSrc).not.toContain("flashlightSpotDecayAfterRestart");
    expect(saveSrc).not.toContain("flashlightSpotDecayFromLook");
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
