import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  BLADE_COLOR,
  BLADE_SY_BASE,
  BLADE_SY_RANGE,
  BLADE_WIND_SEED_STEP,
  BLADE_XZ_PAD,
  BLADE_XZ_RANGE,
  BLADE_Y_MUL,
  BLADES_PER_TILE,
  bladeBasePose,
  bladePoseAfterRestart,
  bladePoseAt,
  bladePoseFromWindTime,
  bladeWind,
  bladeWindAfterRestart,
  bladeWindFromTime,
  buildBladePoses,
  collectGrassTiles,
  countSolidsNear,
  grassWindTimeAfterRestart,
  GRASS_RADIUS,
  MAX_GRASS_INSTANCES,
  tileAcceptsGrass,
  grassVisualApplies,
  tickGrassWindTime,
  WIND_PHASE_Z_MUL,
  WIND_SPEED,
  WIND_SPEED_Z_MUL,
  WIND_SWAY,
  WIND_SWAY_Z_MUL,
  WIND_YAW,
} from "../src/render/windGrass";
import type { TileKind } from "../src/world/tile";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";

describe("tileAcceptsGrass", () => {
  test("solo floor outdoor", () => {
    expect(tileAcceptsGrass("floor", true)).toBe(true);
    expect(tileAcceptsGrass("floor", false)).toBe(false);
    expect(tileAcceptsGrass("wall", true)).toBe(false);
    expect(tileAcceptsGrass("door", true)).toBe(false);
    expect(tileAcceptsGrass("furniture", true)).toBe(false);
    expect(tileAcceptsGrass("barricade", true)).toBe(false);
    expect(tileAcceptsGrass(undefined, true)).toBe(false);
  });
});

describe("collectGrassTiles", () => {
  test("omite walls/indoor; solo outdoor floor en radio", () => {
    // Patio abierto + un muro en (0,0) y cluster indoor lejos
    const grid: Record<string, TileKind> = {};
    for (let y = -4; y <= 4; y++) {
      for (let x = -4; x <= 4; x++) {
        grid[`${x},${y}`] = "floor";
      }
    }
    grid["0,0"] = "wall";
    // Indoor: muchos muros alrededor de (10,10)
    for (let y = 8; y <= 12; y++) {
      for (let x = 8; x <= 12; x++) {
        grid[`${x},${y}`] = "floor";
      }
    }
    grid["9,9"] = "wall";
    grid["10,9"] = "wall";
    grid["11,9"] = "wall";
    grid["9,10"] = "wall";

    const getKind = (x: number, y: number) => grid[`${x},${y}`];
    const tiles = collectGrassTiles(0, 0, getKind, 3);

    expect(tiles.every((t) => Math.max(Math.abs(t.tx), Math.abs(t.ty)) <= 3)).toBe(
      true,
    );
    expect(tiles.some((t) => t.tx === 0 && t.ty === 0)).toBe(false);
    expect(tiles.length).toBeGreaterThan(0);
    // Todos floor outdoor
    for (const t of tiles) {
      expect(grid[`${t.tx},${t.ty}`]).toBe("floor");
      expect(countSolidsNear(getKind, t.tx, t.ty)).toBeLessThan(3);
    }
  });

  test("radio por defecto acotado", () => {
    expect(GRASS_RADIUS).toBe(8);
    expect(MAX_GRASS_INSTANCES).toBeLessThanOrEqual(400);
    expect(MAX_GRASS_INSTANCES).toBeGreaterThanOrEqual(200);
  });
});

describe("blade transforms + wind", () => {
  test("blades per tile 3 × 1.15 → 4; seed/phase/y/xz/sy/wind iguales", () => {
    expect(WIND_SWAY).toBe(0.0595125);
    expect(WIND_SWAY).toBeCloseTo(0.05175 * 1.15, 10);
    expect(WIND_SWAY_Z_MUL).toBe(0.7475);
    expect(WIND_SWAY_Z_MUL).toBeCloseTo(0.65 * 1.15, 10);
    expect(WIND_YAW).toBe(0.3703);
    expect(WIND_YAW).toBeCloseTo(0.322 * 1.15, 10);
    expect(WIND_SPEED).toBe(3.174);
    expect(WIND_SPEED).toBeCloseTo(2.76 * 1.15, 10);
    expect(WIND_SPEED_Z_MUL).toBe(1.5755);
    expect(WIND_SPEED_Z_MUL).toBeCloseTo(1.37 * 1.15, 10);
    expect(WIND_PHASE_Z_MUL).toBe(1.955);
    expect(WIND_PHASE_Z_MUL).toBeCloseTo(1.7 * 1.15, 10);
    expect(BLADE_WIND_SEED_STEP).toBe(0.1955);
    expect(BLADE_WIND_SEED_STEP).toBeCloseTo(0.17 * 1.15, 10);
    expect(BLADE_SY_BASE).toBe(0.8625);
    expect(BLADE_SY_BASE).toBeCloseTo(0.75 * 1.15, 10);
    expect(BLADE_SY_RANGE).toBe(0.6325);
    expect(BLADE_SY_RANGE).toBeCloseTo(0.55 * 1.15, 10);
    expect(BLADE_XZ_RANGE).toBe(0.736);
    expect(BLADE_XZ_RANGE).toBeCloseTo(0.64 * 1.15, 10);
    expect(BLADE_XZ_PAD).toBe(0.1566);
    expect(BLADE_XZ_PAD).toBeCloseTo(0.18 * 0.87, 10);
    expect(BLADE_Y_MUL).toBe(0.207);
    expect(BLADE_Y_MUL).toBeCloseTo(0.18 * 1.15, 10);
    expect(BLADES_PER_TILE).toBe(4);
    expect(MAX_GRASS_INSTANCES).toBe(368);
    expect(BLADE_COLOR).toBe(0x557a40);
  });

  test("BLADE_COLOR 0x4a6a38 × 1.15; worldView still uses it", () => {
    expect(BLADE_COLOR).toBe(0x557a40);
    const r = (BLADE_COLOR >> 16) & 0xff;
    const g = (BLADE_COLOR >> 8) & 0xff;
    const b = BLADE_COLOR & 0xff;
    expect(r).toBe(0x55);
    expect(g).toBe(0x7a);
    expect(b).toBe(0x40);
    expect(Math.round((0x4a * 115) / 100)).toBe(r);
    expect(Math.round((0x6a * 115) / 100)).toBe(g);
    expect(Math.round((0x38 * 115) / 100)).toBe(b);
    expect(GRASS_RADIUS).toBe(8);
    expect(MAX_GRASS_INSTANCES).toBe(368);
    expect(BLADES_PER_TILE).toBe(4);
    expect(BLADE_SY_BASE).toBe(0.8625);
    expect(BLADE_SY_RANGE).toBe(0.6325);
    expect(BLADE_XZ_RANGE).toBe(0.736);
    expect(BLADE_XZ_PAD).toBe(0.1566);
    expect(BLADE_Y_MUL).toBe(0.207);
    expect(BLADE_WIND_SEED_STEP).toBe(0.1955);
    expect(WIND_SWAY).toBe(0.0595125);
    expect(WIND_SWAY_Z_MUL).toBe(0.7475);
    expect(WIND_YAW).toBe(0.3703);
    expect(WIND_SPEED).toBe(3.174);
    expect(WIND_SPEED_Z_MUL).toBe(1.5755);
    expect(WIND_PHASE_Z_MUL).toBe(1.955);
    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("color: BLADE_COLOR");
    expect(viewSrc).toContain(
      "grassMat.color.setHex(applyNightGroundLift(BLADE_COLOR, d))",
    );
    expect(viewSrc).not.toContain("0x4a6a38");
  });

  test("base pose dentro del tile; wind oscila", () => {
    const base = bladeBasePose(5, 2, 0, 0.3);
    expect(base.x).toBeGreaterThanOrEqual(5);
    expect(base.x).toBeLessThan(6);
    expect(base.z).toBeGreaterThanOrEqual(2);
    expect(base.z).toBeLessThan(3);
    expect(base.sy).toBeGreaterThan(0.5);

    const w0 = bladeWind(0, 0.25);
    const w1 = bladeWind(Math.PI / (2 * WIND_SPEED), 0.25); // ~sin peak-ish
    expect(Math.abs(w0.dx)).toBeLessThanOrEqual(WIND_SWAY + 1e-9);
    expect(Math.abs(w0.dyaw)).toBeLessThanOrEqual(WIND_YAW + 1e-9);
    expect(Math.abs(w1.dx) + Math.abs(w1.dz)).toBeGreaterThan(0);
    expect(Math.abs(w1.dyaw)).toBeLessThanOrEqual(WIND_YAW + 1e-9);

    const p0 = bladePoseAt(5, 2, 1, 0.4, 0);
    const p1 = bladePoseAt(5, 2, 1, 0.4, 1.1);
    expect(p0.x !== p1.x || p0.z !== p1.z || p0.yaw !== p1.yaw).toBe(true);
  });

  test("buildBladePoses respeta cap", () => {
    const many: { tx: number; ty: number; seed: number }[] = [];
    for (let i = 0; i < 200; i++) {
      many.push({ tx: i % 20, ty: Math.floor(i / 20), seed: i / 200 });
    }
    const poses = buildBladePoses(many, 0, 50, BLADES_PER_TILE);
    expect(poses.length).toBe(50);
  });
});

describe("grassVisualApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: no aplica; load-muerto no; vivo/load-vivo sí", () => {
    expect(grassVisualApplies(true)).toBe(false);
    expect(grassVisualApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(grassVisualApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(grassVisualApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver no avanza tiempo/offset; vivo sí; dt<=0 no-op", () => {
    expect(tickGrassWindTime(1.5, 0.2, true)).toBe(1.5);
    expect(tickGrassWindTime(1.5, 0.2, false)).toBeCloseTo(1.7, 10);
    expect(tickGrassWindTime(1.5, 0, false)).toBe(1.5);
    expect(tickGrassWindTime(1.5, -1, false)).toBe(1.5);
    expect(tickGrassWindTime(1.5, Number.NaN, false)).toBe(1.5);

    const frozen = tickGrassWindTime(0.4, 1.1, true);
    const live = tickGrassWindTime(0.4, 1.1, false);
    const pFrozen = bladePoseAt(5, 2, 1, 0.4, frozen);
    const pStart = bladePoseAt(5, 2, 1, 0.4, 0.4);
    const pLive = bladePoseAt(5, 2, 1, 0.4, live);
    expect(pFrozen).toEqual(pStart);
    expect(pLive.x !== pStart.x || pLive.z !== pStart.z || pLive.yaw !== pStart.yaw).toBe(
      true,
    );
  });

  test("Game freeze / enterGameOver / F9 load-muerto congelan grass; vivo tickea", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("grassVisualApplies(");
    expect(src).toMatch(
      /syncGrassVisual\(dt = 0\): void \{[\s\S]{0,280}grassVisualApplies\(\s*this\.gameOver\) \? dt : 0/,
    );
    expect(src).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,1500}this\.syncGrassVisual\(\)/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,1500}this\.syncGrassVisual\(\)/,
    );
    expect(src).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.syncGrassVisual\(dt\)/,
    );
    expect(src).toMatch(
      /this\.syncRainVisual\(dt\);\s*this\.syncGrassVisual\(dt\);/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(src).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.view\.syncGrass\([\s\S]{0,80}\bdt\b/,
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

    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain("tickGrassWindTime(");
    expect(viewSrc).not.toContain("grassTime += Math.max(0, dt)");
  });
});

describe("grassWindTimeAfterRestart (R / softReset)", () => {
  test("viento fresco (time 0); leftover sway no filtra", () => {
    const boot = grassWindTimeAfterRestart();
    expect(boot).toBe(0);
    expect(boot).toBe(tickGrassWindTime(0, 0, false));

    const leftoverTime = Math.PI / WIND_SPEED;
    expect(leftoverTime).not.toBe(boot);
    expect(tickGrassWindTime(leftoverTime, 0.2, true)).toBe(leftoverTime);
    expect(tickGrassWindTime(leftoverTime, 0.2, true)).not.toBe(boot);

    const leftoverWind = bladeWindFromTime(leftoverTime, 0.25);
    const bootWind = bladeWindAfterRestart(0.25);
    expect(bootWind).toEqual(bladeWindFromTime(boot, 0.25));
    expect(bootWind).toEqual(bladeWind(0, 0.25));
    expect(leftoverWind).not.toEqual(bootWind);
    expect(leftoverWind.dx).not.toBe(bootWind.dx);
    expect(leftoverWind.dyaw).not.toBe(bootWind.dyaw);

    const leftoverPose = bladePoseFromWindTime(5, 2, 1, 0.4, leftoverTime);
    const bootPose = bladePoseAfterRestart(5, 2, 1, 0.4);
    expect(bootPose).toEqual(bladePoseAt(5, 2, 1, 0.4, boot));
    expect(leftoverPose).not.toEqual(bootPose);
    expect(
      leftoverPose.x !== bootPose.x ||
        leftoverPose.z !== bootPose.z ||
        leftoverPose.yaw !== bootPose.yaw,
    ).toBe(true);
  });

  test("vivo tick no usa el helper (time avanza)", () => {
    const boot = grassWindTimeAfterRestart();
    const live = tickGrassWindTime(boot, 0.2, false);
    expect(live).toBeCloseTo(0.2, 10);
    expect(live).not.toBe(grassWindTimeAfterRestart());
    expect(bladeWindFromTime(live, 0.25)).not.toEqual(bladeWindAfterRestart(0.25));
    expect(bladePoseFromWindTime(5, 2, 1, 0.4, live)).not.toEqual(
      bladePoseAfterRestart(5, 2, 1, 0.4),
    );
  });
});

describe("grass recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace grassTime fresco; F9 no helper", () => {
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
    const grassSrc = readFileSync(
      resolve(process.cwd(), "src/render/windGrass.ts"),
      "utf8",
    );
    expect(grassSrc).toContain("grassWindTimeAfterRestart(");
    expect(grassSrc).toContain("bladeWindFromTime(");
    expect(grassSrc).toContain("bladePoseFromWindTime(");
    expect(grassSrc).toMatch(
      /bladePoseAt\([\s\S]{0,280}bladeWindFromTime\(/,
    );
    expect(viewSrc).toContain("grassWindTimeAfterRestart(");
    expect(viewSrc).toContain("bladePoseFromWindTime(");
    expect(viewSrc).toMatch(
      /let grassTime = grassWindTimeAfterRestart\(\)/,
    );
    expect(viewSrc).toMatch(
      /applyGrassPoses\(\): void \{[\s\S]{0,280}bladePoseFromWindTime\(\s*t\.tx,\s*t\.ty,\s*b,\s*t\.seed,\s*grassTime\)/,
    );
    expect(viewSrc).toContain("tickGrassWindTime(");
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,200}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,2800}this\.view\.dispose\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.view\.dispose\(\);[\s\S]{0,80}this\.view = createWorldView/,
    );
    expect(gameSrc).toMatch(
      /syncGrassVisual\(dt = 0\): void \{[\s\S]{0,280}grassVisualApplies\(\s*this\.gameOver\) \? dt : 0/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.syncGrassVisual\(dt\)/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}grassWindTimeAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}grassWindTimeAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}grassWindTimeAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}grassWindTimeAfterRestart/,
    );
    expect(gameSrc).not.toContain("grassWindTimeAfterRestart(");
    expect(saveSrc).not.toContain("grassWindTimeAfterRestart");
    expect(saveSrc).not.toContain("grassTime");
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
