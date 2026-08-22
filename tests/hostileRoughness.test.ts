import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  HOSTILE_MESH_ROUGHNESS,
  HOSTILE_ROUGHNESS,
  HOSTILE_ROUGHNESS_SPAWN,
  hostileRoughnessAfterRestart,
  hostileRoughnessFromLook,
} from "../src/render/worldView";

describe("hostileRoughnessAfterRestart (R / softReset)", () => {
  test("roughness fresco (idle 0.55); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRoughness = hostileRoughnessAfterRestart();
    expect(bootRoughness).toBe(
      hostileRoughnessFromLook(HOSTILE_MESH_ROUGHNESS),
    );
    expect(bootRoughness).toBe(HOSTILE_MESH_ROUGHNESS);
    expect(bootRoughness).toBe(HOSTILE_ROUGHNESS);
    expect(bootRoughness).toBe(HOSTILE_ROUGHNESS_SPAWN);
    expect(bootRoughness).toBe(0.55);
    expect(hostileRoughnessAfterRestart()).toBe(bootRoughness);

    const leftoverRoughness = 0.99;
    expect(hostileRoughnessFromLook(leftoverRoughness)).toBe(
      leftoverRoughness,
    );
    expect(hostileRoughnessFromLook(leftoverRoughness)).not.toBe(
      bootRoughness,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(hostileRoughnessFromLook(0.55)).toBe(bootRoughness);
    expect(hostileRoughnessFromLook(0.99)).not.toBe(bootRoughness);
  });

  test("vivo on no cambia roughness (ctor constant; attach/tick no escriben)", () => {
    const bootRoughness = hostileRoughnessAfterRestart();
    const liveRoughness = hostileRoughnessFromLook(0.55);
    expect(liveRoughness).toBe(bootRoughness);
    expect(liveRoughness).toBe(hostileRoughnessAfterRestart());
    expect(liveRoughness).toBe(HOSTILE_ROUGHNESS_SPAWN);

    expect(hostileRoughnessFromLook(0.55)).toBe(bootRoughness);
    expect(hostileRoughnessFromLook(0.99)).not.toBe(bootRoughness);
  });
});

describe("hostile mesh roughness recreate lock (R / softReset)", () => {
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
    expect(viewSrc).toContain("hostileRoughnessAfterRestart(");
    expect(viewSrc).toContain("hostileRoughnessFromLook(");
    expect(viewSrc).toContain("HOSTILE_ROUGHNESS_SPAWN");
    expect(viewSrc).toMatch(
      /hostileRoughnessAfterRestart\([\s\S]{0,200}hostileRoughnessFromLook\(/,
    );
    expect(viewSrc).toContain("hostileRoughnessAfterRestart()");
    expect(viewSrc).toContain("roughness: hostileRoughnessAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const hostileMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,400}roughness:\s*0\.55/,
    );
    expect(viewSrc).not.toMatch(/hostileMat\.roughness\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}hostileRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}hostileRoughnessAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}hostileRoughnessAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}hostileRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}hostileRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}hostileRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}hostileRoughnessAfterRestart/,
    );
    expect(gameSrc).not.toContain("hostileRoughnessAfterRestart(");
    expect(gameSrc).not.toContain("hostileRoughnessFromLook(");
    expect(saveSrc).not.toContain("hostileRoughnessAfterRestart");
    expect(saveSrc).not.toContain("hostileRoughnessFromLook");
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
