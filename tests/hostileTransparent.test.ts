import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  HOSTILE_TRANSPARENT,
  HOSTILE_TRANSPARENT_SPAWN,
  hostileTransparentAfterRestart,
  hostileTransparentFromLook,
} from "../src/render/worldView";

describe("hostileTransparentAfterRestart (R / softReset)", () => {
  test("transparent fresco (idle false); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootTransparent = hostileTransparentAfterRestart();
    expect(bootTransparent).toBe(
      hostileTransparentFromLook(HOSTILE_TRANSPARENT),
    );
    expect(bootTransparent).toBe(HOSTILE_TRANSPARENT);
    expect(bootTransparent).toBe(HOSTILE_TRANSPARENT_SPAWN);
    expect(bootTransparent).toBe(false);
    expect(hostileTransparentAfterRestart()).toBe(bootTransparent);

    const leftoverTransparent = true;
    expect(hostileTransparentFromLook(leftoverTransparent)).toBe(
      leftoverTransparent,
    );
    expect(hostileTransparentFromLook(leftoverTransparent)).not.toBe(
      bootTransparent,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(hostileTransparentFromLook(false)).toBe(bootTransparent);
    expect(hostileTransparentFromLook(true)).not.toBe(bootTransparent);
  });

  test("vivo on no cambia transparent (ctor constant; attach/tick no escriben)", () => {
    const bootTransparent = hostileTransparentAfterRestart();
    const liveTransparent = hostileTransparentFromLook(false);
    expect(liveTransparent).toBe(bootTransparent);
    expect(liveTransparent).toBe(hostileTransparentAfterRestart());
    expect(liveTransparent).toBe(HOSTILE_TRANSPARENT_SPAWN);

    expect(hostileTransparentFromLook(false)).toBe(bootTransparent);
    expect(hostileTransparentFromLook(true)).not.toBe(bootTransparent);
  });
});

describe("hostile mesh transparent recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace transparent fresco; F9 no helper", () => {
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
    expect(viewSrc).toContain("hostileTransparentAfterRestart(");
    expect(viewSrc).toContain("hostileTransparentFromLook(");
    expect(viewSrc).toContain("HOSTILE_TRANSPARENT_SPAWN");
    expect(viewSrc).toMatch(
      /hostileTransparentAfterRestart\([\s\S]{0,200}hostileTransparentFromLook\(/,
    );
    expect(viewSrc).toContain("hostileTransparentAfterRestart()");
    expect(viewSrc).toContain("transparent: hostileTransparentAfterRestart()");
    expect(viewSrc).not.toMatch(
      /const hostileMat = new THREE\.MeshStandardMaterial\(\{[\s\S]{0,1200}transparent:\s*false/,
    );
    expect(viewSrc).not.toMatch(/hostileMat\.transparent\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}hostileTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncHostiles\([\s\S]{0,240}hostileTransparentAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /tickPlayerLoco\([\s\S]{0,240}hostileTransparentAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}hostileTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}hostileTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}hostileTransparentAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}hostileTransparentAfterRestart/,
    );
    expect(gameSrc).not.toContain("hostileTransparentAfterRestart(");
    expect(gameSrc).not.toContain("hostileTransparentFromLook(");
    expect(saveSrc).not.toContain("hostileTransparentAfterRestart");
    expect(saveSrc).not.toContain("hostileTransparentFromLook");
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
