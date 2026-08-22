import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  IMPACT_SPARK_COLOR_SPAWN,
  impactSparkColorAfterRestart,
  impactSparkColorFromLook,
} from "../src/render/impactSpark";
import { IMPACT_SPARK_COLOR } from "../src/render/worldView";

describe("impactSparkColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle IMPACT_SPARK_COLOR 0xffef93); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = impactSparkColorAfterRestart();
    expect(bootColor).toBe(impactSparkColorFromLook(IMPACT_SPARK_COLOR));
    expect(bootColor).toBe(IMPACT_SPARK_COLOR);
    expect(bootColor).toBe(IMPACT_SPARK_COLOR_SPAWN);
    expect(bootColor).toBe(0xffef93);
    expect((bootColor >> 16) & 0xff).toBe(0xff);
    expect((bootColor >> 8) & 0xff).toBe(0xef);
    expect(bootColor & 0xff).toBe(0x93);
    expect(impactSparkColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xffd080;
    expect(impactSparkColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(impactSparkColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(impactSparkColorFromLook(IMPACT_SPARK_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; sync no escribe)", () => {
    const bootColor = impactSparkColorAfterRestart();
    const liveColor = impactSparkColorFromLook(IMPACT_SPARK_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(impactSparkColorAfterRestart());
    expect(liveColor).toBe(IMPACT_SPARK_COLOR_SPAWN);

    expect(impactSparkColorFromLook(IMPACT_SPARK_COLOR)).toBe(bootColor);
    expect(impactSparkColorFromLook(0xffd080)).not.toBe(bootColor);
  });
});

describe("impact spark mesh color recreate lock (R / softReset)", () => {
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
    expect(sparkSrc).toContain("impactSparkColorAfterRestart(");
    expect(sparkSrc).toContain("impactSparkColorFromLook(");
    expect(sparkSrc).toContain("IMPACT_SPARK_COLOR_SPAWN");
    expect(sparkSrc).toMatch(
      /impactSparkColorAfterRestart\([\s\S]{0,200}impactSparkColorFromLook\(/,
    );
    expect(viewSrc).toContain("impactSparkColorAfterRestart(");
    expect(viewSrc).toContain("impactSparkColorAfterRestart()");
    expect(viewSrc).not.toContain("impactSparkColorFromLook(");
    expect(viewSrc).toContain("color: impactSparkColorAfterRestart()");
    expect(viewSrc).not.toMatch(/color:\s*IMPACT_SPARK_COLOR,/);
    expect(viewSrc).not.toMatch(/impactMat\.color\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}impactSparkColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideImpact\(\): void \{[\s\S]{0,200}impactSparkColorAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3300}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}impactSparkColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}impactSparkColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}impactSparkColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}impactSparkColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("impactSparkColorAfterRestart(");
    expect(gameSrc).not.toContain("impactSparkColorFromLook(");
    expect(saveSrc).not.toContain("impactSparkColorAfterRestart");
    expect(saveSrc).not.toContain("impactSparkColorFromLook");
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
