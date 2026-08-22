import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FOG_ROT_Y,
  FOG_ROT_Y_SPAWN,
  fogRotYAfterRestart,
  fogRotYFromLook,
} from "../src/render/fogAtmosphere";

describe("fogRotYAfterRestart (R / softReset)", () => {
  test("rot Y fresco (idle 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRotY = fogRotYAfterRestart();
    expect(bootRotY).toBe(fogRotYFromLook(FOG_ROT_Y));
    expect(bootRotY).toBe(FOG_ROT_Y);
    expect(bootRotY).toBe(FOG_ROT_Y_SPAWN);
    expect(bootRotY).toBe(0);
    expect(bootRotY).toBeGreaterThanOrEqual(0);
    expect(bootRotY).toBeLessThan(Math.PI);
    expect(fogRotYAfterRestart()).toBe(bootRotY);

    const leftoverRotY = Math.PI / 2;
    expect(fogRotYFromLook(leftoverRotY)).toBe(leftoverRotY);
    expect(fogRotYFromLook(leftoverRotY)).not.toBe(bootRotY);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(fogRotYFromLook(FOG_ROT_Y)).toBe(bootRotY);
  });

  test("vivo on no cambia rot Y (ctor constant; sync no escribe)", () => {
    const bootRotY = fogRotYAfterRestart();
    const liveRotY = fogRotYFromLook(FOG_ROT_Y);
    expect(liveRotY).toBe(bootRotY);
    expect(liveRotY).toBe(fogRotYAfterRestart());
    expect(liveRotY).toBe(FOG_ROT_Y_SPAWN);

    expect(fogRotYFromLook(FOG_ROT_Y)).toBe(bootRotY);
    expect(fogRotYFromLook(Math.PI / 2)).not.toBe(bootRotY);
  });
});

describe("fog mesh rot Y recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace rot Y fresco; F9 no helper", () => {
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
    expect(fogSrc).toContain("fogRotYAfterRestart(");
    expect(fogSrc).toContain("fogRotYFromLook(");
    expect(fogSrc).toContain("FOG_ROT_Y_SPAWN");
    expect(fogSrc).toMatch(
      /fogRotYAfterRestart\([\s\S]{0,200}fogRotYFromLook\(/,
    );
    expect(viewSrc).toContain("fogRotYAfterRestart(");
    expect(viewSrc).toContain("fogRotYAfterRestart()");
    expect(viewSrc).not.toContain("fogRotYFromLook(");
    expect(viewSrc).toContain("fog.rotation.y = fogRotYAfterRestart()");
    expect(viewSrc).not.toMatch(/fog\.rotation\.y\s*=\s*0/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}fogRotYAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFog\(\): void \{[\s\S]{0,200}fogRotYAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncFov\([\s\S]{0,240}fogRotYAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}fogRotYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}fogRotYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}fogRotYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}fogRotYAfterRestart/,
    );
    expect(gameSrc).not.toContain("fogRotYAfterRestart(");
    expect(gameSrc).not.toContain("fogRotYFromLook(");
    expect(saveSrc).not.toContain("fogRotYAfterRestart");
    expect(saveSrc).not.toContain("fogRotYFromLook");
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
