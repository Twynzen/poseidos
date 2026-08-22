import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FACING_CHEVRON_COLOR,
  FACING_CHEVRON_COLOR_SPAWN,
  facingChevronColorAfterRestart,
  facingChevronColorFromLook,
} from "../src/render/facingChevron";

describe("facingChevronColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle FACING_CHEVRON_COLOR 0xffe07a); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootColor = facingChevronColorAfterRestart();
    expect(bootColor).toBe(facingChevronColorFromLook(FACING_CHEVRON_COLOR));
    expect(bootColor).toBe(FACING_CHEVRON_COLOR);
    expect(bootColor).toBe(FACING_CHEVRON_COLOR_SPAWN);
    expect(bootColor).toBe(0xffe07a);
    expect((bootColor >> 16) & 0xff).toBe(0xff);
    expect((bootColor >> 8) & 0xff).toBe(0xe0);
    expect(bootColor & 0xff).toBe(0x7a);
    expect(facingChevronColorAfterRestart()).toBe(bootColor);

    const leftoverColor = 0xe8c36a;
    expect(facingChevronColorFromLook(leftoverColor)).toBe(leftoverColor);
    expect(facingChevronColorFromLook(leftoverColor)).not.toBe(bootColor);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(facingChevronColorFromLook(FACING_CHEVRON_COLOR)).toBe(bootColor);
  });

  test("vivo on no cambia color (ctor constant; sync no escribe)", () => {
    const bootColor = facingChevronColorAfterRestart();
    const liveColor = facingChevronColorFromLook(FACING_CHEVRON_COLOR);
    expect(liveColor).toBe(bootColor);
    expect(liveColor).toBe(facingChevronColorAfterRestart());
    expect(liveColor).toBe(FACING_CHEVRON_COLOR_SPAWN);

    expect(facingChevronColorFromLook(FACING_CHEVRON_COLOR)).toBe(bootColor);
    expect(facingChevronColorFromLook(0xe8c36a)).not.toBe(bootColor);
  });
});

describe("facing chevron mesh color recreate lock (R / softReset)", () => {
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
    const chevronSrc = readFileSync(
      resolve(process.cwd(), "src/render/facingChevron.ts"),
      "utf8",
    );
    expect(chevronSrc).toContain("facingChevronColorAfterRestart(");
    expect(chevronSrc).toContain("facingChevronColorFromLook(");
    expect(chevronSrc).toContain("FACING_CHEVRON_COLOR_SPAWN");
    expect(chevronSrc).toMatch(
      /facingChevronColorAfterRestart\([\s\S]{0,200}facingChevronColorFromLook\(/,
    );
    expect(viewSrc).toContain("facingChevronColorAfterRestart(");
    expect(viewSrc).toContain("facingChevronColorAfterRestart()");
    expect(viewSrc).not.toContain("facingChevronColorFromLook(");
    expect(viewSrc).toContain("color: facingChevronColorAfterRestart()");
    expect(viewSrc).not.toMatch(/color:\s*FACING_CHEVRON_COLOR,/);
    expect(viewSrc).not.toMatch(/chevronMat\.color\s*=/);
    expect(viewSrc).not.toMatch(
      /function hideFacingChevron\(\): void \{[\s\S]{0,200}facingChevronColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function applyFacingChevronVisible\([\s\S]{0,200}facingChevronColorAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function placeFacingChevron\(\): void \{[\s\S]{0,240}facingChevronColorAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}facingChevronColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}facingChevronColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}facingChevronColorAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}facingChevronColorAfterRestart/,
    );
    expect(gameSrc).not.toContain("facingChevronColorAfterRestart(");
    expect(gameSrc).not.toContain("facingChevronColorFromLook(");
    expect(saveSrc).not.toContain("facingChevronColorAfterRestart");
    expect(saveSrc).not.toContain("facingChevronColorFromLook");
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
