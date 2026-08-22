import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  DOOR_OPEN_MESH_ROUGHNESS,
  DOOR_OPEN_ROUGHNESS,
  DOOR_OPEN_ROUGHNESS_SPAWN,
  doorOpenRoughnessAfterRestart,
  doorOpenRoughnessFromLook,
} from "../src/render/worldView";

describe("doorOpenRoughnessAfterRestart (R / softReset)", () => {
  test("roughness fresco (idle 0.7); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRoughness = doorOpenRoughnessAfterRestart();
    expect(bootRoughness).toBe(doorOpenRoughnessFromLook(DOOR_OPEN_MESH_ROUGHNESS));
    expect(bootRoughness).toBe(DOOR_OPEN_MESH_ROUGHNESS);
    expect(bootRoughness).toBe(DOOR_OPEN_ROUGHNESS);
    expect(bootRoughness).toBe(DOOR_OPEN_ROUGHNESS_SPAWN);
    expect(bootRoughness).toBe(0.7);
    expect(doorOpenRoughnessAfterRestart()).toBe(bootRoughness);

    const leftoverRoughness = 0.99;
    expect(doorOpenRoughnessFromLook(leftoverRoughness)).toBe(leftoverRoughness);
    expect(doorOpenRoughnessFromLook(leftoverRoughness)).not.toBe(bootRoughness);

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(doorOpenRoughnessFromLook(0.7)).toBe(bootRoughness);
    expect(doorOpenRoughnessFromLook(0.99)).not.toBe(bootRoughness);
  });

  test("vivo on no cambia roughness (ctor constant; attach/tick no escriben)", () => {
    const bootRoughness = doorOpenRoughnessAfterRestart();
    const liveRoughness = doorOpenRoughnessFromLook(0.7);
    expect(liveRoughness).toBe(bootRoughness);
    expect(liveRoughness).toBe(doorOpenRoughnessAfterRestart());
    expect(liveRoughness).toBe(DOOR_OPEN_ROUGHNESS_SPAWN);

    expect(doorOpenRoughnessFromLook(0.7)).toBe(bootRoughness);
    expect(doorOpenRoughnessFromLook(0.99)).not.toBe(bootRoughness);
  });
});

describe("door-open mesh roughness recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace roughness fresco; F9 no helper", () => {
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
    expect(viewSrc).toContain("doorOpenRoughnessAfterRestart(");
    expect(viewSrc).toContain("doorOpenRoughnessFromLook(");
    expect(viewSrc).toContain("DOOR_OPEN_ROUGHNESS_SPAWN");
    expect(viewSrc).toMatch(
      /doorOpenRoughnessAfterRestart\([\s\S]{0,200}doorOpenRoughnessFromLook\(/,
    );
    expect(viewSrc).toContain("doorOpenRoughnessAfterRestart()");
    expect(viewSrc).toContain("roughness: doorOpenRoughnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const doorOpenMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,280}roughness:\s*0\.7(?!\d)/,
    );
    expect(viewSrc).not.toMatch(/doorOpenMat\.roughness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}doorOpenRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}doorOpenRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}doorOpenRoughnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}doorOpenRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}doorOpenRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}doorOpenRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}doorOpenRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("doorOpenRoughnessAfterRestart(");
    expect(gameSrc).not.toContain("doorOpenRoughnessFromLook(");
    expect(saveSrc).not.toContain("doorOpenRoughnessAfterRestart");
    expect(saveSrc).not.toContain("doorOpenRoughnessFromLook");
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
