import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_SPOT_PENUMBRA,
  FLASHLIGHT_SPOT_PENUMBRA_SPAWN,
  flashlightSpotPenumbraAfterRestart,
  flashlightSpotPenumbraFromLook,
} from "../src/render/flashlightCone";

describe("flashlightSpotPenumbraAfterRestart (R / softReset)", () => {
  test("penumbra fresco (idle FLASHLIGHT_SPOT_PENUMBRA); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootPenumbra = flashlightSpotPenumbraAfterRestart();
    expect(bootPenumbra).toBe(flashlightSpotPenumbraFromLook(FLASHLIGHT_SPOT_PENUMBRA));
    expect(bootPenumbra).toBe(FLASHLIGHT_SPOT_PENUMBRA);
    expect(bootPenumbra).toBe(FLASHLIGHT_SPOT_PENUMBRA_SPAWN);
    expect(bootPenumbra).toBe(0.2645);
    expect(flashlightSpotPenumbraAfterRestart()).toBe(bootPenumbra);

    const leftoverPenumbra = FLASHLIGHT_SPOT_PENUMBRA * 2;
    expect(flashlightSpotPenumbraFromLook(leftoverPenumbra)).toBe(leftoverPenumbra);
    expect(flashlightSpotPenumbraFromLook(leftoverPenumbra)).not.toBe(bootPenumbra);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(flashlightSpotPenumbraFromLook(FLASHLIGHT_SPOT_PENUMBRA)).toBe(bootPenumbra);
  });

  test("vivo on no cambia penumbra (ctor constant; sync no escribe)", () => {
    const bootPenumbra = flashlightSpotPenumbraAfterRestart();
    const livePenumbra = flashlightSpotPenumbraFromLook(FLASHLIGHT_SPOT_PENUMBRA);
    expect(livePenumbra).toBe(bootPenumbra);
    expect(livePenumbra).toBe(flashlightSpotPenumbraAfterRestart());
    expect(livePenumbra).toBe(FLASHLIGHT_SPOT_PENUMBRA_SPAWN);

    expect(flashlightSpotPenumbraFromLook(FLASHLIGHT_SPOT_PENUMBRA)).toBe(bootPenumbra);
    expect(
      flashlightSpotPenumbraFromLook(FLASHLIGHT_SPOT_PENUMBRA * 2),
    ).not.toBe(bootPenumbra);
  });
});

describe("flashlight spot penumbra recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace penumbra fresco; F9 no helper", () => {
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
    expect(coneSrc).toContain("flashlightSpotPenumbraAfterRestart(");
    expect(coneSrc).toContain("flashlightSpotPenumbraFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_SPOT_PENUMBRA_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightSpotPenumbraAfterRestart\([\s\S]{0,200}flashlightSpotPenumbraFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightSpotPenumbraAfterRestart(");
    expect(viewSrc).toContain("flashlightSpotPenumbraAfterRestart()");
    expect(viewSrc).not.toContain("flashlightSpotPenumbraFromLook(");
    expect(viewSrc).not.toMatch(
      /new THREE\.SpotLight\(\s*FLASHLIGHT_SPOT_COLOR,\s*flashlightSpotIntensityAfterRestart\(\),\s*flashlightSpotDistanceAfterRestart\(\),\s*flashlightSpotAngleAfterRestart\(\),\s*FLASHLIGHT_SPOT_PENUMBRA/,
    );
    expect(viewSrc).not.toMatch(/torchSpot\.penumbra\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightSpotPenumbraAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightSpotPenumbraAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3200}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightSpotPenumbraAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightSpotPenumbraAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightSpotPenumbraAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightSpotPenumbraAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightSpotPenumbraAfterRestart(");
    expect(gameSrc).not.toContain("flashlightSpotPenumbraFromLook(");
    expect(saveSrc).not.toContain("flashlightSpotPenumbraAfterRestart");
    expect(saveSrc).not.toContain("flashlightSpotPenumbraFromLook");
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
