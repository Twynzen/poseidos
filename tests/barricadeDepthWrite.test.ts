import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  BARRICADE_DEPTH_WRITE,
  BARRICADE_DEPTH_WRITE_SPAWN,
  barricadeDepthWriteAfterRestart,
  barricadeDepthWriteFromLook,
} from "../src/render/worldView";

describe("barricadeDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = barricadeDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      barricadeDepthWriteFromLook(BARRICADE_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(BARRICADE_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(BARRICADE_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(true);
    expect(barricadeDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = false;
    expect(barricadeDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(barricadeDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
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

    expect(barricadeDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(barricadeDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });

  test("vivo on no cambia depthWrite (ctor constant; attach/tick no escriben)", () => {
    const bootDepthWrite = barricadeDepthWriteAfterRestart();
    const liveDepthWrite = barricadeDepthWriteFromLook(true);
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(barricadeDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(BARRICADE_DEPTH_WRITE_SPAWN);

    expect(barricadeDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(barricadeDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });
});

describe("barricade mesh depthWrite recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("barricadeDepthWriteAfterRestart(");
    expect(viewSrc).toContain("barricadeDepthWriteFromLook(");
    expect(viewSrc).toContain("BARRICADE_DEPTH_WRITE_SPAWN");
    expect(viewSrc).toMatch(
      /barricadeDepthWriteAfterRestart\([\s\S]{0,200}barricadeDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("barricadeDepthWriteAfterRestart()");
    expect(viewSrc).toContain("depthWrite: barricadeDepthWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const barricadeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,1200}depthWrite:\s*true/,
    );
    expect(viewSrc).not.toMatch(/barricadeMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}barricadeDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}barricadeDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}barricadeDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}barricadeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}barricadeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}barricadeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}barricadeDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("barricadeDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("barricadeDepthWriteFromLook(");
    expect(saveSrc).not.toContain("barricadeDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("barricadeDepthWriteFromLook");
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
