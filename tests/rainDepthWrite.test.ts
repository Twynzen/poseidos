import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  RAIN_DEPTH_WRITE,
  RAIN_DEPTH_WRITE_SPAWN,
  rainDepthWriteAfterRestart,
  rainDepthWriteFromLook,
} from "../src/render/rainStreaks";

describe("rainDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = rainDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(rainDepthWriteFromLook(RAIN_DEPTH_WRITE));
    expect(bootDepthWrite).toBe(RAIN_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(RAIN_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(false);
    expect(rainDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = true;
    expect(rainDepthWriteFromLook(leftoverDepthWrite)).toBe(leftoverDepthWrite);
    expect(rainDepthWriteFromLook(leftoverDepthWrite)).not.toBe(bootDepthWrite);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(rainDepthWriteFromLook(RAIN_DEPTH_WRITE)).toBe(bootDepthWrite);
  });

  test("vivo on no cambia depthWrite (ctor constant; sync no escribe)", () => {
    const bootDepthWrite = rainDepthWriteAfterRestart();
    const liveDepthWrite = rainDepthWriteFromLook(RAIN_DEPTH_WRITE);
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(rainDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(RAIN_DEPTH_WRITE_SPAWN);

    expect(rainDepthWriteFromLook(RAIN_DEPTH_WRITE)).toBe(bootDepthWrite);
    expect(rainDepthWriteFromLook(true)).not.toBe(bootDepthWrite);
  });
});

describe("rain mesh depthWrite recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace depthWrite fresco; F9 no helper", () => {
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
    expect(rainSrc).toContain("rainDepthWriteAfterRestart(");
    expect(rainSrc).toContain("rainDepthWriteFromLook(");
    expect(rainSrc).toContain("RAIN_DEPTH_WRITE_SPAWN");
    expect(rainSrc).toMatch(
      /rainDepthWriteAfterRestart\([\s\S]{0,200}rainDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("rainDepthWriteAfterRestart(");
    expect(viewSrc).toContain("rainDepthWriteAfterRestart()");
    expect(viewSrc).not.toContain("rainDepthWriteFromLook(");
    expect(viewSrc).toContain("depthWrite: rainDepthWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const rainMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}depthWrite:\s*false/,
    );
    expect(viewSrc).not.toMatch(/rainMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}rainDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideRain\(\): void \{[\s\S]{0,200}rainDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearRain\(\): void \{[\s\S]{0,200}rainDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncRain\([\s\S]{0,240}rainDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}rainDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}rainDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}rainDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}rainDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("rainDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("rainDepthWriteFromLook(");
    expect(saveSrc).not.toContain("rainDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("rainDepthWriteFromLook");
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
