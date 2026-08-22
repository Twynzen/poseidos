import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  FACING_CHEVRON_COLOR,
  FACING_CHEVRON_DIST,
  FACING_CHEVRON_HW,
  FACING_CHEVRON_LEN,
  FACING_CHEVRON_OPACITY,
  FACING_CHEVRON_YAW_OFFSET,
  facingChevronOffset,
  facingChevronVisible,
} from "../src/render/facingChevron";

describe("constantes", () => {
  test("opacity 0.991875 (0.8625 × 1.15); dist/len/hw/color/yaw sin cambio (no double-apply)", () => {
    expect(FACING_CHEVRON_OPACITY).toBe(0.991875);
    expect(FACING_CHEVRON_OPACITY).toBeCloseTo(0.8625 * 1.15, 5);
    expect(FACING_CHEVRON_OPACITY).toBeLessThan(1);
    expect(FACING_CHEVRON_OPACITY).toBeGreaterThan(0.35);
    expect(FACING_CHEVRON_DIST).toBe(1.82505);
    expect(FACING_CHEVRON_LEN).toBe(1.224304375);
    expect(FACING_CHEVRON_HW).toBe(0.48972175);
    expect(FACING_CHEVRON_COLOR).toBe(0xffe07a);
    expect(FACING_CHEVRON_YAW_OFFSET).toBe(0);
  });

  test("hw 0.48972175 (0.425845 × 1.15); dist/len/color/opacity/yaw sin cambio (no double-apply)", () => {
    expect(FACING_CHEVRON_HW).toBe(0.48972175);
    expect(FACING_CHEVRON_HW).toBeCloseTo(0.425845 * 1.15, 5);
    expect(FACING_CHEVRON_DIST).toBe(1.82505);
    expect(FACING_CHEVRON_LEN).toBe(1.224304375);
    expect(FACING_CHEVRON_COLOR).toBe(0xffe07a);
    expect(FACING_CHEVRON_OPACITY).toBe(0.991875);
    expect(FACING_CHEVRON_YAW_OFFSET).toBe(0);
  });

  test("len 1.224304375 (1.0646125 × 1.15); dist/hw/color/opacity/yaw sin cambio (no double-apply)", () => {
    expect(FACING_CHEVRON_LEN).toBe(1.224304375);
    expect(FACING_CHEVRON_LEN).toBeCloseTo(1.0646125 * 1.15, 5);
    expect(FACING_CHEVRON_DIST).toBe(1.82505);
    expect(FACING_CHEVRON_HW).toBe(0.48972175);
    expect(FACING_CHEVRON_COLOR).toBe(0xffe07a);
    expect(FACING_CHEVRON_OPACITY).toBe(0.991875);
    expect(FACING_CHEVRON_YAW_OFFSET).toBe(0);
  });

  test("color 0xffe07a (0xe8c36a × 1.15, r clamp); dist/len/hw/opacity/yaw sin cambio (no double-apply)", () => {
    expect(FACING_CHEVRON_COLOR).toBe(0xffe07a);
    expect(FACING_CHEVRON_DIST).toBe(1.82505);
    expect(FACING_CHEVRON_LEN).toBe(1.224304375);
    expect(FACING_CHEVRON_HW).toBe(0.48972175);
    expect(FACING_CHEVRON_OPACITY).toBe(0.991875);
    expect(FACING_CHEVRON_YAW_OFFSET).toBe(0);
  });

  test("dist 1.82505 (1.587 × 1.15); len/hw/color/opacity/yaw sin cambio (no double-apply)", () => {
    expect(FACING_CHEVRON_DIST).toBe(1.82505);
    expect(FACING_CHEVRON_DIST).toBeCloseTo(1.587 * 1.15, 5);
    expect(FACING_CHEVRON_LEN).toBe(1.224304375);
    expect(FACING_CHEVRON_HW).toBe(0.48972175);
    expect(FACING_CHEVRON_COLOR).toBe(0xffe07a);
    expect(FACING_CHEVRON_OPACITY).toBe(0.991875);
    expect(FACING_CHEVRON_YAW_OFFSET).toBe(0);
  });
});

describe("facingChevronOffset", () => {
  test("yaw 0 → +Z", () => {
    const o = facingChevronOffset(0);
    expect(o.x).toBeCloseTo(0, 10);
    expect(o.z).toBeCloseTo(FACING_CHEVRON_DIST, 10);
  });

  test("yaw +π/2 → +X", () => {
    const o = facingChevronOffset(Math.PI / 2);
    expect(o.x).toBeCloseTo(FACING_CHEVRON_DIST, 10);
    expect(o.z).toBeCloseTo(0, 10);
  });

  test("yaw π → −Z", () => {
    const o = facingChevronOffset(Math.PI);
    expect(o.x).toBeCloseTo(0, 10);
    expect(o.z).toBeCloseTo(-FACING_CHEVRON_DIST, 10);
  });

  test("custom dist escala el offset", () => {
    const o = facingChevronOffset(0, 2);
    expect(o.x).toBeCloseTo(0, 10);
    expect(o.z).toBeCloseTo(2, 10);
    const e = facingChevronOffset(Math.PI / 2, 0.25);
    expect(e.x).toBeCloseTo(0.25, 10);
    expect(e.z).toBeCloseTo(0, 10);
  });

  test("yaw/dist no finitos → offset finito", () => {
    for (const yaw of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const o = facingChevronOffset(yaw);
      expect(Number.isFinite(o.x)).toBe(true);
      expect(Number.isFinite(o.z)).toBe(true);
      expect(o.x).toBeCloseTo(0, 10);
      expect(o.z).toBeCloseTo(FACING_CHEVRON_DIST, 10);
    }
    const d = facingChevronOffset(0, Number.NaN);
    expect(Number.isFinite(d.x)).toBe(true);
    expect(Number.isFinite(d.z)).toBe(true);
    expect(d.z).toBeCloseTo(FACING_CHEVRON_DIST, 10);
    const inf = facingChevronOffset(Math.PI / 2, Number.POSITIVE_INFINITY);
    expect(Number.isFinite(inf.x)).toBe(true);
    expect(Number.isFinite(inf.z)).toBe(true);
    expect(inf.x).toBeCloseTo(FACING_CHEVRON_DIST, 10);
  });
});

describe("facingChevronVisible (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: hidden; ya oculto no-op; load-muerto no; vivo/load-vivo sí", () => {
    expect(facingChevronVisible(true)).toBe(false);
    expect(facingChevronVisible(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(facingChevronVisible(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(facingChevronVisible(liveRt.gameOver)).toBe(true);
  });

  test("Game freeze / enterGameOver / F9 load-muerto ocultan chevron; vivo usa helper; mixer death se queda", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("facingChevronVisible(");
    expect(src).toContain("this.view.hideFacingChevron()");
    expect(src).toMatch(
      /syncFacingChevron\(\): void \{[\s\S]{0,280}facingChevronVisible\(\s*this\.gameOver/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2600}this\.syncFacingChevron\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}this\.syncFacingChevron\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,4200}this\.syncFacingChevron\(\)/,
    );
    expect(src).toMatch(
      /this\.view\.tickPlayerLoco\(dt, false, false\);[\s\S]{0,280}this\.syncFacingChevron\(\)/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeLoad\(\)/,
    );
    expect(src).toMatch(
      /Mixer must keep ticking during freeze[\s\S]{0,160}this\.view\.tickPlayerLoco\(dt, false, false\)/,
    );

    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("facingChevronVisible(");
    expect(viewSrc).toContain("hideFacingChevron");
    expect(viewSrc).toContain("showFacingChevron");
    expect(viewSrc).toContain("playerMixer.update(dt, currentRole(playerAnimator))");
    expect(viewSrc).not.toMatch(
      /function placeFacingChevron\(\): void \{[\s\S]{0,240}chevronMesh\.visible = true/,
    );
  });
});
