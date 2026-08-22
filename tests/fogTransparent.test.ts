import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FOG_TRANSPARENT,
  FOG_TRANSPARENT_SPAWN,
  fogTransparentAfterRestart,
  fogTransparentFromLook,
} from "../src/render/fogAtmosphere";

describe("fogTransparentAfterRestart (R / softReset)", () => {
  test("transparent fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootTransparent = fogTransparentAfterRestart();
    expect(bootTransparent).toBe(fogTransparentFromLook(FOG_TRANSPARENT));
    expect(bootTransparent).toBe(FOG_TRANSPARENT);
    expect(bootTransparent).toBe(FOG_TRANSPARENT_SPAWN);
    expect(bootTransparent).toBe(true);
    expect(fogTransparentAfterRestart()).toBe(bootTransparent);

    const leftoverTransparent = false;
    expect(fogTransparentFromLook(leftoverTransparent)).toBe(
      leftoverTransparent,
    );
    expect(fogTransparentFromLook(leftoverTransparent)).not.toBe(
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

    expect(fogTransparentFromLook(FOG_TRANSPARENT)).toBe(bootTransparent);
  });

  test("vivo on no cambia transparent (ctor constant; sync no escribe)", () => {
    const bootTransparent = fogTransparentAfterRestart();
    const liveTransparent = fogTransparentFromLook(FOG_TRANSPARENT);
    expect(liveTransparent).toBe(bootTransparent);
    expect(liveTransparent).toBe(fogTransparentAfterRestart());
    expect(liveTransparent).toBe(FOG_TRANSPARENT_SPAWN);

    expect(fogTransparentFromLook(FOG_TRANSPARENT)).toBe(bootTransparent);
    expect(fogTransparentFromLook(false)).not.toBe(bootTransparent);
  });
});

describe("fog mesh transparent recreate lock (R / softReset)", () => {
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
    const fogSrc = readFileSync(
      resolve(process.cwd(), "src/render/fogAtmosphere.ts"),
      "utf8",
    );
    expect(fogSrc).toContain("fogTransparentAfterRestart(");
    expect(fogSrc).toContain("fogTransparentFromLook(");
    expect(fogSrc).toContain("FOG_TRANSPARENT_SPAWN");
    expect(fogSrc).toMatch(
      /fogTransparentAfterRestart\([\s\S]{0,200}fogTransparentFromLook\(/,
    );
    expect(viewSrc).toContain("fogTransparentAfterRestart(");
    expect(viewSrc).toContain("fogTransparentAfterRestart()");
    expect(viewSrc).not.toContain("fogTransparentFromLook(");
    expect(viewSrc).toContain("transparent: fogTransparentAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const fogMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,240}transparent:\s*true/,
    );
    expect(viewSrc).not.toMatch(/fogMat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}fogTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFog\(\): void \{[\s\S]{0,200}fogTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncFov\([\s\S]{0,240}fogTransparentAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}fogTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}fogTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}fogTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}fogTransparentAfterRestart/,
    );
    expect(gameSrc).not.toContain("fogTransparentAfterRestart(");
    expect(gameSrc).not.toContain("fogTransparentFromLook(");
    expect(saveSrc).not.toContain("fogTransparentAfterRestart");
    expect(saveSrc).not.toContain("fogTransparentFromLook");
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
