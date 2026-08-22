import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  WARM_LIGHT_COLOR_B_SPAWN,
  WARM_LIGHT_COLOR_G_SPAWN,
  warmLightColorBAfterRestart,
  warmLightColorBFromLook,
  warmLightColorGAfterRestart,
  warmLightColorGFromLook,
} from "../src/world/indoor";
import {
  WARM_LIGHT_AMBER_B,
  WARM_LIGHT_AMBER_B_GAIN,
  WARM_LIGHT_AMBER_G,
  WARM_LIGHT_AMBER_G_GAIN,
  WARM_LIGHT_COLOR,
} from "../src/render/worldView";

const LEFTOVER_CTOR_COLOR = 0xffca81;
const LEFTOVER_CTOR_G = ((LEFTOVER_CTOR_COLOR >> 8) & 0xff) / 255;
const LEFTOVER_CTOR_B = (LEFTOVER_CTOR_COLOR & 0xff) / 255;

describe("warmLightColorAfterRestart (R / softReset)", () => {
  test("color fresco (idle RGB 1 / AMBER_G 0.759 / AMBER_B 0.437); leftover ctor 0xffca81 / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootG = warmLightColorGAfterRestart();
    const bootB = warmLightColorBAfterRestart();
    expect(bootG).toBe(warmLightColorGFromLook(WARM_LIGHT_AMBER_G));
    expect(bootB).toBe(warmLightColorBFromLook(WARM_LIGHT_AMBER_B));
    expect(bootG).toBe(WARM_LIGHT_AMBER_G + 0 * WARM_LIGHT_AMBER_G_GAIN);
    expect(bootB).toBe(WARM_LIGHT_AMBER_B + 0 * WARM_LIGHT_AMBER_B_GAIN);
    expect(bootG).toBe(0.759);
    expect(bootB).toBe(0.437);
    expect(bootG).toBe(WARM_LIGHT_COLOR_G_SPAWN);
    expect(bootB).toBe(WARM_LIGHT_COLOR_B_SPAWN);
    expect(WARM_LIGHT_COLOR).toBe(LEFTOVER_CTOR_COLOR);
    expect(bootG).not.toBe(LEFTOVER_CTOR_G);
    expect(bootB).not.toBe(LEFTOVER_CTOR_B);
    expect(warmLightColorGAfterRestart()).toBe(bootG);
    expect(warmLightColorBAfterRestart()).toBe(bootB);

    const leftoverG = LEFTOVER_CTOR_G;
    const leftoverB = LEFTOVER_CTOR_B;
    expect(warmLightColorGFromLook(leftoverG)).toBe(leftoverG);
    expect(warmLightColorGFromLook(leftoverG)).not.toBe(bootG);
    expect(warmLightColorBFromLook(leftoverB)).toBe(leftoverB);
    expect(warmLightColorBFromLook(leftoverB)).not.toBe(bootB);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(warmLightColorGFromLook(WARM_LIGHT_AMBER_G)).toBe(bootG);
    expect(warmLightColorBFromLook(WARM_LIGHT_AMBER_B)).toBe(bootB);
  });

  test("vivo on no usa el helper (color avanza con look)", () => {
    const bootG = warmLightColorGAfterRestart();
    const bootB = warmLightColorBAfterRestart();
    const liveG = warmLightColorGFromLook(
      WARM_LIGHT_AMBER_G + 1 * WARM_LIGHT_AMBER_G_GAIN,
    );
    const liveB = warmLightColorBFromLook(
      WARM_LIGHT_AMBER_B + 1 * WARM_LIGHT_AMBER_B_GAIN,
    );
    expect(liveG).toBe(WARM_LIGHT_AMBER_G + WARM_LIGHT_AMBER_G_GAIN);
    expect(liveB).toBe(WARM_LIGHT_AMBER_B + WARM_LIGHT_AMBER_B_GAIN);
    expect(liveG).not.toBe(bootG);
    expect(liveB).not.toBe(bootB);
    expect(liveG).not.toBe(warmLightColorGAfterRestart());
    expect(liveB).not.toBe(warmLightColorBAfterRestart());
    expect(liveG).toBeGreaterThan(bootG);
    expect(liveB).toBeGreaterThan(bootB);

    expect(warmLightColorGFromLook(WARM_LIGHT_AMBER_G)).toBe(bootG);
    expect(warmLightColorBFromLook(WARM_LIGHT_AMBER_B)).toBe(bootB);
    expect(
      warmLightColorGFromLook(
        WARM_LIGHT_AMBER_G + 1 * WARM_LIGHT_AMBER_G_GAIN,
      ),
    ).toBe(liveG);
    expect(
      warmLightColorBFromLook(
        WARM_LIGHT_AMBER_B + 1 * WARM_LIGHT_AMBER_B_GAIN,
      ),
    ).toBe(liveB);
  });
});

describe("warm light color recreate lock (R / softReset)", () => {
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
    const indoorSrc = readFileSync(
      resolve(process.cwd(), "src/world/indoor.ts"),
      "utf8",
    );
    expect(indoorSrc).toContain("warmLightColorGAfterRestart(");
    expect(indoorSrc).toContain("warmLightColorBAfterRestart(");
    expect(indoorSrc).toContain("warmLightColorGFromLook(");
    expect(indoorSrc).toContain("warmLightColorBFromLook(");
    expect(indoorSrc).toContain("WARM_LIGHT_COLOR_G_SPAWN");
    expect(indoorSrc).toContain("WARM_LIGHT_COLOR_B_SPAWN");
    expect(indoorSrc).toMatch(
      /warmLightColorGAfterRestart\([\s\S]{0,200}warmLightColorGFromLook\(/,
    );
    expect(indoorSrc).toMatch(
      /warmLightColorBAfterRestart\([\s\S]{0,200}warmLightColorBFromLook\(/,
    );
    expect(viewSrc).toContain("warmLightColorGAfterRestart(");
    expect(viewSrc).toContain("warmLightColorBAfterRestart(");
    expect(viewSrc).toContain("warmLightColorGFromLook(");
    expect(viewSrc).toContain("warmLightColorBFromLook(");
    expect(viewSrc).toContain("warmLightColorGAfterRestart()");
    expect(viewSrc).toContain("warmLightColorBAfterRestart()");
    expect(viewSrc).toContain(
      "warmLight.color.setRGB(1, warmLightColorGAfterRestart(), warmLightColorBAfterRestart())",
    );
    expect(viewSrc).toContain(
      "warmLight.color.setRGB(1, warmLightColorGFromLook(WARM_LIGHT_AMBER_G + i * WARM_LIGHT_AMBER_G_GAIN), warmLightColorBFromLook(WARM_LIGHT_AMBER_B + i * WARM_LIGHT_AMBER_B_GAIN))",
    );
    expect(viewSrc).not.toMatch(
      /warmLight\.color\.setRGB\(1, WARM_LIGHT_AMBER_G \+ i \* WARM_LIGHT_AMBER_G_GAIN, WARM_LIGHT_AMBER_B \+ i \* WARM_LIGHT_AMBER_B_GAIN\)/,
    );
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}warmLightColorGAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}warmLightColorGAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}warmLightColorGAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}warmLightColorGAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}warmLightColorGAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}warmLightColorGAfterRestart/,
    );
    expect(gameSrc).not.toContain("warmLightColorGAfterRestart(");
    expect(gameSrc).not.toContain("warmLightColorBAfterRestart(");
    expect(gameSrc).not.toContain("warmLightColorGFromLook(");
    expect(gameSrc).not.toContain("warmLightColorBFromLook(");
    expect(saveSrc).not.toContain("warmLightColorGAfterRestart");
    expect(saveSrc).not.toContain("warmLightColorBAfterRestart");
    expect(saveSrc).not.toContain("warmLightColorGFromLook");
    expect(saveSrc).not.toContain("warmLightColorBFromLook");
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
