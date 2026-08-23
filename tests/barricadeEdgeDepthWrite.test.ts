import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  BARRICADE_EDGE_DEPTH_WRITE,
  BARRICADE_EDGE_DEPTH_WRITE_SPAWN,
  barricadeEdgeDepthWriteAfterRestart,
  barricadeEdgeDepthWriteFromLook,
} from "../src/render/worldView";

describe("barricadeEdgeDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = barricadeEdgeDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      barricadeEdgeDepthWriteFromLook(BARRICADE_EDGE_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(BARRICADE_EDGE_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(BARRICADE_EDGE_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(true);
    expect(barricadeEdgeDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = false;
    expect(barricadeEdgeDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(barricadeEdgeDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
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

    expect(barricadeEdgeDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(barricadeEdgeDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });

  test("vivo on no cambia depthWrite (ctor constant; attach/tick no escriben)", () => {
    const bootDepthWrite = barricadeEdgeDepthWriteAfterRestart();
    const liveDepthWrite = barricadeEdgeDepthWriteFromLook(true);
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(barricadeEdgeDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(BARRICADE_EDGE_DEPTH_WRITE_SPAWN);

    expect(barricadeEdgeDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(barricadeEdgeDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });
});

describe("barricade-edge mesh depthWrite recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("barricadeEdgeDepthWriteAfterRestart(");
    expect(viewSrc).toContain("barricadeEdgeDepthWriteFromLook(");
    expect(viewSrc).toContain("BARRICADE_EDGE_DEPTH_WRITE_SPAWN");
    expect(viewSrc).toMatch(
      /barricadeEdgeDepthWriteAfterRestart\([\s\S]{0,200}barricadeEdgeDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("barricadeEdgeDepthWriteAfterRestart()");
    expect(viewSrc).toContain("depthWrite: barricadeEdgeDepthWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const barricadeEdgeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,1200}depthWrite:\s*true/,
    );
    expect(viewSrc).not.toMatch(/barricadeEdgeMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}barricadeEdgeDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}barricadeEdgeDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}barricadeEdgeDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}barricadeEdgeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}barricadeEdgeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}barricadeEdgeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}barricadeEdgeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("barricadeEdgeDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("barricadeEdgeDepthWriteFromLook(");
    expect(saveSrc).not.toContain("barricadeEdgeDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("barricadeEdgeDepthWriteFromLook");
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
