import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  IMPACT_SPARK_BLENDING,
  IMPACT_SPARK_BLENDING_SPAWN,
  impactSparkBlendingAfterRestart,
  impactSparkBlendingFromLook,
} from "../src/render/impactSpark";

describe("impactSparkBlendingAfterRestart (R / softReset)", () => {
  test("blending fresco (idle THREE.AdditiveBlending / 2); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootBlending = impactSparkBlendingAfterRestart();
    expect(bootBlending).toBe(impactSparkBlendingFromLook(IMPACT_SPARK_BLENDING));
    expect(bootBlending).toBe(IMPACT_SPARK_BLENDING);
    expect(bootBlending).toBe(IMPACT_SPARK_BLENDING_SPAWN);
    expect(bootBlending).toBe(2);
    expect(impactSparkBlendingAfterRestart()).toBe(bootBlending);

    const leftoverBlending = 1;
    expect(impactSparkBlendingFromLook(leftoverBlending)).toBe(leftoverBlending);
    expect(impactSparkBlendingFromLook(leftoverBlending)).not.toBe(bootBlending);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(impactSparkBlendingFromLook(IMPACT_SPARK_BLENDING)).toBe(bootBlending);
  });

  test("vivo on no cambia blending (ctor constant; place/tick no escriben)", () => {
    const bootBlending = impactSparkBlendingAfterRestart();
    const liveBlending = impactSparkBlendingFromLook(IMPACT_SPARK_BLENDING);
    expect(liveBlending).toBe(bootBlending);
    expect(liveBlending).toBe(impactSparkBlendingAfterRestart());
    expect(liveBlending).toBe(IMPACT_SPARK_BLENDING_SPAWN);

    expect(impactSparkBlendingFromLook(IMPACT_SPARK_BLENDING)).toBe(bootBlending);
    expect(impactSparkBlendingFromLook(1)).not.toBe(bootBlending);
  });
});

describe("impact spark mesh blending recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace blending fresco; F9 no helper", () => {
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
    expect(sparkSrc).toContain("impactSparkBlendingAfterRestart(");
    expect(sparkSrc).toContain("impactSparkBlendingFromLook(");
    expect(sparkSrc).toContain("IMPACT_SPARK_BLENDING_SPAWN");
    expect(sparkSrc).toMatch(
      /impactSparkBlendingAfterRestart\([\s\S]{0,200}impactSparkBlendingFromLook\(/,
    );
    expect(viewSrc).toContain("impactSparkBlendingAfterRestart(");
    expect(viewSrc).toContain("impactSparkBlendingAfterRestart()");
    expect(viewSrc).not.toContain("impactSparkBlendingFromLook(");
    expect(viewSrc).toContain("blending: impactSparkBlendingAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const impactMat = new THREE\.MeshBasicMaterial\(\{[\s\S]{0,720}blending:\s*THREE\.AdditiveBlending/,
    );
    expect(viewSrc).not.toMatch(/impactMat\.blending\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}impactSparkBlendingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideImpact\(\): void \{[\s\S]{0,200}impactSparkBlendingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function applyImpactSparkVisual\([\s\S]{0,240}impactSparkBlendingAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function tickImpact\([\s\S]{0,240}impactSparkBlendingAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}impactSparkBlendingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}impactSparkBlendingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}impactSparkBlendingAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}impactSparkBlendingAfterRestart/,
    );
    expect(gameSrc).not.toContain("impactSparkBlendingAfterRestart(");
    expect(gameSrc).not.toContain("impactSparkBlendingFromLook(");
    expect(saveSrc).not.toContain("impactSparkBlendingAfterRestart");
    expect(saveSrc).not.toContain("impactSparkBlendingFromLook");
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
