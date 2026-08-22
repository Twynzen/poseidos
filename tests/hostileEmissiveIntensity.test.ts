import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  HOSTILE_EMISSIVE_INTENSITY,
  HOSTILE_EMISSIVE_INTENSITY_SPAWN,
  hostileEmissiveIntensityAfterRestart,
  hostileEmissiveIntensityFromLook,
} from "../src/render/worldView";

describe("hostileEmissiveIntensityAfterRestart (R / softReset)", () => {
  test("intensity fresco (idle 1); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootIntensity = hostileEmissiveIntensityAfterRestart();
    expect(bootIntensity).toBe(
      hostileEmissiveIntensityFromLook(HOSTILE_EMISSIVE_INTENSITY),
    );
    expect(bootIntensity).toBe(HOSTILE_EMISSIVE_INTENSITY);
    expect(bootIntensity).toBe(HOSTILE_EMISSIVE_INTENSITY_SPAWN);
    expect(bootIntensity).toBe(1);
    expect(hostileEmissiveIntensityAfterRestart()).toBe(bootIntensity);

    const leftoverIntensity = 0.42;
    expect(hostileEmissiveIntensityFromLook(leftoverIntensity)).toBe(
      leftoverIntensity,
    );
    expect(hostileEmissiveIntensityFromLook(leftoverIntensity)).not.toBe(
      bootIntensity,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(hostileEmissiveIntensityFromLook(1)).toBe(bootIntensity);
    expect(hostileEmissiveIntensityFromLook(0.42)).not.toBe(bootIntensity);
  });

  test("vivo on no cambia intensity (ctor constant; attach/tick no escriben)", () => {
    const bootIntensity = hostileEmissiveIntensityAfterRestart();
    const liveIntensity = hostileEmissiveIntensityFromLook(1);
    expect(liveIntensity).toBe(bootIntensity);
    expect(liveIntensity).toBe(hostileEmissiveIntensityAfterRestart());
    expect(liveIntensity).toBe(HOSTILE_EMISSIVE_INTENSITY_SPAWN);

    expect(hostileEmissiveIntensityFromLook(1)).toBe(bootIntensity);
    expect(hostileEmissiveIntensityFromLook(0.42)).not.toBe(bootIntensity);
  });
});

describe("hostile mesh emissiveIntensity recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace intensity fresco; F9 no helper", () => {
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
    expect(viewSrc).toContain("hostileEmissiveIntensityAfterRestart(");
    expect(viewSrc).toContain("hostileEmissiveIntensityFromLook(");
    expect(viewSrc).toContain("HOSTILE_EMISSIVE_INTENSITY_SPAWN");
    expect(viewSrc).toMatch(
      /hostileEmissiveIntensityAfterRestart\([\s\S]{0,200}hostileEmissiveIntensityFromLook\(/,
    );
    expect(viewSrc).toContain("hostileEmissiveIntensityAfterRestart()");
    expect(viewSrc).toContain(
      "emissiveIntensity: hostileEmissiveIntensityAfterRestart()",
    );
    expect(viewSrc).not.toMatch(
      /const hostileMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,720}emissiveIntensity:\s*1/,
    );
    expect(viewSrc).not.toMatch(/hostileMat\.emissiveIntensity\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}hostileEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}hostileEmissiveIntensityAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}hostileEmissiveIntensityAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}hostileEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}hostileEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}hostileEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}hostileEmissiveIntensityAfterRestart/,
    );
    expect(gameSrc).not.toContain("hostileEmissiveIntensityAfterRestart(");
    expect(gameSrc).not.toContain("hostileEmissiveIntensityFromLook(");
    expect(saveSrc).not.toContain("hostileEmissiveIntensityAfterRestart");
    expect(saveSrc).not.toContain("hostileEmissiveIntensityFromLook");
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
