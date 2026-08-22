import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_CONE_SIDE,
  FLASHLIGHT_CONE_SIDE_SPAWN,
  flashlightConeSideAfterRestart,
  flashlightConeSideFromLook,
} from "../src/render/flashlightCone";

describe("flashlightConeSideAfterRestart (R / softReset)", () => {
  test("side fresco (idle THREE.DoubleSide / 2); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootSide = flashlightConeSideAfterRestart();
    expect(bootSide).toBe(flashlightConeSideFromLook(FLASHLIGHT_CONE_SIDE));
    expect(bootSide).toBe(FLASHLIGHT_CONE_SIDE);
    expect(bootSide).toBe(FLASHLIGHT_CONE_SIDE_SPAWN);
    expect(bootSide).toBe(2);
    expect(flashlightConeSideAfterRestart()).toBe(bootSide);

    const leftoverSide = 0;
    expect(flashlightConeSideFromLook(leftoverSide)).toBe(leftoverSide);
    expect(flashlightConeSideFromLook(leftoverSide)).not.toBe(bootSide);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(flashlightConeSideFromLook(FLASHLIGHT_CONE_SIDE)).toBe(bootSide);
  });

  test("vivo on no cambia side (ctor constant; sync no escribe)", () => {
    const bootSide = flashlightConeSideAfterRestart();
    const liveSide = flashlightConeSideFromLook(FLASHLIGHT_CONE_SIDE);
    expect(liveSide).toBe(bootSide);
    expect(liveSide).toBe(flashlightConeSideAfterRestart());
    expect(liveSide).toBe(FLASHLIGHT_CONE_SIDE_SPAWN);

    expect(flashlightConeSideFromLook(FLASHLIGHT_CONE_SIDE)).toBe(bootSide);
    expect(flashlightConeSideFromLook(0)).not.toBe(bootSide);
  });
});

describe("flashlight cone mesh side recreate lock (R / softReset)", () => {
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
    const coneSrc = readFileSync(
      resolve(process.cwd(), "src/render/flashlightCone.ts"),
      "utf8",
    );
    expect(coneSrc).toContain("flashlightConeSideAfterRestart(");
    expect(coneSrc).toContain("flashlightConeSideFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_CONE_SIDE_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightConeSideAfterRestart\([\s\S]{0,200}flashlightConeSideFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightConeSideAfterRestart(");
    expect(viewSrc).toContain("flashlightConeSideAfterRestart()");
    expect(viewSrc).not.toContain("flashlightConeSideFromLook(");
    expect(viewSrc).toContain("side: flashlightConeSideAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const coneMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,720}side:\s*THREE\.DoubleSide/,
    );
    expect(viewSrc).not.toMatch(/coneMat\.side\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightConeSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightConeSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncTorchLight\([\s\S]{0,240}flashlightConeSideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightConeSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightConeSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightConeSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightConeSideAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightConeSideAfterRestart(");
    expect(gameSrc).not.toContain("flashlightConeSideFromLook(");
    expect(saveSrc).not.toContain("flashlightConeSideAfterRestart");
    expect(saveSrc).not.toContain("flashlightConeSideFromLook");
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
