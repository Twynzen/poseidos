import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  WARM_LIGHT_Y_SPAWN,
  warmLightYAfterRestart,
  warmLightYFromLook,
} from "../src/world/indoor";
import { WARM_LIGHT_Y } from "../src/render/worldView";

const LEFTOVER_CTOR_Y = 1.6;

describe("warmLightYAfterRestart (R / softReset)", () => {
  test("Y fresco (idle WARM_LIGHT_Y 1.7825); leftover ctor 1.6 / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootY = warmLightYAfterRestart();
    expect(bootY).toBe(warmLightYFromLook(WARM_LIGHT_Y));
    expect(bootY).toBe(WARM_LIGHT_Y);
    expect(bootY).toBe(1.7825);
    expect(bootY).toBe(WARM_LIGHT_Y_SPAWN);
    expect(bootY).not.toBe(LEFTOVER_CTOR_Y);
    expect(warmLightYAfterRestart()).toBe(bootY);

    const leftoverY = LEFTOVER_CTOR_Y;
    expect(warmLightYFromLook(leftoverY)).toBe(leftoverY);
    expect(warmLightYFromLook(leftoverY)).not.toBe(bootY);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(warmLightYFromLook(WARM_LIGHT_Y)).toBe(bootY);
  });

  test("vivo on = boot (Y no cambia)", () => {
    const bootY = warmLightYAfterRestart();
    const liveY = warmLightYFromLook(WARM_LIGHT_Y);
    expect(liveY).toBe(WARM_LIGHT_Y);
    expect(liveY).toBe(bootY);
    expect(liveY).toBe(warmLightYAfterRestart());
    expect(liveY).toBe(WARM_LIGHT_Y_SPAWN);

    expect(warmLightYFromLook(WARM_LIGHT_Y)).toBe(bootY);
    expect(warmLightYFromLook(LEFTOVER_CTOR_Y)).not.toBe(bootY);
  });
});

describe("warm light Y recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace Y fresco; F9 no helper", () => {
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
    const indoorSrc = readFileSync(
      resolve(process.cwd(), "src/world/indoor.ts"),
      "utf8",
    );
    expect(indoorSrc).toContain("warmLightYAfterRestart(");
    expect(indoorSrc).toContain("warmLightYFromLook(");
    expect(indoorSrc).toContain("WARM_LIGHT_Y_SPAWN");
    expect(indoorSrc).toMatch(
      /warmLightYAfterRestart\([\s\S]{0,200}warmLightYFromLook\(/,
    );
    expect(viewSrc).toContain("warmLightYAfterRestart(");
    expect(viewSrc).toContain("warmLightYFromLook(");
    expect(viewSrc).toContain("warmLightYAfterRestart()");
    expect(viewSrc).toContain("warmLightYFromLook(WARM_LIGHT_Y)");
    expect(viewSrc).not.toMatch(
      /warmLight\.position\.set\(warmLightOriginXAfterRestart\(\), 1\.6, warmLightOriginZAfterRestart\(\)\)/,
    );
    expect(viewSrc).not.toMatch(
      /warmLight\.position\.set\(warmLightOriginXFromLook\(wx\), WARM_LIGHT_Y, warmLightOriginZFromLook\(wy\)\)/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}warmLightYAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}warmLightYAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}warmLightYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}warmLightYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}warmLightYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}warmLightYAfterRestart/,
    );
    expect(gameSrc).not.toContain("warmLightYAfterRestart(");
    expect(gameSrc).not.toContain("warmLightYFromLook(");
    expect(saveSrc).not.toContain("warmLightYAfterRestart");
    expect(saveSrc).not.toContain("warmLightYFromLook");
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
