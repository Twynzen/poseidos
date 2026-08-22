import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  MUZZLE_LIGHT_DECAY_SPAWN,
  muzzleLightDecayAfterRestart,
  muzzleLightDecayFromLook,
} from "../src/render/muzzleFlash";
import { MUZZLE_LIGHT_DECAY } from "../src/render/worldView";

describe("muzzleLightDecayAfterRestart (R / softReset)", () => {
  test("decay fresco (idle MUZZLE_LIGHT_DECAY); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDecay = muzzleLightDecayAfterRestart();
    expect(bootDecay).toBe(muzzleLightDecayFromLook(MUZZLE_LIGHT_DECAY));
    expect(bootDecay).toBe(MUZZLE_LIGHT_DECAY);
    expect(bootDecay).toBe(MUZZLE_LIGHT_DECAY_SPAWN);
    expect(bootDecay).toBe(1.74);
    expect(muzzleLightDecayAfterRestart()).toBe(bootDecay);

    const leftoverDecay = MUZZLE_LIGHT_DECAY * 2;
    expect(muzzleLightDecayFromLook(leftoverDecay)).toBe(leftoverDecay);
    expect(muzzleLightDecayFromLook(leftoverDecay)).not.toBe(bootDecay);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(muzzleLightDecayFromLook(MUZZLE_LIGHT_DECAY)).toBe(bootDecay);
  });

  test("vivo on no cambia decay (ctor constant; sync no escribe)", () => {
    const bootDecay = muzzleLightDecayAfterRestart();
    const liveDecay = muzzleLightDecayFromLook(MUZZLE_LIGHT_DECAY);
    expect(liveDecay).toBe(bootDecay);
    expect(liveDecay).toBe(muzzleLightDecayAfterRestart());
    expect(liveDecay).toBe(MUZZLE_LIGHT_DECAY_SPAWN);

    expect(muzzleLightDecayFromLook(MUZZLE_LIGHT_DECAY)).toBe(bootDecay);
    expect(muzzleLightDecayFromLook(MUZZLE_LIGHT_DECAY * 2)).not.toBe(
      bootDecay,
    );
  });
});

describe("muzzle light decay recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace decay fresco; F9 no helper", () => {
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
    const flashSrc = readFileSync(
      resolve(process.cwd(), "src/render/muzzleFlash.ts"),
      "utf8",
    );
    expect(flashSrc).toContain("muzzleLightDecayAfterRestart(");
    expect(flashSrc).toContain("muzzleLightDecayFromLook(");
    expect(flashSrc).toContain("MUZZLE_LIGHT_DECAY_SPAWN");
    expect(flashSrc).toMatch(
      /muzzleLightDecayAfterRestart\([\s\S]{0,200}muzzleLightDecayFromLook\(/,
    );
    expect(viewSrc).toContain("muzzleLightDecayAfterRestart(");
    expect(viewSrc).toContain("muzzleLightDecayAfterRestart()");
    expect(viewSrc).not.toContain("muzzleLightDecayFromLook(");
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(\s*MUZZLE_LIGHT_COLOR,\s*0,\s*MUZZLE_LIGHT_DISTANCE,\s*MUZZLE_LIGHT_DECAY/,
    );
    expect(viewSrc).not.toMatch(/muzzleLight\.decay\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}muzzleLightDecayAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideMuzzle\(\): void \{[\s\S]{0,200}muzzleLightDecayAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}muzzleLightDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}muzzleLightDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}muzzleLightDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}muzzleLightDecayAfterRestart/,
    );
    expect(gameSrc).not.toContain("muzzleLightDecayAfterRestart(");
    expect(gameSrc).not.toContain("muzzleLightDecayFromLook(");
    expect(saveSrc).not.toContain("muzzleLightDecayAfterRestart");
    expect(saveSrc).not.toContain("muzzleLightDecayFromLook");
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
