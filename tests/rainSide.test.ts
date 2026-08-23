import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  RAIN_SIDE,
  RAIN_SIDE_SPAWN,
  rainSideAfterRestart,
  rainSideFromLook,
} from "../src/render/rainStreaks";

describe("rainSideAfterRestart (R / softReset)", () => {
  test("side fresco (idle THREE.FrontSide / 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootSide = rainSideAfterRestart();
    expect(bootSide).toBe(rainSideFromLook(RAIN_SIDE));
    expect(bootSide).toBe(RAIN_SIDE);
    expect(bootSide).toBe(RAIN_SIDE_SPAWN);
    expect(bootSide).toBe(0);
    expect(rainSideAfterRestart()).toBe(bootSide);

    const leftoverSide = 2;
    expect(rainSideFromLook(leftoverSide)).toBe(leftoverSide);
    expect(rainSideFromLook(leftoverSide)).not.toBe(bootSide);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(rainSideFromLook(RAIN_SIDE)).toBe(bootSide);
    expect(rainSideFromLook(2)).not.toBe(bootSide);
  });

  test("vivo on no cambia side (ctor constant; attach/tick no escriben)", () => {
    const bootSide = rainSideAfterRestart();
    const liveSide = rainSideFromLook(RAIN_SIDE);
    expect(liveSide).toBe(bootSide);
    expect(liveSide).toBe(rainSideAfterRestart());
    expect(liveSide).toBe(RAIN_SIDE_SPAWN);

    expect(rainSideFromLook(RAIN_SIDE)).toBe(bootSide);
    expect(rainSideFromLook(2)).not.toBe(bootSide);
  });
});

describe("rain mesh side recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace side fresco; F9 no helper", () => {
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
    expect(rainSrc).toContain("rainSideAfterRestart(");
    expect(rainSrc).toContain("rainSideFromLook(");
    expect(rainSrc).toContain("RAIN_SIDE_SPAWN");
    expect(rainSrc).toMatch(
      /rainSideAfterRestart\([\s\S]{0,200}rainSideFromLook\(/,
    );
    expect(viewSrc).toContain("rainSideAfterRestart(");
    expect(viewSrc).toContain("rainSideAfterRestart()");
    expect(viewSrc).not.toContain("rainSideFromLook(");
    expect(viewSrc).toContain("side: rainSideAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const rainMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,1200}side:\s*THREE\.FrontSide/,
    );
    expect(viewSrc).not.toMatch(
      /const rainMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,1200}side:\s*0/,
    );
    expect(viewSrc).not.toMatch(/rainMat\.side\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}rainSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideRain\(\): void \{[\s\S]{0,200}rainSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearRain\(\): void \{[\s\S]{0,200}rainSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncRain\([\s\S]{0,240}rainSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncDayNight\(clock\) \{[\s\S]{0,800}rainSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}rainSideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainSideAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainSideAfterRestart(");
    expect(gameSrc).not.toContain("rainSideFromLook(");
    expect(saveSrc).not.toContain("rainSideAfterRestart");
    expect(saveSrc).not.toContain("rainSideFromLook");
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
