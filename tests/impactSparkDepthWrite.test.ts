import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  IMPACT_SPARK_DEPTH_WRITE,
  IMPACT_SPARK_DEPTH_WRITE_SPAWN,
  impactSparkDepthWriteAfterRestart,
  impactSparkDepthWriteFromLook,
} from "../src/render/impactSpark";

describe("impactSparkDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = impactSparkDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      impactSparkDepthWriteFromLook(IMPACT_SPARK_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(IMPACT_SPARK_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(IMPACT_SPARK_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(false);
    expect(impactSparkDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = true;
    expect(impactSparkDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(impactSparkDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
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

    expect(impactSparkDepthWriteFromLook(IMPACT_SPARK_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
  });

  test("vivo on no cambia depthWrite (ctor constant; sync no escribe)", () => {
    const bootDepthWrite = impactSparkDepthWriteAfterRestart();
    const liveDepthWrite = impactSparkDepthWriteFromLook(
      IMPACT_SPARK_DEPTH_WRITE,
    );
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(impactSparkDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(IMPACT_SPARK_DEPTH_WRITE_SPAWN);

    expect(impactSparkDepthWriteFromLook(IMPACT_SPARK_DEPTH_WRITE)).toBe(
      bootDepthWrite,
    );
    expect(impactSparkDepthWriteFromLook(true)).not.toBe(bootDepthWrite);
  });
});

describe("impact spark mesh depthWrite recreate lock (R / softReset)", () => {
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
    const sparkSrc = readFileSync(
      resolve(process.cwd(), "src/render/impactSpark.ts"),
      "utf8",
    );
    expect(sparkSrc).toContain("impactSparkDepthWriteAfterRestart(");
    expect(sparkSrc).toContain("impactSparkDepthWriteFromLook(");
    expect(sparkSrc).toContain("IMPACT_SPARK_DEPTH_WRITE_SPAWN");
    expect(sparkSrc).toMatch(
      /impactSparkDepthWriteAfterRestart\([\s\S]{0,200}impactSparkDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("impactSparkDepthWriteAfterRestart(");
    expect(viewSrc).toContain("impactSparkDepthWriteAfterRestart()");
    expect(viewSrc).not.toContain("impactSparkDepthWriteFromLook(");
    expect(viewSrc).toContain(
      "depthWrite: impactSparkDepthWriteAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const impactMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,560}depthWrite:\s*false/,
    );
    expect(viewSrc).not.toMatch(/impactMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}impactSparkDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideImpact\(\): void \{[\s\S]{0,200}impactSparkDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /applyImpactSparkVisual\([\s\S]{0,240}impactSparkDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}impactSparkDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}impactSparkDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}impactSparkDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}impactSparkDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("impactSparkDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("impactSparkDepthWriteFromLook(");
    expect(saveSrc).not.toContain("impactSparkDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("impactSparkDepthWriteFromLook");
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
