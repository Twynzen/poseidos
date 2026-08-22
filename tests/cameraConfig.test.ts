import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  ISO_FRUSTUM,
  ISO_FRUSTUM_MAX,
  ISO_FRUSTUM_MIN,
  ISO_FRUSTUM_STEP,
  applyIsoZoom,
  applyZoomInput,
  clampIsoFrustum,
  nextIsoZoom,
  zoomHudMsg,
  zoomInFrustum,
  zoomInputApplies,
  zoomOutFrustum,
  ZOOM_IN_HUD_MSG,
  ZOOM_OUT_HUD_MSG,
} from "../src/render/cameraConfig";
import { PLAYER_SOLDIER_MANIFEST } from "../src/render/characterManifest";

describe("ISO_FRUSTUM", () => {
  test("en rango legible 8–12 (zoom vs legacy 16)", () => {
    expect(ISO_FRUSTUM).toBeGreaterThanOrEqual(8);
    expect(ISO_FRUSTUM).toBeLessThanOrEqual(12);
    expect(ISO_FRUSTUM).toBe(8);
  });

  test("min/max/step para zoom runtime", () => {
    expect(ISO_FRUSTUM_MIN).toBe(6);
    expect(ISO_FRUSTUM_MAX).toBe(16);
    expect(ISO_FRUSTUM_STEP).toBe(1);
    expect(ISO_FRUSTUM_MIN).toBeLessThan(ISO_FRUSTUM);
    expect(ISO_FRUSTUM_MAX).toBeGreaterThan(ISO_FRUSTUM);
  });
});

describe("clampIsoFrustum / zoomInFrustum / zoomOutFrustum", () => {
  test("clamp dentro de [min, max]", () => {
    expect(clampIsoFrustum(10)).toBe(10);
    expect(clampIsoFrustum(ISO_FRUSTUM_MIN - 5)).toBe(ISO_FRUSTUM_MIN);
    expect(clampIsoFrustum(ISO_FRUSTUM_MAX + 5)).toBe(ISO_FRUSTUM_MAX);
  });

  test("zoom in disminuye frustum (más cerca)", () => {
    expect(zoomInFrustum(10)).toBe(9);
    expect(zoomInFrustum(ISO_FRUSTUM_MIN)).toBe(ISO_FRUSTUM_MIN);
    expect(zoomInFrustum(ISO_FRUSTUM_MIN + 0.5)).toBe(ISO_FRUSTUM_MIN);
  });

  test("zoom out aumenta frustum (más lejos)", () => {
    expect(zoomOutFrustum(10)).toBe(11);
    expect(zoomOutFrustum(ISO_FRUSTUM_MAX)).toBe(ISO_FRUSTUM_MAX);
    expect(zoomOutFrustum(ISO_FRUSTUM_MAX - 0.5)).toBe(ISO_FRUSTUM_MAX);
  });

  test("serie de zooms respeta bounds", () => {
    let f = ISO_FRUSTUM;
    for (let i = 0; i < 20; i++) f = zoomInFrustum(f);
    expect(f).toBe(ISO_FRUSTUM_MIN);
    for (let i = 0; i < 40; i++) f = zoomOutFrustum(f);
    expect(f).toBe(ISO_FRUSTUM_MAX);
  });
});

describe("nextIsoZoom / zoomHudMsg (HUD +/-)", () => {
  test("zoomHudMsg: acercaste vs alejaste", () => {
    expect(ZOOM_IN_HUD_MSG).toBe("acercaste");
    expect(ZOOM_OUT_HUD_MSG).toBe("alejaste");
    expect(zoomHudMsg("in")).toBe(ZOOM_IN_HUD_MSG);
    expect(zoomHudMsg("out")).toBe(ZOOM_OUT_HUD_MSG);
    expect(ZOOM_IN_HUD_MSG).not.toBe(ZOOM_OUT_HUD_MSG);
  });

  test("zoom changed: frustum + lastLootMsg; min/max no spam", () => {
    const midIn = nextIsoZoom(10, true, false);
    expect(midIn).toEqual({
      frustum: 9,
      changed: true,
      msg: ZOOM_IN_HUD_MSG,
    });

    const midOut = nextIsoZoom(10, false, true);
    expect(midOut).toEqual({
      frustum: 11,
      changed: true,
      msg: ZOOM_OUT_HUD_MSG,
    });

    const idle = nextIsoZoom(10, false, false);
    expect(idle).toEqual({ frustum: 10, changed: false, msg: null });

    const atMin = nextIsoZoom(ISO_FRUSTUM_MIN, true, false);
    expect(atMin).toEqual({
      frustum: ISO_FRUSTUM_MIN,
      changed: false,
      msg: null,
    });

    const atMax = nextIsoZoom(ISO_FRUSTUM_MAX, false, true);
    expect(atMax).toEqual({
      frustum: ISO_FRUSTUM_MAX,
      changed: false,
      msg: null,
    });

    const minThenOut = nextIsoZoom(ISO_FRUSTUM_MIN, true, true);
    expect(minThenOut.changed).toBe(true);
    expect(minThenOut.frustum).toBe(ISO_FRUSTUM_MIN + ISO_FRUSTUM_STEP);
    expect(minThenOut.msg).toBe(ZOOM_OUT_HUD_MSG);
  });

  test("Game applyIsoZoomInput asigna lastLootMsg/hudAcc via nextIsoZoom (sin lootToast)", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("nextIsoZoom(");
    expect(src).toContain("if (next.msg) this.lastLootMsg = next.msg");
    expect(src).toMatch(
      /if \(!next\.changed\) return;[\s\S]{0,180}this\.hudAcc = 1/,
    );
    expect(src).not.toMatch(/applyIsoZoomInput\(\)[\s\S]{0,400}lootToast/);
    expect(src).toContain("zoomInputApplies(this.gameOver)");
    expect((src.match(/consumeZoomIn\(\)/g) ?? []).length).toBeGreaterThanOrEqual(
      4,
    );
    expect((src.match(/consumeZoomOut\(\)/g) ?? []).length).toBeGreaterThanOrEqual(
      4,
    );
  });
});

describe("zoomInputApplies / applyZoomInput / applyIsoZoom (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: +/- no aplica; vivo / load-vivo sí", () => {
    expect(zoomInputApplies(true)).toBe(false);
    expect(zoomInputApplies(false)).toBe(true);

    const deadIn = applyIsoZoom(true, 10, true, false);
    expect(deadIn).toEqual({ frustum: 10, changed: false, msg: null });
    const deadOut = applyIsoZoom(true, 10, false, true);
    expect(deadOut).toEqual({ frustum: 10, changed: false, msg: null });
    const deadBoth = applyIsoZoom(true, 10, true, true);
    expect(deadBoth).toEqual({ frustum: 10, changed: false, msg: null });

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(zoomInputApplies(deadRt.gameOver)).toBe(false);
    expect(applyIsoZoom(deadRt.gameOver, 10, true, false)).toEqual({
      frustum: 10,
      changed: false,
      msg: null,
    });
    expect(applyIsoZoom(deadRt.gameOver, 10, false, true)).toEqual({
      frustum: 10,
      changed: false,
      msg: null,
    });

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(zoomInputApplies(liveRt.gameOver)).toBe(true);
    expect(applyIsoZoom(liveRt.gameOver, 10, true, false)).toEqual({
      frustum: 9,
      changed: true,
      msg: ZOOM_IN_HUD_MSG,
    });
    expect(applyIsoZoom(liveRt.gameOver, 10, false, true)).toEqual({
      frustum: 11,
      changed: true,
      msg: ZOOM_OUT_HUD_MSG,
    });
    expect(applyIsoZoom(false, 10, true, false)).toEqual(nextIsoZoom(10, true, false));
    expect(applyIsoZoom(false, 10, false, true)).toEqual(nextIsoZoom(10, false, true));
    expect(applyIsoZoom(false, ISO_FRUSTUM_MIN, true, false)).toEqual(
      nextIsoZoom(ISO_FRUSTUM_MIN, true, false),
    );
    expect(applyIsoZoom(false, ISO_FRUSTUM_MAX, false, true)).toEqual(
      nextIsoZoom(ISO_FRUSTUM_MAX, false, true),
    );
  });

  test("gameOver + wantsIn/wantsOut no muta frustum ni msg; vivo +/- cambia (min/max no spam)", () => {
    let deadFrustum = 10;
    expect(
      applyZoomInput(true, true, () => {
        const next = nextIsoZoom(deadFrustum, true, false);
        deadFrustum = next.frustum;
        return next;
      }),
    ).toBeNull();
    expect(deadFrustum).toBe(10);
    expect(applyIsoZoom(true, 10, true, false).msg).toBeNull();

    const deadRt = loadAliveRuntime(false);
    let deadOut = 12;
    expect(
      applyZoomInput(deadRt.gameOver, true, () => {
        const next = nextIsoZoom(deadOut, false, true);
        deadOut = next.frustum;
        return next;
      }),
    ).toBeNull();
    expect(deadOut).toBe(12);
    expect(applyIsoZoom(deadRt.gameOver, 12, false, true).msg).toBeNull();

    let live = 10;
    const zoomedIn = applyZoomInput(false, true, () => {
      const next = nextIsoZoom(live, true, false);
      live = next.frustum;
      return next;
    });
    expect(zoomedIn).toEqual({
      frustum: 9,
      changed: true,
      msg: ZOOM_IN_HUD_MSG,
    });
    expect(live).toBe(9);
    expect(
      applyZoomInput(false, false, () => {
        const next = nextIsoZoom(live, true, false);
        live = next.frustum;
        return next;
      }),
    ).toBeNull();
    expect(live).toBe(9);

    const liveRt = loadAliveRuntime(true);
    const zoomedOut = applyZoomInput(liveRt.gameOver, true, () => {
      const next = nextIsoZoom(live, false, true);
      live = next.frustum;
      return next;
    });
    expect(zoomedOut).toEqual({
      frustum: 10,
      changed: true,
      msg: ZOOM_OUT_HUD_MSG,
    });
    expect(live).toBe(10);

    const atMin = applyIsoZoom(false, ISO_FRUSTUM_MIN, true, false);
    expect(atMin).toEqual({
      frustum: ISO_FRUSTUM_MIN,
      changed: false,
      msg: null,
    });
    const atMax = applyIsoZoom(false, ISO_FRUSTUM_MAX, false, true);
    expect(atMax).toEqual({
      frustum: ISO_FRUSTUM_MAX,
      changed: false,
      msg: null,
    });
  });

  test("Game freeze / enterGameOver / F9 load-muerto drenan +/- sin zoom; vivo gatea", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("zoomInputApplies(");
    expect(gameSrc).toContain("nextIsoZoom(");
    expect(gameSrc).toMatch(
      /applyIsoZoomInput\(\): void \{[\s\S]{0,400}zoomInputApplies\(\s*this\.gameOver/,
    );
    expect(gameSrc).toMatch(
      /applyIsoZoomInput\(\): void \{[\s\S]{0,500}nextIsoZoom\(/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeZoomIn\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeZoomOut\(\)/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,3200}consumeZoomIn\(\)/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,3200}consumeZoomOut\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,3600}if \(loaded\.gameOver\) this\.input\.consumeZoomIn\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,3600}if \(loaded\.gameOver\) this\.input\.consumeZoomOut\(\)/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}nextIsoZoom/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}nextIsoZoom/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}zoomInputApplies/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}zoomInputApplies/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(gameSrc).toContain("if (next.msg) this.lastLootMsg = next.msg");
    expect(gameSrc).toMatch(
      /private tick\(dt: number\): void \{[\s\S]{0,80}this\.applyIsoZoomInput\(\)/,
    );
  });
});

describe("PLAYER_SOLDIER_MANIFEST scale (iso presence)", () => {
  test("scale > 1 para presencia vs tiles/hostiles", () => {
    expect(PLAYER_SOLDIER_MANIFEST.scale).toBeGreaterThan(1);
    expect(PLAYER_SOLDIER_MANIFEST.yOffset).toBe(0);
  });
});
