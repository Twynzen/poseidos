import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FOG_SCALE_Y,
  FOG_SCALE_Y_SPAWN,
  fogScaleYAfterRestart,
  fogScaleYFromLook,
} from "../src/render/fogAtmosphere";

describe("fogScaleYAfterRestart (R / softReset)", () => {
  test("scale Y fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootScaleY = fogScaleYAfterRestart();
    expect(bootScaleY).toBe(fogScaleYFromLook(FOG_SCALE_Y));
    expect(bootScaleY).toBe(FOG_SCALE_Y);
    expect(bootScaleY).toBe(FOG_SCALE_Y_SPAWN);
    expect(bootScaleY).toBe(1);
    expect(bootScaleY).toBeGreaterThan(0);
    expect(bootScaleY).toBeLessThanOrEqual(1);
    expect(fogScaleYAfterRestart()).toBe(bootScaleY);

    const leftoverScaleY = 2;
    expect(fogScaleYFromLook(leftoverScaleY)).toBe(leftoverScaleY);
    expect(fogScaleYFromLook(leftoverScaleY)).not.toBe(bootScaleY);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(fogScaleYFromLook(FOG_SCALE_Y)).toBe(bootScaleY);
  });

  test("vivo on no cambia scale Y (ctor constant; sync no escribe)", () => {
    const bootScaleY = fogScaleYAfterRestart();
    const liveScaleY = fogScaleYFromLook(FOG_SCALE_Y);
    expect(liveScaleY).toBe(bootScaleY);
    expect(liveScaleY).toBe(fogScaleYAfterRestart());
    expect(liveScaleY).toBe(FOG_SCALE_Y_SPAWN);

    expect(fogScaleYFromLook(FOG_SCALE_Y)).toBe(bootScaleY);
    expect(fogScaleYFromLook(2)).not.toBe(bootScaleY);
  });
});

describe("fog mesh scale Y recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace scale Y fresco; F9 no helper", () => {
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
    const fogSrc = readFileSync(
      resolve(process.cwd(), "src/render/fogAtmosphere.ts"),
      "utf8",
    );
    expect(fogSrc).toContain("fogScaleYAfterRestart(");
    expect(fogSrc).toContain("fogScaleYFromLook(");
    expect(fogSrc).toContain("FOG_SCALE_Y_SPAWN");
    expect(fogSrc).toMatch(
      /fogScaleYAfterRestart\([\s\S]{0,200}fogScaleYFromLook\(/,
    );
    expect(viewSrc).toContain("fogScaleYAfterRestart(");
    expect(viewSrc).toContain("fogScaleYAfterRestart()");
    expect(viewSrc).not.toContain("fogScaleYFromLook(");
    expect(viewSrc).toContain("fog.scale.y = fogScaleYAfterRestart()");
    expect(viewSrc).not.toMatch(/fog\.scale\.y\s*=\s*1/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}fogScaleYAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFog\(\): void \{[\s\S]{0,200}fogScaleYAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncFov\([\s\S]{0,240}fogScaleYAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}fogScaleYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}fogScaleYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}fogScaleYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}fogScaleYAfterRestart/,
    );
    expect(gameSrc).not.toContain("fogScaleYAfterRestart(");
    expect(gameSrc).not.toContain("fogScaleYFromLook(");
    expect(saveSrc).not.toContain("fogScaleYAfterRestart");
    expect(saveSrc).not.toContain("fogScaleYFromLook");
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
