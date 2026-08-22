import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FOG_Y,
  FOG_Y_SPAWN,
  fogYAfterRestart,
  fogYFromLook,
} from "../src/render/fogAtmosphere";

describe("fogYAfterRestart (R / softReset)", () => {
  test("Y fresco (idle FOG_Y 0.02); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootY = fogYAfterRestart();
    expect(bootY).toBe(fogYFromLook(FOG_Y));
    expect(bootY).toBe(FOG_Y);
    expect(bootY).toBe(FOG_Y_SPAWN);
    expect(bootY).toBe(0.02);
    expect(bootY).toBeGreaterThan(0);
    expect(bootY).toBeLessThan(0.1);
    expect(fogYAfterRestart()).toBe(bootY);

    const leftoverY = 0.1;
    expect(fogYFromLook(leftoverY)).toBe(leftoverY);
    expect(fogYFromLook(leftoverY)).not.toBe(bootY);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(fogYFromLook(FOG_Y)).toBe(bootY);
  });

  test("vivo on no cambia Y (ctor constant; sync no escribe)", () => {
    const bootY = fogYAfterRestart();
    const liveY = fogYFromLook(FOG_Y);
    expect(liveY).toBe(bootY);
    expect(liveY).toBe(fogYAfterRestart());
    expect(liveY).toBe(FOG_Y_SPAWN);

    expect(fogYFromLook(FOG_Y)).toBe(bootY);
    expect(fogYFromLook(0.1)).not.toBe(bootY);
  });
});

describe("fog mesh Y recreate lock (R / softReset)", () => {
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
    const fogSrc = readFileSync(
      resolve(process.cwd(), "src/render/fogAtmosphere.ts"),
      "utf8",
    );
    expect(fogSrc).toContain("fogYAfterRestart(");
    expect(fogSrc).toContain("fogYFromLook(");
    expect(fogSrc).toContain("FOG_Y_SPAWN");
    expect(fogSrc).toMatch(
      /fogYAfterRestart\([\s\S]{0,200}fogYFromLook\(/,
    );
    expect(viewSrc).toContain("fogYAfterRestart(");
    expect(viewSrc).toContain("fogYAfterRestart()");
    expect(viewSrc).not.toContain("fogYFromLook(");
    expect(viewSrc).toContain(
      "fog.position.set(x + 0.5, fogYAfterRestart(), y + 0.5)",
    );
    expect(viewSrc).not.toMatch(/fog\.position\.set\([^,]+,\s*0\.02,/);
    expect(viewSrc).not.toMatch(/fog\.position\.y\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}fogYAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFog\(\): void \{[\s\S]{0,200}fogYAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncFov\([\s\S]{0,240}fogYAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}fogYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}fogYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}fogYAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}fogYAfterRestart/,
    );
    expect(gameSrc).not.toContain("fogYAfterRestart(");
    expect(gameSrc).not.toContain("fogYFromLook(");
    expect(saveSrc).not.toContain("fogYAfterRestart");
    expect(saveSrc).not.toContain("fogYFromLook");
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
