import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  IMPACT_SPARK_LIGHT_DISTANCE_SPAWN,
  impactSparkLightDistanceAfterRestart,
  impactSparkLightDistanceFromLook,
} from "../src/render/impactSpark";
import { IMPACT_SPARK_LIGHT_DISTANCE } from "../src/render/worldView";

describe("impactSparkLightDistanceAfterRestart (R / softReset)", () => {
  test("distance fresco (idle IMPACT_SPARK_LIGHT_DISTANCE); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDistance = impactSparkLightDistanceAfterRestart();
    expect(bootDistance).toBe(
      impactSparkLightDistanceFromLook(IMPACT_SPARK_LIGHT_DISTANCE),
    );
    expect(bootDistance).toBe(IMPACT_SPARK_LIGHT_DISTANCE);
    expect(bootDistance).toBe(IMPACT_SPARK_LIGHT_DISTANCE_SPAWN);
    expect(bootDistance).toBe(1.8);
    expect(impactSparkLightDistanceAfterRestart()).toBe(bootDistance);

    const leftoverDistance = IMPACT_SPARK_LIGHT_DISTANCE * 2;
    expect(impactSparkLightDistanceFromLook(leftoverDistance)).toBe(
      leftoverDistance,
    );
    expect(impactSparkLightDistanceFromLook(leftoverDistance)).not.toBe(
      bootDistance,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(impactSparkLightDistanceFromLook(IMPACT_SPARK_LIGHT_DISTANCE)).toBe(
      bootDistance,
    );
  });

  test("vivo on no cambia distance (ctor constant; sync no escribe)", () => {
    const bootDistance = impactSparkLightDistanceAfterRestart();
    const liveDistance = impactSparkLightDistanceFromLook(
      IMPACT_SPARK_LIGHT_DISTANCE,
    );
    expect(liveDistance).toBe(bootDistance);
    expect(liveDistance).toBe(impactSparkLightDistanceAfterRestart());
    expect(liveDistance).toBe(IMPACT_SPARK_LIGHT_DISTANCE_SPAWN);

    expect(impactSparkLightDistanceFromLook(IMPACT_SPARK_LIGHT_DISTANCE)).toBe(
      bootDistance,
    );
    expect(
      impactSparkLightDistanceFromLook(IMPACT_SPARK_LIGHT_DISTANCE * 2),
    ).not.toBe(bootDistance);
  });
});

describe("impact spark light distance recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace distance fresco; F9 no helper", () => {
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
    expect(sparkSrc).toContain("impactSparkLightDistanceAfterRestart(");
    expect(sparkSrc).toContain("impactSparkLightDistanceFromLook(");
    expect(sparkSrc).toContain("IMPACT_SPARK_LIGHT_DISTANCE_SPAWN");
    expect(sparkSrc).toMatch(
      /impactSparkLightDistanceAfterRestart\([\s\S]{0,200}impactSparkLightDistanceFromLook\(/,
    );
    expect(viewSrc).toContain("impactSparkLightDistanceAfterRestart(");
    expect(viewSrc).toContain("impactSparkLightDistanceAfterRestart()");
    expect(viewSrc).not.toContain("impactSparkLightDistanceFromLook(");
    expect(viewSrc).toContain(
      "impactSparkLightDistanceAfterRestart(),\n    impactSparkLightDecayAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(\s*impactSparkLightColorAfterRestart\(\),\s*0,\s*IMPACT_SPARK_LIGHT_DISTANCE,\s*impactSparkLightDecayAfterRestart/,
    );
    expect(viewSrc).not.toMatch(/impactLight\.distance\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}impactSparkLightDistanceAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideImpact\(\): void \{[\s\S]{0,200}impactSparkLightDistanceAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3200}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}impactSparkLightDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}impactSparkLightDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}impactSparkLightDistanceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}impactSparkLightDistanceAfterRestart/,
    );
    expect(gameSrc).not.toContain("impactSparkLightDistanceAfterRestart(");
    expect(gameSrc).not.toContain("impactSparkLightDistanceFromLook(");
    expect(saveSrc).not.toContain("impactSparkLightDistanceAfterRestart");
    expect(saveSrc).not.toContain("impactSparkLightDistanceFromLook");
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
