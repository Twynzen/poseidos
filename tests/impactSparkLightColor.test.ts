import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  IMPACT_SPARK_LIGHT_COLOR_SPAWN,
  impactSparkLightColorAfterRestart,
  impactSparkLightColorFromLook,
} from "../src/render/impactSpark";
import { IMPACT_SPARK_LIGHT_COLOR } from "../src/render/worldView";

describe("impactSparkLightColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle IMPACT_SPARK_LIGHT_COLOR 0xffef93); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = impactSparkLightColorAfterRestart();
    expect(bootColor).toBe(impactSparkLightColorFromLook(IMPACT_SPARK_LIGHT_COLOR));
    expect(bootColor).toBe(IMPACT_SPARK_LIGHT_COLOR);
    expect(bootColor).toBe(IMPACT_SPARK_LIGHT_COLOR_SPAWN);
    expect(bootColor).toBe(0xffef93);
    expect((bootColor >> 16) & 0xff).toBe(0xff);
    expect((bootColor >> 8) & 0xff).toBe(0xef);
    expect(bootColor & 0xff).toBe(0x93);
    expect(impactSparkLightColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xffd080;
    expect(impactSparkLightColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(impactSparkLightColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(impactSparkLightColorFromLook(IMPACT_SPARK_LIGHT_COLOR)).toBe(
      bootColor,
    );
  });

  test("vivo on no cambia color (ctor constant; sync no escribe)", () => {
    const bootColor = impactSparkLightColorAfterRestart();
    const liveColor = impactSparkLightColorFromLook(IMPACT_SPARK_LIGHT_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(impactSparkLightColorAfterRestart());
    expect(liveColor).toBe(IMPACT_SPARK_LIGHT_COLOR_SPAWN);

    expect(impactSparkLightColorFromLook(IMPACT_SPARK_LIGHT_COLOR)).toBe(
      bootColor,
    );
    expect(impactSparkLightColorFromLook(0xffd080)).not.toBe(bootColor);
  });
});

describe("impact spark light color recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace color fresco; F9 no helper", () => {
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
    expect(sparkSrc).toContain("impactSparkLightColorAfterRestart(");
    expect(sparkSrc).toContain("impactSparkLightColorFromLook(");
    expect(sparkSrc).toContain("IMPACT_SPARK_LIGHT_COLOR_SPAWN");
    expect(sparkSrc).toMatch(
      /impactSparkLightColorAfterRestart\([\s\S]{0,200}impactSparkLightColorFromLook\(/,
    );
    expect(viewSrc).toContain("impactSparkLightColorAfterRestart(");
    expect(viewSrc).toContain("impactSparkLightColorAfterRestart()");
    expect(viewSrc).not.toContain("impactSparkLightColorFromLook(");
    expect(viewSrc).toContain(
      "new THREE.PointLight(\n    impactSparkLightColorAfterRestart(),",
    );
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(\s*IMPACT_SPARK_LIGHT_COLOR,\s*0,\s*IMPACT_SPARK_LIGHT_DISTANCE,\s*impactSparkLightDecayAfterRestart/,
    );
    expect(viewSrc).not.toMatch(/impactLight\.color\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}impactSparkLightColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideImpact\(\): void \{[\s\S]{0,200}impactSparkLightColorAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3400}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}impactSparkLightColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}impactSparkLightColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}impactSparkLightColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}impactSparkLightColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("impactSparkLightColorAfterRestart(");
    expect(gameSrc).not.toContain("impactSparkLightColorFromLook(");
    expect(saveSrc).not.toContain("impactSparkLightColorAfterRestart");
    expect(saveSrc).not.toContain("impactSparkLightColorFromLook");
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
