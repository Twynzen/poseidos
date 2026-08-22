import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_CONE_VERTEX_COLORS,
  FLASHLIGHT_CONE_VERTEX_COLORS_SPAWN,
  flashlightConeVertexColorsAfterRestart,
  flashlightConeVertexColorsFromLook,
} from "../src/render/flashlightCone";

describe("flashlightConeVertexColorsAfterRestart (R / softReset)", () => {
  test("vertexColors fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootVertexColors = flashlightConeVertexColorsAfterRestart();
    expect(bootVertexColors).toBe(
      flashlightConeVertexColorsFromLook(FLASHLIGHT_CONE_VERTEX_COLORS),
    );
    expect(bootVertexColors).toBe(FLASHLIGHT_CONE_VERTEX_COLORS);
    expect(bootVertexColors).toBe(FLASHLIGHT_CONE_VERTEX_COLORS_SPAWN);
    expect(bootVertexColors).toBe(true);
    expect(flashlightConeVertexColorsAfterRestart()).toBe(bootVertexColors);

    const leftoverVertexColors = false;
    expect(flashlightConeVertexColorsFromLook(leftoverVertexColors)).toBe(
      leftoverVertexColors,
    );
    expect(flashlightConeVertexColorsFromLook(leftoverVertexColors)).not.toBe(
      bootVertexColors,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(flashlightConeVertexColorsFromLook(FLASHLIGHT_CONE_VERTEX_COLORS)).toBe(
      bootVertexColors,
    );
  });

  test("vivo on no cambia vertexColors (ctor constant; sync no escribe)", () => {
    const bootVertexColors = flashlightConeVertexColorsAfterRestart();
    const liveVertexColors = flashlightConeVertexColorsFromLook(
      FLASHLIGHT_CONE_VERTEX_COLORS,
    );
    expect(liveVertexColors).toBe(bootVertexColors);
    expect(liveVertexColors).toBe(flashlightConeVertexColorsAfterRestart());
    expect(liveVertexColors).toBe(FLASHLIGHT_CONE_VERTEX_COLORS_SPAWN);

    expect(flashlightConeVertexColorsFromLook(FLASHLIGHT_CONE_VERTEX_COLORS)).toBe(
      bootVertexColors,
    );
    expect(flashlightConeVertexColorsFromLook(false)).not.toBe(bootVertexColors);
  });
});

describe("flashlight cone mesh vertexColors recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace vertexColors fresco; F9 no helper", () => {
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
    expect(coneSrc).toContain("flashlightConeVertexColorsAfterRestart(");
    expect(coneSrc).toContain("flashlightConeVertexColorsFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_CONE_VERTEX_COLORS_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightConeVertexColorsAfterRestart\([\s\S]{0,200}flashlightConeVertexColorsFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightConeVertexColorsAfterRestart(");
    expect(viewSrc).toContain("flashlightConeVertexColorsAfterRestart()");
    expect(viewSrc).not.toContain("flashlightConeVertexColorsFromLook(");
    expect(viewSrc).toContain(
      "vertexColors: flashlightConeVertexColorsAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const coneMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}vertexColors:\s*true/,
    );
    expect(viewSrc).not.toMatch(/coneMat\.vertexColors\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightConeVertexColorsAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightConeVertexColorsAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncTorchLight\([\s\S]{0,240}flashlightConeVertexColorsAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightConeVertexColorsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightConeVertexColorsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightConeVertexColorsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightConeVertexColorsAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightConeVertexColorsAfterRestart(");
    expect(gameSrc).not.toContain("flashlightConeVertexColorsFromLook(");
    expect(saveSrc).not.toContain("flashlightConeVertexColorsAfterRestart");
    expect(saveSrc).not.toContain("flashlightConeVertexColorsFromLook");
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
