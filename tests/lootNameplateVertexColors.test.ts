import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_VERTEX_COLORS,
  LOOT_NAMEPLATE_VERTEX_COLORS_SPAWN,
  lootNameplateVertexColorsAfterRestart,
  lootNameplateVertexColorsFromLook,
} from "../src/render/lootNameplate";

describe("lootNameplateVertexColorsAfterRestart (R / softReset)", () => {
  test("vertexColors fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootVertexColors = lootNameplateVertexColorsAfterRestart();
    expect(bootVertexColors).toBe(
      lootNameplateVertexColorsFromLook(LOOT_NAMEPLATE_VERTEX_COLORS),
    );
    expect(bootVertexColors).toBe(LOOT_NAMEPLATE_VERTEX_COLORS);
    expect(bootVertexColors).toBe(LOOT_NAMEPLATE_VERTEX_COLORS_SPAWN);
    expect(bootVertexColors).toBe(false);
    expect(lootNameplateVertexColorsAfterRestart()).toBe(bootVertexColors);

    const leftoverVertexColors = true;
    expect(lootNameplateVertexColorsFromLook(leftoverVertexColors)).toBe(
      leftoverVertexColors,
    );
    expect(lootNameplateVertexColorsFromLook(leftoverVertexColors)).not.toBe(
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

    expect(lootNameplateVertexColorsFromLook(LOOT_NAMEPLATE_VERTEX_COLORS)).toBe(
      bootVertexColors,
    );
  });

  test("vivo on no cambia vertexColors (ctor constant; sync no escribe)", () => {
    const bootVertexColors = lootNameplateVertexColorsAfterRestart();
    const liveVertexColors = lootNameplateVertexColorsFromLook(
      LOOT_NAMEPLATE_VERTEX_COLORS,
    );
    expect(liveVertexColors).toBe(bootVertexColors);
    expect(liveVertexColors).toBe(lootNameplateVertexColorsAfterRestart());
    expect(liveVertexColors).toBe(LOOT_NAMEPLATE_VERTEX_COLORS_SPAWN);

    expect(lootNameplateVertexColorsFromLook(LOOT_NAMEPLATE_VERTEX_COLORS)).toBe(
      bootVertexColors,
    );
    expect(lootNameplateVertexColorsFromLook(true)).not.toBe(bootVertexColors);
  });
});

describe("loot nameplate sprite vertexColors recreate lock (R / softReset)", () => {
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
    const plateSrc = readFileSync(
      resolve(process.cwd(), "src/render/lootNameplate.ts"),
      "utf8",
    );
    expect(plateSrc).toContain("lootNameplateVertexColorsAfterRestart(");
    expect(plateSrc).toContain("lootNameplateVertexColorsFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_VERTEX_COLORS_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateVertexColorsAfterRestart\([\s\S]{0,200}lootNameplateVertexColorsFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateVertexColorsAfterRestart(");
    expect(viewSrc).toContain("lootNameplateVertexColorsAfterRestart()");
    expect(viewSrc).not.toContain("lootNameplateVertexColorsFromLook(");
    expect(viewSrc).toContain(
      "vertexColors: lootNameplateVertexColorsAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const mat = new THREE\.SpriteMaterial\(\{[\s\S]{0,2400}vertexColors:\s*false/,
    );
    expect(viewSrc).not.toMatch(/plateMat\.vertexColors\s*=/);
    expect(viewSrc).not.toMatch(
      /nameplate\.material[\s\S]{0,80}\.vertexColors\s*=/,
    );
    expect(viewSrc).not.toMatch(
      /function applyLootNameplateLook\([\s\S]{0,400}lootNameplateVertexColorsAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncLootFocus\([\s\S]{0,240}lootNameplateVertexColorsAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /dispose\(\) \{[\s\S]{0,200}lootNameplateVertexColorsAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}lootNameplateVertexColorsAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateVertexColorsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateVertexColorsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateVertexColorsAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateVertexColorsAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateVertexColorsAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateVertexColorsFromLook(");
    expect(saveSrc).not.toContain("lootNameplateVertexColorsAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateVertexColorsFromLook");
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
