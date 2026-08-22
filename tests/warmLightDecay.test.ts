import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  WARM_LIGHT_DECAY_SPAWN,
  warmLightDecayAfterRestart,
  warmLightDecayFromLook,
} from "../src/world/indoor";
import { WARM_LIGHT_DECAY } from "../src/render/worldView";

describe("warmLightDecayAfterRestart (R / softReset)", () => {
  test("decay fresco (idle WARM_LIGHT_DECAY); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDecay = warmLightDecayAfterRestart();
    expect(bootDecay).toBe(warmLightDecayFromLook(WARM_LIGHT_DECAY));
    expect(bootDecay).toBe(WARM_LIGHT_DECAY);
    expect(bootDecay).toBe(WARM_LIGHT_DECAY_SPAWN);
    expect(bootDecay).toBe(1.74);
    expect(warmLightDecayAfterRestart()).toBe(bootDecay);

    const leftoverDecay = WARM_LIGHT_DECAY * 2;
    expect(warmLightDecayFromLook(leftoverDecay)).toBe(leftoverDecay);
    expect(warmLightDecayFromLook(leftoverDecay)).not.toBe(bootDecay);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(warmLightDecayFromLook(WARM_LIGHT_DECAY)).toBe(bootDecay);
  });

  test("vivo on no cambia decay (ctor constant; sync no escribe)", () => {
    const bootDecay = warmLightDecayAfterRestart();
    const liveDecay = warmLightDecayFromLook(WARM_LIGHT_DECAY);
    expect(liveDecay).toBe(bootDecay);
    expect(liveDecay).toBe(warmLightDecayAfterRestart());
    expect(liveDecay).toBe(WARM_LIGHT_DECAY_SPAWN);

    expect(warmLightDecayFromLook(WARM_LIGHT_DECAY)).toBe(bootDecay);
    expect(warmLightDecayFromLook(WARM_LIGHT_DECAY * 2)).not.toBe(bootDecay);
  });
});

describe("warm light decay recreate lock (R / softReset)", () => {
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
    const indoorSrc = readFileSync(
      resolve(process.cwd(), "src/world/indoor.ts"),
      "utf8",
    );
    expect(indoorSrc).toContain("warmLightDecayAfterRestart(");
    expect(indoorSrc).toContain("warmLightDecayFromLook(");
    expect(indoorSrc).toContain("WARM_LIGHT_DECAY_SPAWN");
    expect(indoorSrc).toMatch(
      /warmLightDecayAfterRestart\([\s\S]{0,200}warmLightDecayFromLook\(/,
    );
    expect(viewSrc).toContain("warmLightDecayAfterRestart(");
    expect(viewSrc).toContain("warmLightDecayAfterRestart()");
    expect(viewSrc).not.toContain("warmLightDecayFromLook(");
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(WARM_LIGHT_COLOR, warmLightIntensityAfterRestart\(\), warmLightDistanceAfterRestart\(\), WARM_LIGHT_DECAY\)/,
    );
    expect(viewSrc).not.toMatch(/warmLight\.decay\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}warmLightDecayAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}warmLightDecayAfterRestart/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3600}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}warmLightDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}warmLightDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}warmLightDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}warmLightDecayAfterRestart/,
    );
    expect(gameSrc).not.toContain("warmLightDecayAfterRestart(");
    expect(gameSrc).not.toContain("warmLightDecayFromLook(");
    expect(saveSrc).not.toContain("warmLightDecayAfterRestart");
    expect(saveSrc).not.toContain("warmLightDecayFromLook");
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
