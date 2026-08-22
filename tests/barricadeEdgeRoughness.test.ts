import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  BARRICADE_EDGE_MESH_ROUGHNESS,
  BARRICADE_EDGE_ROUGHNESS,
  BARRICADE_EDGE_ROUGHNESS_SPAWN,
  barricadeEdgeRoughnessAfterRestart,
  barricadeEdgeRoughnessFromLook,
} from "../src/render/worldView";

describe("barricadeEdgeRoughnessAfterRestart (R / softReset)", () => {
  test("roughness fresco (idle 0.9); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRoughness = barricadeEdgeRoughnessAfterRestart();
    expect(bootRoughness).toBe(barricadeEdgeRoughnessFromLook(BARRICADE_EDGE_MESH_ROUGHNESS));
    expect(bootRoughness).toBe(BARRICADE_EDGE_MESH_ROUGHNESS);
    expect(bootRoughness).toBe(BARRICADE_EDGE_ROUGHNESS);
    expect(bootRoughness).toBe(BARRICADE_EDGE_ROUGHNESS_SPAWN);
    expect(bootRoughness).toBe(0.9);
    expect(barricadeEdgeRoughnessAfterRestart()).toBe(bootRoughness);

    const leftoverRoughness = 0.1;
    expect(barricadeEdgeRoughnessFromLook(leftoverRoughness)).toBe(leftoverRoughness);
    expect(barricadeEdgeRoughnessFromLook(leftoverRoughness)).not.toBe(bootRoughness);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(barricadeEdgeRoughnessFromLook(0.9)).toBe(bootRoughness);
    expect(barricadeEdgeRoughnessFromLook(0.1)).not.toBe(bootRoughness);
  });

  test("vivo on no cambia roughness (ctor constant; attach/tick no escriben)", () => {
    const bootRoughness = barricadeEdgeRoughnessAfterRestart();
    const liveRoughness = barricadeEdgeRoughnessFromLook(0.9);
    expect(liveRoughness).toBe(bootRoughness);
    expect(liveRoughness).toBe(barricadeEdgeRoughnessAfterRestart());
    expect(liveRoughness).toBe(BARRICADE_EDGE_ROUGHNESS_SPAWN);

    expect(barricadeEdgeRoughnessFromLook(0.9)).toBe(bootRoughness);
    expect(barricadeEdgeRoughnessFromLook(0.1)).not.toBe(bootRoughness);
  });
});

describe("barricade-edge mesh roughness recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace roughness fresco; F9 no helper", () => {
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
    expect(viewSrc).toContain("barricadeEdgeRoughnessAfterRestart(");
    expect(viewSrc).toContain("barricadeEdgeRoughnessFromLook(");
    expect(viewSrc).toContain("BARRICADE_EDGE_ROUGHNESS_SPAWN");
    expect(viewSrc).toMatch(
      /barricadeEdgeRoughnessAfterRestart\([\s\S]{0,200}barricadeEdgeRoughnessFromLook\(/,
    );
    expect(viewSrc).toContain("barricadeEdgeRoughnessAfterRestart()");
    expect(viewSrc).toContain("roughness: barricadeEdgeRoughnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const barricadeEdgeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,280}roughness:\s*0\.9(?!\d)/,
    );
    expect(viewSrc).not.toMatch(/barricadeEdgeMat\.roughness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}barricadeEdgeRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}barricadeEdgeRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}barricadeEdgeRoughnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}barricadeEdgeRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}barricadeEdgeRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}barricadeEdgeRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}barricadeEdgeRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("barricadeEdgeRoughnessAfterRestart(");
    expect(gameSrc).not.toContain("barricadeEdgeRoughnessFromLook(");
    expect(saveSrc).not.toContain("barricadeEdgeRoughnessAfterRestart");
    expect(saveSrc).not.toContain("barricadeEdgeRoughnessFromLook");
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
