import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_CONE_DEPTH_WRITE,
  FLASHLIGHT_CONE_DEPTH_WRITE_SPAWN,
  flashlightConeDepthWriteAfterRestart,
  flashlightConeDepthWriteFromLook,
} from "../src/render/flashlightCone";

describe("flashlightConeDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = flashlightConeDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      flashlightConeDepthWriteFromLook(FLASHLIGHT_CONE_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(FLASHLIGHT_CONE_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(FLASHLIGHT_CONE_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(false);
    expect(flashlightConeDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = true;
    expect(flashlightConeDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(flashlightConeDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
      bootDepthWrite,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(flashlightConeDepthWriteFromLook(FLASHLIGHT_CONE_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
  });

  test("vivo on no cambia depthWrite (ctor constant; sync no escribe)", () => {
    const bootDepthWrite = flashlightConeDepthWriteAfterRestart();
    const liveDepthWrite = flashlightConeDepthWriteFromLook(
      FLASHLIGHT_CONE_DEPTH_WRITE,
    );
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(flashlightConeDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(FLASHLIGHT_CONE_DEPTH_WRITE_SPAWN);

    expect(flashlightConeDepthWriteFromLook(FLASHLIGHT_CONE_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
    expect(flashlightConeDepthWriteFromLook(true)).not.toBe(bootDepthWrite);
  });
});

describe("flashlight cone mesh depthWrite recreate lock (R / softReset)", () => {
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
    const coneSrc = readFileSync(
      resolve(process.cwd(), "src/render/flashlightCone.ts"),
      "utf8",
    );
    expect(coneSrc).toContain("flashlightConeDepthWriteAfterRestart(");
    expect(coneSrc).toContain("flashlightConeDepthWriteFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_CONE_DEPTH_WRITE_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightConeDepthWriteAfterRestart\([\s\S]{0,200}flashlightConeDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightConeDepthWriteAfterRestart(");
    expect(viewSrc).toContain("flashlightConeDepthWriteAfterRestart()");
    expect(viewSrc).not.toContain("flashlightConeDepthWriteFromLook(");
    expect(viewSrc).toContain(
      "depthWrite: flashlightConeDepthWriteAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const coneMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}depthWrite:\s*false/,
    );
    expect(viewSrc).not.toMatch(/coneMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightConeDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightConeDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncTorchLight\([\s\S]{0,240}flashlightConeDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightConeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightConeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightConeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightConeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightConeDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("flashlightConeDepthWriteFromLook(");
    expect(saveSrc).not.toContain("flashlightConeDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("flashlightConeDepthWriteFromLook");
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
