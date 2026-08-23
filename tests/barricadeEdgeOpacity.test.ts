import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  BARRICADE_EDGE_OPACITY,
  BARRICADE_EDGE_OPACITY_SPAWN,
  barricadeEdgeOpacityAfterRestart,
  barricadeEdgeOpacityFromLook,
} from "../src/render/worldView";

describe("barricadeEdgeOpacityAfterRestart (R / softReset)", () => {
  test("opacity fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootOpacity = barricadeEdgeOpacityAfterRestart();
    expect(bootOpacity).toBe(barricadeEdgeOpacityFromLook(BARRICADE_EDGE_OPACITY));
    expect(bootOpacity).toBe(BARRICADE_EDGE_OPACITY);
    expect(bootOpacity).toBe(BARRICADE_EDGE_OPACITY_SPAWN);
    expect(bootOpacity).toBe(1);
    expect(barricadeEdgeOpacityAfterRestart()).toBe(bootOpacity);

    const leftoverOpacity = 0.42;
    expect(barricadeEdgeOpacityFromLook(leftoverOpacity)).toBe(leftoverOpacity);
    expect(barricadeEdgeOpacityFromLook(leftoverOpacity)).not.toBe(bootOpacity);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(barricadeEdgeOpacityFromLook(1)).toBe(bootOpacity);
    expect(barricadeEdgeOpacityFromLook(0.42)).not.toBe(bootOpacity);
  });

  test("vivo on no cambia opacity (ctor constant; attach/tick no escriben)", () => {
    const bootOpacity = barricadeEdgeOpacityAfterRestart();
    const liveOpacity = barricadeEdgeOpacityFromLook(1);
    expect(liveOpacity).toBe(bootOpacity);
    expect(liveOpacity).toBe(barricadeEdgeOpacityAfterRestart());
    expect(liveOpacity).toBe(BARRICADE_EDGE_OPACITY_SPAWN);

    expect(barricadeEdgeOpacityFromLook(1)).toBe(bootOpacity);
    expect(barricadeEdgeOpacityFromLook(0.42)).not.toBe(bootOpacity);
  });
});

describe("barricade-edge mesh opacity recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace opacity fresco; F9 no helper", () => {
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
    expect(viewSrc).toContain("barricadeEdgeOpacityAfterRestart(");
    expect(viewSrc).toContain("barricadeEdgeOpacityFromLook(");
    expect(viewSrc).toContain("BARRICADE_EDGE_OPACITY_SPAWN");
    expect(viewSrc).toMatch(
      /barricadeEdgeOpacityAfterRestart\([\s\S]{0,200}barricadeEdgeOpacityFromLook\(/,
    );
    expect(viewSrc).toContain("barricadeEdgeOpacityAfterRestart()");
    expect(viewSrc).toContain("opacity: barricadeEdgeOpacityAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const barricadeEdgeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}opacity:\s*1/,
    );
    expect(viewSrc).not.toMatch(/barricadeEdgeMat\.opacity\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}barricadeEdgeOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}barricadeEdgeOpacityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}barricadeEdgeOpacityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}barricadeEdgeOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}barricadeEdgeOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}barricadeEdgeOpacityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}barricadeEdgeOpacityAfterRestart/,
    );
    expect(gameSrc).not.toContain("barricadeEdgeOpacityAfterRestart(");
    expect(gameSrc).not.toContain("barricadeEdgeOpacityFromLook(");
    expect(saveSrc).not.toContain("barricadeEdgeOpacityAfterRestart");
    expect(saveSrc).not.toContain("barricadeEdgeOpacityFromLook");
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
