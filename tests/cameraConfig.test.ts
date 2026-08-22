import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import {
  ISO_FRUSTUM,
  ISO_FRUSTUM_MAX,
  ISO_FRUSTUM_MIN,
  ISO_FRUSTUM_STEP,
  CAMERA_FOLLOW_OFFSET,
  CAMERA_FOLLOW_Y,
  CAMERA_LOOK_X_SPAWN,
  CAMERA_LOOK_Z_SPAWN,
  applyIsoZoom,
  applyZoomInput,
  cameraFollowLookXAfterRestart,
  cameraFollowLookXFromLook,
  cameraFollowLookZAfterRestart,
  cameraFollowLookZFromLook,
  cameraFollowPosXAfterRestart,
  cameraFollowPosXFromLook,
  cameraFollowPosYAfterRestart,
  cameraFollowPosYFromLook,
  cameraFollowPosZAfterRestart,
  cameraFollowPosZFromLook,
  clampIsoFrustum,
  isoFrustumAfterRestart,
  nextIsoZoom,
  zoomHudMsg,
  zoomInFrustum,
  zoomInputApplies,
  zoomOutFrustum,
  ZOOM_IN_HUD_MSG,
  ZOOM_OUT_HUD_MSG,
} from "../src/render/cameraConfig";
import { createNeighborhood } from "../src/world/neighborhood";
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

describe("isoFrustumAfterRestart (R / softReset)", () => {
  test("reinicio → ISO_FRUSTUM; zoomed current no filtra", () => {
    expect(isoFrustumAfterRestart()).toBe(ISO_FRUSTUM);
    expect(isoFrustumAfterRestart()).toBe(8);

    let current = ISO_FRUSTUM_MIN;
    expect(current).toBe(6);
    current = isoFrustumAfterRestart();
    expect(current).toBe(ISO_FRUSTUM);
    expect(current).not.toBe(ISO_FRUSTUM_MIN);

    current = ISO_FRUSTUM_MAX;
    expect(current).toBe(16);
    current = isoFrustumAfterRestart();
    expect(current).toBe(ISO_FRUSTUM);
    expect(current).not.toBe(ISO_FRUSTUM_MAX);

    current = 10;
    current = isoFrustumAfterRestart();
    expect(current).toBe(ISO_FRUSTUM);
  });

  test("vivo +/- no usa el helper (nextIsoZoom igual que hoy)", () => {
    expect(applyIsoZoom(false, 10, true, false)).toEqual(
      nextIsoZoom(10, true, false),
    );
    expect(applyIsoZoom(false, 10, false, true)).toEqual(
      nextIsoZoom(10, false, true),
    );
    expect(applyIsoZoom(false, 10, true, false).frustum).not.toBe(
      isoFrustumAfterRestart(),
    );
    expect(ZOOM_IN_HUD_MSG).toBe("acercaste");
    expect(ZOOM_OUT_HUD_MSG).toBe("alejaste");
    expect(zoomHudMsg("in")).toBe("acercaste");
    expect(zoomHudMsg("out")).toBe("alejaste");
  });

  test("Game softReset asigna helper + resize; F9 load no toca frustum; freeze drena R/F9/M", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("isoFrustumAfterRestart(");
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3200}this\.isoFrustum = isoFrustumAfterRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3200}this\.isoFrustum = isoFrustumAfterRestart\(\);[\s\S]{0,80}this\.resize\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view = createWorldView\(this\.map, this\.containers\);[\s\S]{0,200}this\.isoFrustum = isoFrustumAfterRestart\(\)/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}isoFrustumAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}this\.isoFrustum\s*=/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,3600}isoFrustumAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}isoFrustumAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}this\.isoFrustum\s*=/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeLoad\(\)/,
    );
    expect(gameSrc).toContain("if (next.msg) this.lastLootMsg = next.msg");
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,2400}acercaste/,
    );
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,2400}alejaste/,
    );
  });
});

describe("PLAYER_SOLDIER_MANIFEST scale (iso presence)", () => {
  test("scale > 1 para presencia vs tiles/hostiles", () => {
    expect(PLAYER_SOLDIER_MANIFEST.scale).toBeGreaterThan(1);
    expect(PLAYER_SOLDIER_MANIFEST.yOffset).toBe(0);
  });
});

describe("cameraFollowAfterRestart (R / softReset)", () => {
  test("look fresco (spawn 24.5, 15.5); leftover mid-life origin no filtra", () => {
    const bootLookX = cameraFollowLookXAfterRestart();
    const bootLookZ = cameraFollowLookZAfterRestart();
    const bootPosX = cameraFollowPosXAfterRestart();
    const bootPosY = cameraFollowPosYAfterRestart();
    const bootPosZ = cameraFollowPosZAfterRestart();
    const barrio = createNeighborhood(48);
    expect(bootLookX).toBe(cameraFollowLookXFromLook(24.5));
    expect(bootLookZ).toBe(cameraFollowLookZFromLook(15.5));
    expect(bootLookX).toBe(CAMERA_LOOK_X_SPAWN);
    expect(bootLookZ).toBe(CAMERA_LOOK_Z_SPAWN);
    expect(bootLookX).toBe(barrio.spawn.x);
    expect(bootLookZ).toBe(barrio.spawn.y);
    expect(cameraFollowLookXAfterRestart(24.5)).toBe(bootLookX);
    expect(cameraFollowLookZAfterRestart(15.5)).toBe(bootLookZ);
    expect(cameraFollowLookXAfterRestart(0)).toBe(cameraFollowLookXFromLook(0));
    expect(cameraFollowLookZAfterRestart(40)).toBe(cameraFollowLookZFromLook(40));

    expect(CAMERA_FOLLOW_OFFSET).toBe(12);
    expect(CAMERA_FOLLOW_Y).toBe(14);
    expect(bootPosX).toBe(cameraFollowPosXFromLook(24.5));
    expect(bootPosY).toBe(cameraFollowPosYFromLook());
    expect(bootPosZ).toBe(cameraFollowPosZFromLook(15.5));
    expect(bootPosX).toBe(24.5 + CAMERA_FOLLOW_OFFSET);
    expect(bootPosY).toBe(CAMERA_FOLLOW_Y);
    expect(bootPosZ).toBe(15.5 + CAMERA_FOLLOW_OFFSET);
    expect(cameraFollowPosXAfterRestart(24.5)).toBe(bootPosX);
    expect(cameraFollowPosZAfterRestart(15.5)).toBe(bootPosZ);
    expect(cameraFollowPosYAfterRestart()).toBe(bootPosY);

    const leftoverCtorLookX = 0;
    const leftoverCtorLookZ = 0;
    const leftoverCtorPosX = 12;
    const leftoverCtorPosZ = 12;
    expect(leftoverCtorLookX).not.toBe(bootLookX);
    expect(leftoverCtorLookZ).not.toBe(bootLookZ);
    expect(leftoverCtorLookX).toBe(0);
    expect(leftoverCtorLookZ).toBe(0);
    expect(cameraFollowLookXFromLook(24.5)).not.toBe(leftoverCtorLookX);
    expect(cameraFollowLookZFromLook(15.5)).not.toBe(leftoverCtorLookZ);
    expect(leftoverCtorPosX).toBe(cameraFollowPosXFromLook(0));
    expect(leftoverCtorPosZ).toBe(cameraFollowPosZFromLook(0));
    expect(leftoverCtorPosX).not.toBe(bootPosX);
    expect(leftoverCtorPosZ).not.toBe(bootPosZ);

    const leftoverFarLookX = cameraFollowLookXFromLook(40);
    const leftoverFarLookZ = cameraFollowLookZFromLook(30);
    expect(leftoverFarLookX).toBe(40);
    expect(leftoverFarLookZ).toBe(30);
    expect(leftoverFarLookX).not.toBe(bootLookX);
    expect(leftoverFarLookZ).not.toBe(bootLookZ);
    expect(leftoverFarLookX).not.toBe(cameraFollowLookXAfterRestart());
    expect(leftoverFarLookZ).not.toBe(cameraFollowLookZAfterRestart());
    expect(cameraFollowPosXFromLook(40)).not.toBe(cameraFollowPosXAfterRestart());
    expect(cameraFollowPosZFromLook(30)).not.toBe(cameraFollowPosZAfterRestart());

    const leftoverOrigin = cameraFollowLookXFromLook(0);
    expect(leftoverOrigin).toBe(0);
    expect(leftoverOrigin).not.toBe(cameraFollowLookXAfterRestart());

    expect(cameraFollowLookXFromLook(24.5)).toBe(bootLookX);
    expect(cameraFollowLookZFromLook(15.5)).toBe(bootLookZ);
    expect(cameraFollowPosXFromLook(24.5, 0.2)).toBe(bootPosX + 0.2);
    expect(cameraFollowPosZFromLook(15.5, -0.1)).toBe(bootPosZ - 0.1);
    expect(isoFrustumAfterRestart()).toBe(ISO_FRUSTUM);
  });

  test("vivo tick no usa el helper (look avanza con player)", () => {
    const bootLookX = cameraFollowLookXAfterRestart();
    const bootLookZ = cameraFollowLookZAfterRestart();
    const liveLookX = cameraFollowLookXFromLook(40);
    const liveLookZ = cameraFollowLookZFromLook(30);
    expect(liveLookX).toBe(40);
    expect(liveLookZ).toBe(30);
    expect(liveLookX).not.toBe(bootLookX);
    expect(liveLookZ).not.toBe(bootLookZ);
    expect(liveLookX).not.toBe(cameraFollowLookXAfterRestart());
    expect(liveLookZ).not.toBe(cameraFollowLookZAfterRestart());
    expect(liveLookX).toBeGreaterThan(bootLookX);
    expect(liveLookZ).toBeGreaterThan(bootLookZ);
    expect(cameraFollowPosXFromLook(40)).not.toBe(cameraFollowPosXAfterRestart());
    expect(cameraFollowPosZFromLook(30)).not.toBe(cameraFollowPosZAfterRestart());

    expect(cameraFollowLookXFromLook(24.5)).toBe(bootLookX);
    expect(cameraFollowLookZFromLook(15.5)).toBe(bootLookZ);
    expect(cameraFollowLookXFromLook(0)).toBe(0);
    expect(cameraFollowPosXFromLook(0)).toBe(CAMERA_FOLLOW_OFFSET);
    expect(cameraFollowPosZFromLook(0)).toBe(CAMERA_FOLLOW_OFFSET);
  });
});

describe("camera follow/look recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace camera look fresco; F9 no helper", () => {
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
    const camSrc = readFileSync(
      resolve(process.cwd(), "src/render/cameraConfig.ts"),
      "utf8",
    );
    expect(camSrc).toContain("cameraFollowLookXAfterRestart(");
    expect(camSrc).toContain("cameraFollowLookZAfterRestart(");
    expect(camSrc).toContain("cameraFollowLookXFromLook(");
    expect(camSrc).toContain("cameraFollowLookZFromLook(");
    expect(camSrc).toContain("cameraFollowPosXAfterRestart(");
    expect(camSrc).toContain("cameraFollowPosZAfterRestart(");
    expect(camSrc).toContain("cameraFollowPosXFromLook(");
    expect(camSrc).toContain("cameraFollowPosZFromLook(");
    expect(camSrc).toContain("CAMERA_LOOK_X_SPAWN");
    expect(camSrc).toContain("CAMERA_LOOK_Z_SPAWN");
    expect(camSrc).toMatch(
      /cameraFollowLookXAfterRestart\([\s\S]{0,200}cameraFollowLookXFromLook\(/,
    );
    expect(camSrc).toMatch(
      /cameraFollowLookZAfterRestart\([\s\S]{0,200}cameraFollowLookZFromLook\(/,
    );
    expect(viewSrc).toContain("cameraFollowLookXAfterRestart(");
    expect(viewSrc).toContain("cameraFollowLookZAfterRestart(");
    expect(viewSrc).toContain("cameraFollowLookXFromLook(");
    expect(viewSrc).toContain("cameraFollowLookZFromLook(");
    expect(viewSrc).toContain("cameraFollowPosXAfterRestart(");
    expect(viewSrc).toContain("cameraFollowPosZAfterRestart(");
    expect(viewSrc).toContain("cameraFollowPosXFromLook(");
    expect(viewSrc).toContain("cameraFollowPosZFromLook(");
    expect(viewSrc).toMatch(
      /camera\.position\.set\(\s*cameraFollowPosXAfterRestart\(\s*CAMERA_LOOK_X_SPAWN,\s*cameraShakeOffsetXAfterRestart\(\s*\),\s*\),\s*cameraFollowPosYAfterRestart\(\s*\),\s*cameraFollowPosZAfterRestart\(\s*CAMERA_LOOK_Z_SPAWN,\s*cameraShakeOffsetZAfterRestart\(\s*\),\s*\)/,
    );
    expect(viewSrc).toMatch(
      /camera\.lookAt\(\s*cameraFollowLookXAfterRestart\(\s*\),\s*0,\s*cameraFollowLookZAfterRestart\(\s*\)/,
    );
    expect(viewSrc).toMatch(
      /cameraFollowPosXFromLook\(\s*x,\s*cameraShakeOffsetXFromLook\(cameraShakeOut\.offsetX\)/,
    );
    expect(viewSrc).toMatch(
      /cameraFollowPosZFromLook\(\s*y,\s*cameraShakeOffsetZFromLook\(cameraShakeOut\.offsetZ\)/,
    );
    expect(viewSrc).toMatch(
      /camera\.lookAt\(\s*cameraFollowLookXFromLook\(\s*x\),\s*0,\s*cameraFollowLookZFromLook\(\s*y\)/,
    );
    expect(viewSrc).not.toMatch(/camera\.position\.set\(\s*12,\s*14,\s*12\s*\)/);
    expect(viewSrc).not.toMatch(/camera\.lookAt\(\s*0,\s*0,\s*0\s*\)/);
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3100}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}this\.view\.followCamera\(\s*this\.player\.x,\s*this\.player\.y\)/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}cameraFollowLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}cameraFollowLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}cameraFollowLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}cameraFollowLookXAfterRestart/,
    );
    expect(gameSrc).not.toContain("cameraFollowLookXAfterRestart(");
    expect(gameSrc).not.toContain("cameraFollowLookZAfterRestart(");
    expect(gameSrc).not.toContain("cameraFollowLookXFromLook(");
    expect(gameSrc).not.toContain("cameraFollowLookZFromLook(");
    expect(gameSrc).not.toContain("cameraFollowPosXAfterRestart(");
    expect(gameSrc).not.toContain("cameraFollowPosZAfterRestart(");
    expect(saveSrc).not.toContain("cameraFollowLookXAfterRestart");
    expect(saveSrc).not.toContain("cameraFollowLookZAfterRestart");
    expect(saveSrc).not.toContain("cameraFollowLookXFromLook");
    expect(saveSrc).not.toContain("cameraFollowLookZFromLook");
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
