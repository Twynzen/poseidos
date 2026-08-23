import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  BARRICADE_SIDE,
  BARRICADE_SIDE_SPAWN,
  barricadeSideAfterRestart,
  barricadeSideFromLook,
} from "../src/render/worldView";

describe("barricadeSideAfterRestart (R / softReset)", () => {
  test("side fresco (idle THREE.FrontSide / 0); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootSide = barricadeSideAfterRestart();
    expect(bootSide).toBe(barricadeSideFromLook(BARRICADE_SIDE));
    expect(bootSide).toBe(BARRICADE_SIDE);
    expect(bootSide).toBe(BARRICADE_SIDE_SPAWN);
    expect(bootSide).toBe(0);
    expect(barricadeSideAfterRestart()).toBe(bootSide);

    const leftoverSide = 2;
    expect(barricadeSideFromLook(leftoverSide)).toBe(leftoverSide);
    expect(barricadeSideFromLook(leftoverSide)).not.toBe(bootSide);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(barricadeSideFromLook(BARRICADE_SIDE)).toBe(bootSide);
    expect(barricadeSideFromLook(2)).not.toBe(bootSide);
  });

  test("vivo on no cambia side (ctor constant; attach/tick no escriben)", () => {
    const bootSide = barricadeSideAfterRestart();
    const liveSide = barricadeSideFromLook(BARRICADE_SIDE);
    expect(liveSide).toBe(bootSide);
    expect(liveSide).toBe(barricadeSideAfterRestart());
    expect(liveSide).toBe(BARRICADE_SIDE_SPAWN);

    expect(barricadeSideFromLook(BARRICADE_SIDE)).toBe(bootSide);
    expect(barricadeSideFromLook(2)).not.toBe(bootSide);
  });
});

describe("barricade mesh side recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace side fresco; F9 no helper", () => {
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
    expect(viewSrc).toContain("barricadeSideAfterRestart(");
    expect(viewSrc).toContain("barricadeSideFromLook(");
    expect(viewSrc).toContain("BARRICADE_SIDE_SPAWN");
    expect(viewSrc).toMatch(
      /barricadeSideAfterRestart\([\s\S]{0,200}barricadeSideFromLook\(/,
    );
    expect(viewSrc).toContain("barricadeSideAfterRestart()");
    expect(viewSrc).toContain("side: barricadeSideAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const barricadeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,1200}side:\s*THREE\.FrontSide/,
    );
    expect(viewSrc).not.toMatch(
      /const barricadeMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,1200}side:\s*0/,
    );
    expect(viewSrc).not.toMatch(/barricadeMat\.side\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}barricadeSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}barricadeSideAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}barricadeSideAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}barricadeSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}barricadeSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}barricadeSideAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}barricadeSideAfterRestart/,
    );
    expect(gameSrc).not.toContain("barricadeSideAfterRestart(");
    expect(gameSrc).not.toContain("barricadeSideFromLook(");
    expect(saveSrc).not.toContain("barricadeSideAfterRestart");
    expect(saveSrc).not.toContain("barricadeSideFromLook");
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
