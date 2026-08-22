import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  FLASHLIGHT_CONE_RENDER_ORDER,
  FLASHLIGHT_CONE_RENDER_ORDER_SPAWN,
  flashlightConeRenderOrderAfterRestart,
  flashlightConeRenderOrderFromLook,
} from "../src/render/flashlightCone";

describe("flashlightConeRenderOrderAfterRestart (R / softReset)", () => {
  test("renderOrder fresco (idle 7); leftover mid-life / far 40,30 no filtra", () => {
    const barrio = createNeighborhood(48);
    expect(barrio.spawn.x).toBe(24.5);
    expect(barrio.spawn.y).toBe(15.5);

    const bootRenderOrder = flashlightConeRenderOrderAfterRestart();
    expect(bootRenderOrder).toBe(
      flashlightConeRenderOrderFromLook(FLASHLIGHT_CONE_RENDER_ORDER),
    );
    expect(bootRenderOrder).toBe(FLASHLIGHT_CONE_RENDER_ORDER);
    expect(bootRenderOrder).toBe(FLASHLIGHT_CONE_RENDER_ORDER_SPAWN);
    expect(bootRenderOrder).toBe(7);
    expect(flashlightConeRenderOrderAfterRestart()).toBe(bootRenderOrder);

    const leftoverRenderOrder = 1;
    expect(flashlightConeRenderOrderFromLook(leftoverRenderOrder)).toBe(
      leftoverRenderOrder,
    );
    expect(flashlightConeRenderOrderFromLook(leftoverRenderOrder)).not.toBe(
      bootRenderOrder,
    );

    const leftoverFarX = 40;
    const leftoverFarZ = 30;
    expect(leftoverFarX).not.toBe(barrio.spawn.x);
    expect(leftoverFarZ).not.toBe(barrio.spawn.y);
    expect(leftoverFarX).not.toBe(24.5);
    expect(leftoverFarZ).not.toBe(15.5);
    expect(leftoverFarX).toBe(40);
    expect(leftoverFarZ).toBe(30);

    expect(flashlightConeRenderOrderFromLook(FLASHLIGHT_CONE_RENDER_ORDER)).toBe(
      bootRenderOrder,
    );
  });

  test("vivo on no cambia renderOrder (ctor constant; sync no escribe)", () => {
    const bootRenderOrder = flashlightConeRenderOrderAfterRestart();
    const liveRenderOrder = flashlightConeRenderOrderFromLook(
      FLASHLIGHT_CONE_RENDER_ORDER,
    );
    expect(liveRenderOrder).toBe(bootRenderOrder);
    expect(liveRenderOrder).toBe(flashlightConeRenderOrderAfterRestart());
    expect(liveRenderOrder).toBe(FLASHLIGHT_CONE_RENDER_ORDER_SPAWN);

    expect(flashlightConeRenderOrderFromLook(FLASHLIGHT_CONE_RENDER_ORDER)).toBe(
      bootRenderOrder,
    );
    expect(flashlightConeRenderOrderFromLook(1)).not.toBe(bootRenderOrder);
  });
});

describe("flashlight cone mesh renderOrder recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace renderOrder fresco; F9 no helper", () => {
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
    expect(coneSrc).toContain("flashlightConeRenderOrderAfterRestart(");
    expect(coneSrc).toContain("flashlightConeRenderOrderFromLook(");
    expect(coneSrc).toContain("FLASHLIGHT_CONE_RENDER_ORDER_SPAWN");
    expect(coneSrc).toMatch(
      /flashlightConeRenderOrderAfterRestart\([\s\S]{0,200}flashlightConeRenderOrderFromLook\(/,
    );
    expect(viewSrc).toContain("flashlightConeRenderOrderAfterRestart(");
    expect(viewSrc).toContain("flashlightConeRenderOrderAfterRestart()");
    expect(viewSrc).not.toContain("flashlightConeRenderOrderFromLook(");
    expect(viewSrc).toContain(
      "flashlightConeWedge.renderOrder = flashlightConeRenderOrderAfterRestart()",
    );
    expect(viewSrc).not.toMatch(/flashlightConeWedge\.renderOrder\s*=\s*7/);
    expect(viewSrc).not.toMatch(/coneMat\.renderOrder\s*=/);
    expect(viewSrc).not.toMatch(
      /function hide\(\): void \{[\s\S]{0,200}flashlightConeRenderOrderAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /function hideFlashlightCone\(\): void \{[\s\S]{0,200}flashlightConeRenderOrderAfterRestart/,
    );
    expect(viewSrc).not.toMatch(
      /syncTorchLight\([\s\S]{0,240}flashlightConeRenderOrderAfterRestart/,
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
      /doLoad\(\): boolean \{[\s\S]{0,2800}flashlightConeRenderOrderAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}flashlightConeRenderOrderAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}flashlightConeRenderOrderAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}flashlightConeRenderOrderAfterRestart/,
    );
    expect(gameSrc).not.toContain("flashlightConeRenderOrderAfterRestart(");
    expect(gameSrc).not.toContain("flashlightConeRenderOrderFromLook(");
    expect(saveSrc).not.toContain("flashlightConeRenderOrderAfterRestart");
    expect(saveSrc).not.toContain("flashlightConeRenderOrderFromLook");
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
