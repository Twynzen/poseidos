import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  TRACER_FLASH_DECAY_SPAWN,
  tracerFlashDecayAfterRestart,
  tracerFlashDecayFromLook,
} from "../src/render/tracers";
import { TRACER_FLASH_DECAY } from "../src/render/worldView";

describe("tracerFlashDecayAfterRestart (R / softReset)", () => {
  test("decay fresco (idle TRACER_FLASH_DECAY); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDecay = tracerFlashDecayAfterRestart();
    expect(bootDecay).toBe(tracerFlashDecayFromLook(TRACER_FLASH_DECAY));
    expect(bootDecay).toBe(TRACER_FLASH_DECAY);
    expect(bootDecay).toBe(TRACER_FLASH_DECAY_SPAWN);
    expect(bootDecay).toBe(1.74);
    expect(tracerFlashDecayAfterRestart()).toBe(bootDecay);

    const leftoverDecay = TRACER_FLASH_DECAY * 2;
    expect(tracerFlashDecayFromLook(leftoverDecay)).toBe(leftoverDecay);
    expect(tracerFlashDecayFromLook(leftoverDecay)).not.toBe(bootDecay);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(tracerFlashDecayFromLook(TRACER_FLASH_DECAY)).toBe(bootDecay);
  });

  test("vivo on no cambia decay (ctor constant; sync no escribe)", () => {
    const bootDecay = tracerFlashDecayAfterRestart();
    const liveDecay = tracerFlashDecayFromLook(TRACER_FLASH_DECAY);
    expect(liveDecay).toBe(bootDecay);
    expect(liveDecay).toBe(tracerFlashDecayAfterRestart());
    expect(liveDecay).toBe(TRACER_FLASH_DECAY_SPAWN);

    expect(tracerFlashDecayFromLook(TRACER_FLASH_DECAY)).toBe(bootDecay);
    expect(tracerFlashDecayFromLook(TRACER_FLASH_DECAY * 2)).not.toBe(
      bootDecay,
    );
  });
});

describe("tracer flash decay recreate lock (R / softReset)", () => {
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
    const tracerSrc = readFileSync(
      resolve(process.cwd(), "src/render/tracers.ts"),
      "utf8",
    );
    expect(tracerSrc).toContain("tracerFlashDecayAfterRestart(");
    expect(tracerSrc).toContain("tracerFlashDecayFromLook(");
    expect(tracerSrc).toContain("TRACER_FLASH_DECAY_SPAWN");
    expect(tracerSrc).toMatch(
      /tracerFlashDecayAfterRestart\([\s\S]{0,200}tracerFlashDecayFromLook\(/,
    );
    expect(viewSrc).toContain("tracerFlashDecayAfterRestart(");
    expect(viewSrc).toContain("tracerFlashDecayAfterRestart()");
    expect(viewSrc).not.toContain("tracerFlashDecayFromLook(");
    expect(viewSrc).not.toMatch(
      /new THREE\.PointLight\(\s*TRACER_FLASH_COLOR,\s*TRACER_FLASH_INTENSITY,\s*TRACER_FLASH_DISTANCE,\s*TRACER_FLASH_DECAY/,
    );
    expect(viewSrc).not.toMatch(/flash\.decay\s*=/);
    expect(viewSrc).not.toMatch(/t\.flash\.decay\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}tracerFlashDecayAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function clearTracers\(\): void \{[\s\S]{0,200}tracerFlashDecayAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}tracerFlashDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}tracerFlashDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}tracerFlashDecayAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}tracerFlashDecayAfterRestart/,
    );
    expect(gameSrc).not.toContain("tracerFlashDecayAfterRestart(");
    expect(gameSrc).not.toContain("tracerFlashDecayFromLook(");
    expect(saveSrc).not.toContain("tracerFlashDecayAfterRestart");
    expect(saveSrc).not.toContain("tracerFlashDecayFromLook");
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
