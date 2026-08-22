import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_CONE_OPACITY_SPAWN,
  FLASHLIGHT_WEDGE_OPACITY_BASE,
  flashlightConeOpacityAfterRestart,
  flashlightConeOpacityFromLook,
  flashlightWedgeOpacity,
} from "../src/render/flashlightCone";

describe("flashlightConeOpacityAfterRestart (R / softReset)", () => {
  test("opacity fresco (idle 0); leftover mid-life opacity / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootOpacity = flashlightConeOpacityAfterRestart();
    expect(bootOpacity).toBe(flashlightConeOpacityFromLook(0));
    expect(bootOpacity).toBe(flashlightWedgeOpacity(0));
    expect(bootOpacity).toBe(0);
    expect(bootOpacity).toBe(FLASHLIGHT_CONE_OPACITY_SPAWN);
    expect(bootOpacity).not.toBe(FLASHLIGHT_WEDGE_OPACITY_BASE);
    expect(flashlightConeOpacityAfterRestart()).toBe(bootOpacity);

    const leftoverOpacity = FLASHLIGHT_WEDGE_OPACITY_BASE;
    expect(flashlightConeOpacityFromLook(leftoverOpacity)).toBe(leftoverOpacity);
    expect(flashlightConeOpacityFromLook(leftoverOpacity)).not.toBe(bootOpacity);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(flashlightConeOpacityFromLook(0)).toBe(bootOpacity);
  });

  test("vivo on no usa el helper (opacity avanza con look)", () => {
    const bootOpacity = flashlightConeOpacityAfterRestart();
    const liveOpacity = flashlightConeOpacityFromLook(flashlightWedgeOpacity(1));
    expect(liveOpacity).toBe(flashlightWedgeOpacity(1));
    expect(liveOpacity).not.toBe(bootOpacity);
    expect(liveOpacity).not.toBe(flashlightConeOpacityAfterRestart());
    expect(liveOpacity).toBeGreaterThan(0);

    expect(flashlightConeOpacityFromLook(0)).toBe(bootOpacity);
    expect(flashlightConeOpacityFromLook(flashlightWedgeOpacity(1))).toBe(
      liveOpacity,
    );
  });
});

describe("flashlight cone opacity recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace opacity fresco; F9 no helper", () => {
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
    expect(coneSrc).toContain("flashlightConeOpacityAfterRestart(");
    expect(coneSrc).toContain("flashlightConeOpacityFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_CONE_OPACITY_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightConeOpacityAfterRestart\([\s\S]{0,200}flashlightConeOpacityFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightConeOpacityAfterRestart(");
    expect(viewSrc).toContain("flashlightConeOpacityFromLook(");
    expect(viewSrc).toContain("flashlightConeOpacityAfterRestart()");
    expect(viewSrc).toContain(
      "flashlightConeOpacityFromLook(flashlightWedgeOpacity(i))",
    );
    expect(viewSrc).not.toMatch(/opacity: FLASHLIGHT_WEDGE_OPACITY_BASE,/);
    expect(viewSrc).not.toMatch(
      /coneMat\.opacity = flashlightWedgeOpacity\(i\);/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightConeOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightConeOpacityAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3400}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightConeOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightConeOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightConeOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightConeOpacityAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightConeOpacityAfterRestart(");
    expect(gameSrc).not.toContain("flashlightConeOpacityFromLook(");
    expect(saveSrc).not.toContain("flashlightConeOpacityAfterRestart");
    expect(saveSrc).not.toContain("flashlightConeOpacityFromLook");
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
