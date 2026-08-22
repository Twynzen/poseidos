import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FOG_DEPTH_WRITE,
  FOG_DEPTH_WRITE_SPAWN,
  fogDepthWriteAfterRestart,
  fogDepthWriteFromLook,
} from "../src/render/fogAtmosphere";

describe("fogDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = fogDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(fogDepthWriteFromLook(FOG_DEPTH_WRITE));
    expect(bootDepthWrite).toBe(FOG_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(FOG_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(false);
    expect(fogDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = true;
    expect(fogDepthWriteFromLook(leftoverDepthWrite)).toBe(leftoverDepthWrite);
    expect(fogDepthWriteFromLook(leftoverDepthWrite)).not.toBe(bootDepthWrite);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(fogDepthWriteFromLook(FOG_DEPTH_WRITE)).toBe(bootDepthWrite);
  });

  test("vivo on no cambia depthWrite (ctor constant; sync no escribe)", () => {
    const bootDepthWrite = fogDepthWriteAfterRestart();
    const liveDepthWrite = fogDepthWriteFromLook(FOG_DEPTH_WRITE);
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(fogDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(FOG_DEPTH_WRITE_SPAWN);

    expect(fogDepthWriteFromLook(FOG_DEPTH_WRITE)).toBe(bootDepthWrite);
    expect(fogDepthWriteFromLook(true)).not.toBe(bootDepthWrite);
  });
});

describe("fog mesh depthWrite recreate lock (R / softReset)", () => {
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
    const fogSrc = readFileSync(
      resolve(process.cwd(), "src/render/fogAtmosphere.ts"),
      "utf8",
    );
    expect(fogSrc).toContain("fogDepthWriteAfterRestart(");
    expect(fogSrc).toContain("fogDepthWriteFromLook(");
    expect(fogSrc).toContain("FOG_DEPTH_WRITE_SPAWN");
    expect(fogSrc).toMatch(
      /fogDepthWriteAfterRestart\([\s\S]{0,200}fogDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("fogDepthWriteAfterRestart(");
    expect(viewSrc).toContain("fogDepthWriteAfterRestart()");
    expect(viewSrc).not.toContain("fogDepthWriteFromLook(");
    expect(viewSrc).toContain("depthWrite: fogDepthWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const fogMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,320}depthWrite:\s*false/,
    );
    expect(viewSrc).not.toMatch(/fogMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}fogDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFog\(\): void \{[\s\S]{0,200}fogDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function syncFov\([\s\S]{0,240}fogDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}fogDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}fogDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}fogDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}fogDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("fogDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("fogDepthWriteFromLook(");
    expect(saveSrc).not.toContain("fogDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("fogDepthWriteFromLook");
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
