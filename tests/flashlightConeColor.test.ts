import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_WEDGE_COLOR,
  FLASHLIGHT_WEDGE_COLOR_SPAWN,
  flashlightConeColorAfterRestart,
  flashlightConeColorFromLook,
} from "../src/render/flashlightCone";

describe("flashlightConeColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle FLASHLIGHT_WEDGE_COLOR 0xefffff); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = flashlightConeColorAfterRestart();
    expect(bootColor).toBe(flashlightConeColorFromLook(FLASHLIGHT_WEDGE_COLOR));
    expect(bootColor).toBe(FLASHLIGHT_WEDGE_COLOR);
    expect(bootColor).toBe(FLASHLIGHT_WEDGE_COLOR_SPAWN);
    expect(bootColor).toBe(0xefffff);
    expect((bootColor >> 16) & 0xff).toBe(0xef);
    expect((bootColor >> 8) & 0xff).toBe(0xff);
    expect(bootColor & 0xff).toBe(0xff);
    expect(flashlightConeColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xd0eaff;
    expect(flashlightConeColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(flashlightConeColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(flashlightConeColorFromLook(FLASHLIGHT_WEDGE_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; sync no escribe)", () => {
    const bootColor = flashlightConeColorAfterRestart();
    const liveColor = flashlightConeColorFromLook(FLASHLIGHT_WEDGE_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(flashlightConeColorAfterRestart());
    expect(liveColor).toBe(FLASHLIGHT_WEDGE_COLOR_SPAWN);

    expect(flashlightConeColorFromLook(FLASHLIGHT_WEDGE_COLOR)).toBe(bootColor);
    expect(flashlightConeColorFromLook(0xd0eaff)).not.toBe(bootColor);
  });
});

describe("flashlight cone mesh color recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace color fresco; F9 no helper", () => {
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
    expect(coneSrc).toContain("flashlightConeColorAfterRestart(");
    expect(coneSrc).toContain("flashlightConeColorFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_WEDGE_COLOR_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightConeColorAfterRestart\([\s\S]{0,200}flashlightConeColorFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightConeColorAfterRestart(");
    expect(viewSrc).toContain("flashlightConeColorAfterRestart()");
    expect(viewSrc).not.toContain("flashlightConeColorFromLook(");
    expect(viewSrc).toContain("color: flashlightConeColorAfterRestart()");
    expect(viewSrc).not.toMatch(/color:\s*FLASHLIGHT_WEDGE_COLOR,/);
    expect(viewSrc).not.toMatch(/coneMat\.color\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightConeColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightConeColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncTorchLight\([\s\S]{0,240}flashlightConeColorAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightConeColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightConeColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightConeColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightConeColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightConeColorAfterRestart(");
    expect(gameSrc).not.toContain("flashlightConeColorFromLook(");
    expect(saveSrc).not.toContain("flashlightConeColorAfterRestart");
    expect(saveSrc).not.toContain("flashlightConeColorFromLook");
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
