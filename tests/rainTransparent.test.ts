import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  RAIN_TRANSPARENT,
  RAIN_TRANSPARENT_SPAWN,
  rainTransparentAfterRestart,
  rainTransparentFromLook,
} from "../src/render/rainStreaks";

describe("rainTransparentAfterRestart (R / softReset)", () => {
  test("transparent fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootTransparent = rainTransparentAfterRestart();
    expect(bootTransparent).toBe(rainTransparentFromLook(RAIN_TRANSPARENT));
    expect(bootTransparent).toBe(RAIN_TRANSPARENT);
    expect(bootTransparent).toBe(RAIN_TRANSPARENT_SPAWN);
    expect(bootTransparent).toBe(true);
    expect(rainTransparentAfterRestart()).toBe(bootTransparent);

    const leftoverTransparent = false;
    expect(rainTransparentFromLook(leftoverTransparent)).toBe(
      leftoverTransparent,
    );
    expect(rainTransparentFromLook(leftoverTransparent)).not.toBe(
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

    expect(rainTransparentFromLook(RAIN_TRANSPARENT)).toBe(bootTransparent);
  });

  test("vivo on no cambia transparent (ctor constant; sync no escribe)", () => {
    const bootTransparent = rainTransparentAfterRestart();
    const liveTransparent = rainTransparentFromLook(RAIN_TRANSPARENT);
    expect(liveTransparent).toBe(bootTransparent);
    expect(liveTransparent).toBe(rainTransparentAfterRestart());
    expect(liveTransparent).toBe(RAIN_TRANSPARENT_SPAWN);

    expect(rainTransparentFromLook(RAIN_TRANSPARENT)).toBe(bootTransparent);
    expect(rainTransparentFromLook(false)).not.toBe(bootTransparent);
  });
});

describe("rain mesh transparent recreate lock (R / softReset)", () => {
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
    const rainSrc = readFileSync(
      resolve(process.cwd(), "src/render/rainStreaks.ts"),
      "utf8",
    );
    expect(rainSrc).toContain("rainTransparentAfterRestart(");
    expect(rainSrc).toContain("rainTransparentFromLook(");
    expect(rainSrc).toContain("RAIN_TRANSPARENT_SPAWN");
    expect(rainSrc).toMatch(
      /rainTransparentAfterRestart\([\s\S]{0,200}rainTransparentFromLook\(/,
    );
    expect(viewSrc).toContain("rainTransparentAfterRestart(");
    expect(viewSrc).toContain("rainTransparentAfterRestart()");
    expect(viewSrc).not.toContain("rainTransparentFromLook(");
    expect(viewSrc).toContain("transparent: rainTransparentAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const rainMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,240}transparent:\s*true/,
    );
    expect(viewSrc).not.toMatch(/rainMat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}rainTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideRain\(\): void \{[\s\S]{0,200}rainTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearRain\(\): void \{[\s\S]{0,200}rainTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncRain\([\s\S]{0,240}rainTransparentAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainTransparentAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainTransparentAfterRestart(");
    expect(gameSrc).not.toContain("rainTransparentFromLook(");
    expect(saveSrc).not.toContain("rainTransparentAfterRestart");
    expect(saveSrc).not.toContain("rainTransparentFromLook");
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
