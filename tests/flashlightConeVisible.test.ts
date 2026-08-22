import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_CONE_VISIBLE_SPAWN,
  flashlightConeVisibleAfterRestart,
  flashlightConeVisibleFromLook,
} from "../src/render/flashlightCone";

describe("flashlightConeVisibleAfterRestart (R / softReset)", () => {
  test("visible fresco (idle false); leftover mid-life visible / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootVisible = flashlightConeVisibleAfterRestart();
    expect(bootVisible).toBe(flashlightConeVisibleFromLook(false));
    expect(bootVisible).toBe(false);
    expect(bootVisible).toBe(FLASHLIGHT_CONE_VISIBLE_SPAWN);
    expect(flashlightConeVisibleAfterRestart()).toBe(bootVisible);

    const leftoverVisible = true;
    expect(flashlightConeVisibleFromLook(leftoverVisible)).toBe(leftoverVisible);
    expect(flashlightConeVisibleFromLook(leftoverVisible)).not.toBe(bootVisible);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(flashlightConeVisibleFromLook(false)).toBe(bootVisible);
  });

  test("vivo on no usa el helper (visible avanza con look)", () => {
    const bootVisible = flashlightConeVisibleAfterRestart();
    const liveVisible = flashlightConeVisibleFromLook(true);
    expect(liveVisible).toBe(true);
    expect(liveVisible).not.toBe(bootVisible);
    expect(liveVisible).not.toBe(flashlightConeVisibleAfterRestart());

    expect(flashlightConeVisibleFromLook(false)).toBe(bootVisible);
    expect(flashlightConeVisibleFromLook(true)).toBe(true);
  });
});

describe("flashlight cone visible recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace visible fresco; F9 no helper", () => {
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
    expect(coneSrc).toContain("flashlightConeVisibleAfterRestart(");
    expect(coneSrc).toContain("flashlightConeVisibleFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_CONE_VISIBLE_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightConeVisibleAfterRestart\([\s\S]{0,200}flashlightConeVisibleFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightConeVisibleAfterRestart(");
    expect(viewSrc).toContain("flashlightConeVisibleFromLook(");
    expect(viewSrc).toContain("flashlightConeVisibleAfterRestart()");
    expect(viewSrc).toContain("flashlightConeVisibleFromLook(on)");
    expect(viewSrc).not.toMatch(/flashlightConeWedge\.visible = on;/);
    expect(viewSrc).not.toMatch(/flashlightConeWedge\.visible = false;/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightConeVisibleAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightConeVisibleAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3600}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightConeVisibleAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightConeVisibleAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightConeVisibleAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightConeVisibleAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightConeVisibleAfterRestart(");
    expect(gameSrc).not.toContain("flashlightConeVisibleFromLook(");
    expect(saveSrc).not.toContain("flashlightConeVisibleAfterRestart");
    expect(saveSrc).not.toContain("flashlightConeVisibleFromLook");
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
