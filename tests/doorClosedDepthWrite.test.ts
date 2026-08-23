import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  DOOR_CLOSED_DEPTH_WRITE,
  DOOR_CLOSED_DEPTH_WRITE_SPAWN,
  doorClosedDepthWriteAfterRestart,
  doorClosedDepthWriteFromLook,
} from "../src/render/worldView";

describe("doorClosedDepthWriteAfterRestart (R / softReset)", () => {
  test("depthWrite fresco (idle true); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootDepthWrite = doorClosedDepthWriteAfterRestart();
    expect(bootDepthWrite).toBe(
      doorClosedDepthWriteFromLook(DOOR_CLOSED_DEPTH_WRITE),
    );
    expect(bootDepthWrite).toBe(DOOR_CLOSED_DEPTH_WRITE);
    expect(bootDepthWrite).toBe(DOOR_CLOSED_DEPTH_WRITE_SPAWN);
    expect(bootDepthWrite).toBe(true);
    expect(doorClosedDepthWriteAfterRestart()).toBe(bootDepthWrite);

    const leftoverDepthWrite = false;
    expect(doorClosedDepthWriteFromLook(leftoverDepthWrite)).toBe(
      leftoverDepthWrite,
    );
    expect(doorClosedDepthWriteFromLook(leftoverDepthWrite)).not.toBe(
      bootDepthWrite,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(doorClosedDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(doorClosedDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });

  test("vivo on no cambia depthWrite (ctor constant; attach/tick no escriben)", () => {
    const bootDepthWrite = doorClosedDepthWriteAfterRestart();
    const liveDepthWrite = doorClosedDepthWriteFromLook(true);
    expect(liveDepthWrite).toBe(bootDepthWrite);
    expect(liveDepthWrite).toBe(doorClosedDepthWriteAfterRestart());
    expect(liveDepthWrite).toBe(DOOR_CLOSED_DEPTH_WRITE_SPAWN);

    expect(doorClosedDepthWriteFromLook(true)).toBe(bootDepthWrite);
    expect(doorClosedDepthWriteFromLook(false)).not.toBe(bootDepthWrite);
  });
});

describe("door-closed mesh depthWrite recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace depthWrite fresco; F9 no helper", () => {
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
    expect(viewSrc).toContain("doorClosedDepthWriteAfterRestart(");
    expect(viewSrc).toContain("doorClosedDepthWriteFromLook(");
    expect(viewSrc).toContain("DOOR_CLOSED_DEPTH_WRITE_SPAWN");
    expect(viewSrc).toMatch(
      /doorClosedDepthWriteAfterRestart\([\s\S]{0,200}doorClosedDepthWriteFromLook\(/,
    );
    expect(viewSrc).toContain("doorClosedDepthWriteAfterRestart()");
    expect(viewSrc).toContain("depthWrite: doorClosedDepthWriteAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const doorClosedMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,1200}depthWrite:\s*true/,
    );
    expect(viewSrc).not.toMatch(/doorClosedMat\.depthWrite\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}doorClosedDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}doorClosedDepthWriteAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}doorClosedDepthWriteAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}doorClosedDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}doorClosedDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}doorClosedDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}doorClosedDepthWriteAfterRestart/,
    );
    expect(gameSrc).not.toContain("doorClosedDepthWriteAfterRestart(");
    expect(gameSrc).not.toContain("doorClosedDepthWriteFromLook(");
    expect(saveSrc).not.toContain("doorClosedDepthWriteAfterRestart");
    expect(saveSrc).not.toContain("doorClosedDepthWriteFromLook");
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
