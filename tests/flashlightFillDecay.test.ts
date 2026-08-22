import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_FILL_DECAY_SPAWN,
  flashlightFillDecayAfterRestart,
  flashlightFillDecayFromLook,
} from "../src/render/flashlightCone";
import { FLASHLIGHT_FILL_DECAY } from "../src/render/worldView";

describe("flashlightFillDecayAfterRestart (R / softReset)", () => {
  test("decay fresco (idle FLASHLIGHT_FILL_DECAY); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDecay = flashlightFillDecayAfterRestart();
    expect(bootDecay).toBe(flashlightFillDecayFromLook(FLASHLIGHT_FILL_DECAY));
    expect(bootDecay).toBe(FLASHLIGHT_FILL_DECAY);
    expect(bootDecay).toBe(FLASHLIGHT_FILL_DECAY_SPAWN);
    expect(bootDecay).toBe(1.74);
    expect(flashlightFillDecayAfterRestart()).toBe(bootDecay);

    const leftoverDecay = FLASHLIGHT_FILL_DECAY * 2;
    expect(flashlightFillDecayFromLook(leftoverDecay)).toBe(leftoverDecay);
    expect(flashlightFillDecayFromLook(leftoverDecay)).not.toBe(bootDecay);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(flashlightFillDecayFromLook(FLASHLIGHT_FILL_DECAY)).toBe(bootDecay);
  });

  test("vivo on no cambia decay (ctor constant; sync no escribe)", () => {
    const bootDecay = flashlightFillDecayAfterRestart();
    const liveDecay = flashlightFillDecayFromLook(FLASHLIGHT_FILL_DECAY);
    expect(liveDecay).toBe(bootDecay);
    expect(liveDecay).toBe(flashlightFillDecayAfterRestart());
    expect(liveDecay).toBe(FLASHLIGHT_FILL_DECAY_SPAWN);

    expect(flashlightFillDecayFromLook(FLASHLIGHT_FILL_DECAY)).toBe(bootDecay);
    expect(flashlightFillDecayFromLook(FLASHLIGHT_FILL_DECAY * 2)).not.toBe(
      bootDecay,
    );
  });
});

describe("flashlight fill decay recreate lock (R / softReset)", () => {
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
    const coneSrc = readFileSync(
      resolve(process.cwd(), "src/render/flashlightCone.ts"),
      "utf8",
    );
    expect(coneSrc).toContain("flashlightFillDecayAfterRestart(");
    expect(coneSrc).toContain("flashlightFillDecayFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_FILL_DECAY_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightFillDecayAfterRestart\([\s\S]{0,200}flashlightFillDecayFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightFillDecayAfterRestart(");
    expect(viewSrc).toContain("flashlightFillDecayAfterRestart()");
    expect(viewSrc).not.toContain("flashlightFillDecayFromLook(");
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(FLASHLIGHT_FILL_COLOR, flashlightFillIntensityAfterRestart\(\), flashlightFillDistanceAfterRestart\(\), FLASHLIGHT_FILL_DECAY\)/,
    );
    expect(viewSrc).not.toMatch(/torchLight\.decay\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightFillDecayAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightFillDecayAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightFillDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightFillDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightFillDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightFillDecayAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightFillDecayAfterRestart(");
    expect(gameSrc).not.toContain("flashlightFillDecayFromLook(");
    expect(saveSrc).not.toContain("flashlightFillDecayAfterRestart");
    expect(saveSrc).not.toContain("flashlightFillDecayFromLook");
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
