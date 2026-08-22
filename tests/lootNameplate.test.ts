import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { createNeighborhood } from "../src/world/neighborhood";
import {
  LOOT_NAMEPLATE_FADE_DIST,
  LOOT_NAMEPLATE_FILL,
  LOOT_NAMEPLATE_GOLD_FILL,
  LOOT_NAMEPLATE_GOLD_STROKE,
  LOOT_NAMEPLATE_FONT_PX,
  LOOT_NAMEPLATE_ICON_PAD,
  LOOT_NAMEPLATE_ICON_SIZE,
  LOOT_NAMEPLATE_ICON_STROKE,
  LOOT_NAMEPLATE_LOOK_X_SPAWN,
  LOOT_NAMEPLATE_LOOK_Z_SPAWN,
  LOOT_NAMEPLATE_MAX_CHARS,
  LOOT_NAMEPLATE_MID_SCALE,
  LOOT_NAMEPLATE_NEAR_DIST,
  LOOT_NAMEPLATE_PLATE_FILL,
  LOOT_NAMEPLATE_SCALE_X,
  LOOT_NAMEPLATE_SCALE_Y,
  LOOT_NAMEPLATE_STROKE_PX,
  LOOT_NAMEPLATE_TEXT_STROKE,
  LOOT_NAMEPLATE_Y,
  lootNameplateDistAfterRestart,
  lootNameplateDistFromLook,
  lootNameplateIconKind,
  lootNameplateInvEmpty,
  lootNameplateLabel,
  lootNameplateLeadId,
  lootNameplateLookXAfterRestart,
  lootNameplateLookXFromLook,
  lootNameplateLookZAfterRestart,
  lootNameplateLookZFromLook,
  lootNameplateOpacity,
  lootNameplateOpacityAfterRestart,
  lootNameplateOpacityFromLook,
  lootNameplateScale,
  lootNameplateScaleAfterRestart,
  lootNameplateScaleFromLook,
  lootNameplateVisible,
  lootNameplateVisibleAfterRestart,
  lootNameplateVisibleFromLook,
  paintLootNameplateIcon,
  truncateLootLabel,
} from "../src/render/lootNameplate";

describe("constantes", () => {
  test("GOLD_STROKE #ffe07a (#e8c36a ×1.15); icon-stroke/text/plate/gold/fill/stroke/font/fade/mid-scale/icon/pad/scale/Y sin cambio", () => {
    expect(LOOT_NAMEPLATE_GOLD_STROKE).toBe("#ffe07a");
    expect(LOOT_NAMEPLATE_ICON_STROKE).toBe(1.98375);
    expect(LOOT_NAMEPLATE_TEXT_STROKE).toBe("rgba(0,0,0,0.92575)");
    expect(LOOT_NAMEPLATE_PLATE_FILL).toBe("rgba(15, 23, 42, 0.9522)");
    expect(LOOT_NAMEPLATE_GOLD_FILL).toBe("rgba(232,195,106,0.4232)");
    expect(LOOT_NAMEPLATE_FILL).toBe("#ffdd6e");
    expect(LOOT_NAMEPLATE_STROKE_PX).toBe(5.95125);
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(44.965);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
  });

  test("paintLootNameplateIcon usa LOOT_NAMEPLATE_GOLD_STROKE", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/lootNameplate.ts"),
      "utf8",
    );
    expect(src).toContain("ctx.strokeStyle = LOOT_NAMEPLATE_GOLD_STROKE");
    expect(src).not.toMatch(/const GOLD_STROKE = /);
    expect(src).not.toMatch(/ctx\.strokeStyle = "#e8c36a"/);
    const ctx = mockNameplateCtx();
    paintLootNameplateIcon(ctx, "wood", 0, 0, 32);
    expect(ctx.strokeStyle).toBe(LOOT_NAMEPLATE_GOLD_STROKE);
    expect(ctx.strokeStyle).toBe("#ffe07a");
  });

  test("ICON_STROKE 1.98375 (1.725 × 1.15); text/plate/gold/fill/stroke/font/fade/mid-scale/icon/pad/scale/Y sin cambio", () => {
    expect(LOOT_NAMEPLATE_ICON_STROKE).toBe(1.98375);
    expect(LOOT_NAMEPLATE_ICON_STROKE).toBeCloseTo(1.725 * 1.15, 5);
    expect(LOOT_NAMEPLATE_TEXT_STROKE).toBe("rgba(0,0,0,0.92575)");
    expect(LOOT_NAMEPLATE_PLATE_FILL).toBe("rgba(15, 23, 42, 0.9522)");
    expect(LOOT_NAMEPLATE_GOLD_FILL).toBe("rgba(232,195,106,0.4232)");
    expect(LOOT_NAMEPLATE_FILL).toBe("#ffdd6e");
    expect(LOOT_NAMEPLATE_STROKE_PX).toBe(5.95125);
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(44.965);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
  });

  test("paintLootNameplateIcon usa LOOT_NAMEPLATE_ICON_STROKE", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/lootNameplate.ts"),
      "utf8",
    );
    expect(src).toContain("ctx.lineWidth = LOOT_NAMEPLATE_ICON_STROKE");
    expect(src).not.toMatch(/ctx\.lineWidth = 1\.5;/);
    const ctx = mockNameplateCtx();
    paintLootNameplateIcon(ctx, "wood", 0, 0, 32);
    expect(ctx.lineWidth).toBe(LOOT_NAMEPLATE_ICON_STROKE);
    expect(ctx.lineWidth).toBe(1.98375);
  });

  test("TEXT_STROKE opacity 0.92575 (0.805 × 1.15); plate/gold/fill/stroke/font/fade/mid-scale/icon/pad/scale/Y sin cambio", () => {
    expect(LOOT_NAMEPLATE_TEXT_STROKE).toBe("rgba(0,0,0,0.92575)");
    expect(LOOT_NAMEPLATE_TEXT_STROKE).toMatch(/rgba\(0,\s*0,\s*0,\s*0\.92575\)/);
    const opacity = Number(LOOT_NAMEPLATE_TEXT_STROKE.match(/[\d.]+(?=\)$)/)?.[0]);
    expect(opacity).toBe(0.92575);
    expect(opacity).toBeCloseTo(0.805 * 1.15, 5);
    expect(LOOT_NAMEPLATE_PLATE_FILL).toBe("rgba(15, 23, 42, 0.9522)");
    expect(LOOT_NAMEPLATE_GOLD_FILL).toBe("rgba(232,195,106,0.4232)");
    expect(LOOT_NAMEPLATE_FILL).toBe("#ffdd6e");
    expect(LOOT_NAMEPLATE_STROKE_PX).toBe(5.95125);
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(44.965);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
  });

  test("worldView aplica LOOT_NAMEPLATE_TEXT_STROKE al canvas existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("ctx.strokeStyle = LOOT_NAMEPLATE_TEXT_STROKE");
    expect(src).not.toMatch(/ctx\.strokeStyle = "rgba\(0,0,0,0\.7\)"/);
    expect(src).toContain("ctx.fillStyle = LOOT_NAMEPLATE_PLATE_FILL");
    expect(src).toContain("ctx.fillStyle = LOOT_NAMEPLATE_FILL");
    expect(src).toContain("ctx.lineWidth = LOOT_NAMEPLATE_STROKE_PX");
  });

  test("PLATE_FILL opacity 0.9522 (0.828 × 1.15); gold/fill/stroke/font/fade/mid-scale/icon/pad/scale/Y sin cambio", () => {
    expect(LOOT_NAMEPLATE_PLATE_FILL).toBe("rgba(15, 23, 42, 0.9522)");
    expect(LOOT_NAMEPLATE_PLATE_FILL).toMatch(
      /rgba\(15,\s*23,\s*42,\s*0\.9522\)/,
    );
    const opacity = Number(LOOT_NAMEPLATE_PLATE_FILL.match(/[\d.]+(?=\)$)/)?.[0]);
    expect(opacity).toBe(0.9522);
    expect(opacity).toBeCloseTo(0.828 * 1.15, 5);
    expect(LOOT_NAMEPLATE_GOLD_FILL).toBe("rgba(232,195,106,0.4232)");
    expect(LOOT_NAMEPLATE_FILL).toBe("#ffdd6e");
    expect(LOOT_NAMEPLATE_STROKE_PX).toBe(5.95125);
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(44.965);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
  });

  test("worldView aplica LOOT_NAMEPLATE_PLATE_FILL al canvas existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("ctx.fillStyle = LOOT_NAMEPLATE_PLATE_FILL");
    expect(src).not.toMatch(/ctx\.fillStyle = "rgba\(15,\s*23,\s*42,\s*0\.72\)"/);
    expect(src).toContain("ctx.fillStyle = LOOT_NAMEPLATE_FILL");
    expect(src).toContain("ctx.strokeStyle = LOOT_NAMEPLATE_TEXT_STROKE");
    expect(src).toContain("ctx.lineWidth = LOOT_NAMEPLATE_STROKE_PX");
  });

  test("GOLD_FILL opacity 0.4232 (0.368 × 1.15); fill/stroke/font/fade/mid-scale/icon/pad/scale/Y sin cambio", () => {
    expect(LOOT_NAMEPLATE_GOLD_FILL).toBe("rgba(232,195,106,0.4232)");
    expect(LOOT_NAMEPLATE_GOLD_FILL).toMatch(/rgba\(232,\s*195,\s*106,\s*0\.4232\)/);
    const opacity = Number(LOOT_NAMEPLATE_GOLD_FILL.match(/[\d.]+(?=\)$)/)?.[0]);
    expect(opacity).toBe(0.4232);
    expect(opacity).toBeCloseTo(0.368 * 1.15, 5);
    expect(LOOT_NAMEPLATE_FILL).toBe("#ffdd6e");
    expect(LOOT_NAMEPLATE_STROKE_PX).toBe(5.95125);
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(44.965);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
  });

  test("paintLootNameplateIcon usa LOOT_NAMEPLATE_GOLD_FILL", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/lootNameplate.ts"),
      "utf8",
    );
    expect(src).toContain("ctx.fillStyle = LOOT_NAMEPLATE_GOLD_FILL");
    expect(src).not.toMatch(/const GOLD_FILL = /);
    expect(src).not.toMatch(/rgba\(232,195,106,0\.32\)/);
    const ctx = mockNameplateCtx();
    paintLootNameplateIcon(ctx, "wood", 0, 0, 32);
    expect(ctx.fillStyle).toBe(LOOT_NAMEPLATE_GOLD_FILL);
    expect(ctx.fillStyle).toBe("rgba(232,195,106,0.4232)");
  });

  test("fill #ffdd6e (#f0c060 ×1.15); stroke/font/fade/mid-scale/iconos/scale/Y/teclas sin cambio", () => {
    expect(LOOT_NAMEPLATE_FILL).toBe("#ffdd6e");
    expect(LOOT_NAMEPLATE_STROKE_PX).toBe(5.95125);
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(44.965);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
  });

  test("worldView aplica LOOT_NAMEPLATE_FILL al canvas existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("ctx.fillStyle = LOOT_NAMEPLATE_FILL");
    expect(src).not.toMatch(/ctx\.fillStyle = "#f0c060"/);
    expect(src).toContain("ctx.strokeStyle = LOOT_NAMEPLATE_TEXT_STROKE");
    expect(src).toContain("ctx.lineWidth = LOOT_NAMEPLATE_STROKE_PX");
  });

  test("stroke 5.95125 (5.175 × 1.15); font/fade/mid-scale/iconos/scale/Y/teclas sin cambio", () => {
    expect(LOOT_NAMEPLATE_STROKE_PX).toBe(5.95125);
    expect(LOOT_NAMEPLATE_STROKE_PX).toBeCloseTo(5.175 * 1.15, 5);
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(44.965);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
  });

  test("worldView aplica LOOT_NAMEPLATE_STROKE_PX al canvas existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("ctx.lineWidth = LOOT_NAMEPLATE_STROKE_PX");
    expect(src).not.toMatch(/ctx\.lineWidth = 4\.5;/);
    expect(src).not.toMatch(/ctx\.lineWidth = 3;/);
    expect(src).toContain("ctx.strokeStyle = LOOT_NAMEPLATE_TEXT_STROKE");
    expect(src).toContain("ctx.fillStyle = LOOT_NAMEPLATE_FILL");
  });

  test("font 44.965 (39.1 × 1.15); fade/mid-scale/iconos/scale/Y/teclas sin cambio", () => {
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(44.965);
    expect(LOOT_NAMEPLATE_FONT_PX).toBeCloseTo(39.1 * 1.15, 5);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
  });

  test("worldView aplica LOOT_NAMEPLATE_FONT_PX al canvas existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain(
      "ctx.font = `600 ${LOOT_NAMEPLATE_FONT_PX}px ui-monospace, SF Mono, Menlo, Consolas, monospace`",
    );
    expect(src).not.toMatch(/ctx\.font = "600 34px/);
    expect(src).not.toMatch(/ctx\.font = "600 28px/);
    expect(src).toMatch(/const BASE_W = 384;/);
    expect(src).toMatch(/const H = 80;/);
    expect(src).toContain("ctx.lineWidth = LOOT_NAMEPLATE_STROKE_PX");
  });

  test("near dist 2.3 (2 × 1.15); fade/mid-scale/Y/iconos/scale/font/teclas sin cambio", () => {
    expect(LOOT_NAMEPLATE_NEAR_DIST).toBe(2.3);
    expect(LOOT_NAMEPLATE_NEAR_DIST).toBeCloseTo(2 * 1.15, 5);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
    expect(lootNameplateOpacity(LOOT_NAMEPLATE_NEAR_DIST)).toBe(1);
    expect(lootNameplateScale(LOOT_NAMEPLATE_NEAR_DIST)).toBe(1);
  });

  test("lootNameplateScale / Opacity usan LOOT_NAMEPLATE_NEAR_DIST", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/lootNameplate.ts"),
      "utf8",
    );
    expect(src).toContain("if (dist <= LOOT_NAMEPLATE_NEAR_DIST) return 1");
    expect(src).toContain("if (d <= LOOT_NAMEPLATE_NEAR_DIST) return 1");
    expect(src).toContain(
      "(dist - LOOT_NAMEPLATE_NEAR_DIST) /",
    );
    expect(src).toContain(
      "(d - LOOT_NAMEPLATE_NEAR_DIST) /",
    );
    expect(src).not.toMatch(/if \(dist <= 2\) return 1/);
    expect(src).not.toMatch(/if \(d <= 2\) return 1/);
  });

  test("mid-scale 0.6348 (0.552 × 1.15); fade/Y/iconos/scale/font/teclas sin cambio", () => {
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBeCloseTo(0.552 * 1.15, 5);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
    expect(lootNameplateScale(LOOT_NAMEPLATE_FADE_DIST)).toBe(
      LOOT_NAMEPLATE_MID_SCALE,
    );
    expect(lootNameplateScale(LOOT_NAMEPLATE_FADE_DIST)).toBe(0.6348);
  });

  test("fade dist 7.27375 (6.325 × 1.15); iconos/scale/Y/mid-scale/font/teclas sin cambio", () => {
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBeCloseTo(6.325 * 1.15, 5);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
    expect(lootNameplateOpacity(LOOT_NAMEPLATE_FADE_DIST)).toBe(0);
    expect(lootNameplateScale(LOOT_NAMEPLATE_FADE_DIST)).toBe(
      LOOT_NAMEPLATE_MID_SCALE,
    );
  });

  test("Y 2.843375 (2.4725 × 1.15); near/fade/mid-scale/iconos/scale/font/teclas sin cambio", () => {
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_Y).toBeCloseTo(2.4725 * 1.15, 5);
    expect(LOOT_NAMEPLATE_NEAR_DIST).toBe(2.3);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(44.965);
  });

  test("scaleX 3.4385 (2.99 × 1.15); Y/scale-y/near/fade/mid/iconos/font/teclas sin cambio", () => {
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_X).toBeCloseTo(2.99 * 1.15, 5);
    expect(LOOT_NAMEPLATE_NEAR_DIST).toBe(2.3);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(44.965);
  });

  test("worldView aplica LOOT_NAMEPLATE_Y al sprite existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("sprite.position.set(0, LOOT_NAMEPLATE_Y, 0)");
  });

  test("scaleY 0.859625 (0.7475 × 1.15); X/fade/mid-scale/font/iconos sin cambio", () => {
    expect(LOOT_NAMEPLATE_MAX_CHARS).toBe(23);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(7.27375);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
    expect(LOOT_NAMEPLATE_Y).toBe(2.843375);
    expect(LOOT_NAMEPLATE_Y).toBeCloseTo(2.4725 * 1.15, 5);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(3.4385);
    expect(LOOT_NAMEPLATE_SCALE_X).toBeCloseTo(2.99 * 1.15, 5);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.859625);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBeCloseTo(0.7475 * 1.15, 5);
    expect(lootNameplateScale()).toBe(1);
  });

  test("worldView aplica LOOT_NAMEPLATE_SCALE_Y al sprite existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain(
      "sprite.scale.set(LOOT_NAMEPLATE_SCALE_X, LOOT_NAMEPLATE_SCALE_Y, 1)",
    );
    expect(src).toContain("LOOT_NAMEPLATE_SCALE_X * s");
    expect(src).toContain("LOOT_NAMEPLATE_SCALE_Y * s");
    expect(src).toContain('sprite.name = "lootNameplate"');
  });

  test("icon size 84.64 (73.6 × 1.15); pad 89.93 / scale / Y / fade / mid-scale sin cambio", () => {
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(89.93);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBeCloseTo(78.2 * 1.15, 5);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBeGreaterThanOrEqual(48);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(84.64);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBeCloseTo(73.6 * 1.15, 5);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBeGreaterThanOrEqual(48);
  });

  test("worldView aplica LOOT_NAMEPLATE_ICON_PAD al canvas existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("const ICON_PAD = LOOT_NAMEPLATE_ICON_PAD");
    expect(src).toContain("const W = hasIcon ? BASE_W + ICON_PAD : BASE_W");
    expect(src).toContain("const iconX = Math.max(0, (ICON_PAD - iconSize) / 2)");
  });

  test("worldView aplica LOOT_NAMEPLATE_ICON_SIZE al icono existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("const iconSize = LOOT_NAMEPLATE_ICON_SIZE");
    expect(src).toContain(
      "paintLootNameplateIcon(ctx, itemId, iconX, (H - iconSize) / 2, iconSize)",
    );
  });

  test("nameplate font 44.965px; canvas 384×80", () => {
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(44.965);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain(
      "ctx.font = `600 ${LOOT_NAMEPLATE_FONT_PX}px ui-monospace, SF Mono, Menlo, Consolas, monospace`",
    );
    expect(src).not.toMatch(/ctx\.font = "600 34px/);
    expect(src).not.toMatch(/ctx\.font = "600 28px/);
    expect(src).toMatch(/const BASE_W = 384;/);
    expect(src).toMatch(/const H = 80;/);
  });

  test("nameplate text stroke 5.95125; fill gold; dark outline", () => {
    expect(LOOT_NAMEPLATE_STROKE_PX).toBe(5.95125);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("ctx.lineWidth = LOOT_NAMEPLATE_STROKE_PX");
    expect(src).not.toMatch(/ctx\.lineWidth = 4\.5;/);
    expect(src).not.toMatch(/ctx\.lineWidth = 3;/);
    expect(src).toContain("ctx.strokeStyle = LOOT_NAMEPLATE_TEXT_STROKE");
    expect(src).toContain("ctx.fillStyle = LOOT_NAMEPLATE_FILL");
    expect(src).not.toMatch(/ctx\.fillStyle = "#f0c060"/);
  });
});

describe("lootNameplateLabel", () => {
  test("corto sin cambio", () => {
    expect(lootNameplateLabel("cocina")).toBe("cocina");
    expect(lootNameplateLabel("pila de madera")).toBe("pila de madera");
    expect(truncateLootLabel("cocina")).toBe("cocina");
  });

  test("pila de madera ×12 cabe en 23", () => {
    expect(lootNameplateLabel("pila de madera ×12")).toBe("pila de madera ×12");
    expect("pila de madera ×12".length).toBe(18);
  });

  test("exacto 23 sin cambio", () => {
    const s = "12345678901234567890123";
    expect(s.length).toBe(23);
    expect(lootNameplateLabel(s)).toBe(s);
    expect(truncateLootLabel(s)).toBe(s);
  });

  test("más de 23 → slice a 23", () => {
    expect(lootNameplateLabel("123456789012345678901234")).toBe(
      "12345678901234567890123",
    );
    expect(lootNameplateLabel("pila de madera extra extra")).toBe(
      "pila de madera extra ex",
    );
    expect(lootNameplateLabel("pila de madera extra extra").length).toBe(23);
  });

  test('vacío → ""', () => {
    expect(lootNameplateLabel("")).toBe("");
    expect(truncateLootLabel("")).toBe("");
  });
});

describe("lootNameplateOpacity", () => {
  test("1 en dist ≤ 2.3 (in-reach 1.6); 0 en fade 7.27375; 0 fuera", () => {
    expect(lootNameplateOpacity(0)).toBe(1);
    expect(lootNameplateOpacity(1.6)).toBe(1);
    expect(lootNameplateOpacity(2)).toBe(1);
    expect(lootNameplateOpacity(2.3)).toBe(1);
    expect(lootNameplateOpacity(5.5)).toBeGreaterThan(0);
    expect(lootNameplateOpacity(6.325)).toBeGreaterThan(0);
    expect(lootNameplateOpacity(7.27375)).toBe(0);
    expect(lootNameplateOpacity(7.27376)).toBe(0);
    expect(lootNameplateOpacity(8)).toBe(0);
    expect(lootNameplateOpacity(80)).toBe(0);
  });

  test("lerp lineal 1 → 0 de 2.3 a fade 7.27375", () => {
    const mid = (LOOT_NAMEPLATE_NEAR_DIST + LOOT_NAMEPLATE_FADE_DIST) / 2;
    expect(lootNameplateOpacity(mid)).toBeCloseTo(0.5, 10);
    const t = 0.25;
    const span = LOOT_NAMEPLATE_FADE_DIST - LOOT_NAMEPLATE_NEAR_DIST;
    expect(lootNameplateOpacity(LOOT_NAMEPLATE_NEAR_DIST + span * t)).toBeCloseTo(
      1 - t,
      10,
    );
  });

  test("NaN → 0", () => {
    expect(lootNameplateOpacity(Number.NaN)).toBe(0);
  });

  test("Infinity → 0", () => {
    expect(lootNameplateOpacity(Number.POSITIVE_INFINITY)).toBe(0);
    expect(lootNameplateOpacity(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  test("dist negativa se clampa a 0 → 1", () => {
    expect(lootNameplateOpacity(-0.4)).toBe(1);
  });
});

describe("lootNameplateScale", () => {
  test("1 en dist ≤ 2.3 (in-reach 1.6); 0.6348 en fade 7.27375 y más allá", () => {
    expect(lootNameplateScale(0)).toBe(1);
    expect(lootNameplateScale(1.6)).toBe(1);
    expect(lootNameplateScale(2)).toBe(1);
    expect(lootNameplateScale(2.3)).toBe(1);
    expect(lootNameplateScale(7.27375)).toBe(LOOT_NAMEPLATE_MID_SCALE);
    expect(lootNameplateScale(7.27376)).toBe(LOOT_NAMEPLATE_MID_SCALE);
    expect(lootNameplateScale(8)).toBe(LOOT_NAMEPLATE_MID_SCALE);
    expect(lootNameplateScale(80)).toBe(LOOT_NAMEPLATE_MID_SCALE);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.6348);
  });

  test("lerp lineal 1 → 0.6348 de 2.3 a fade 7.27375", () => {
    const mid = (LOOT_NAMEPLATE_NEAR_DIST + LOOT_NAMEPLATE_FADE_DIST) / 2;
    const expectedMid = 1 + (LOOT_NAMEPLATE_MID_SCALE - 1) * 0.5;
    expect(lootNameplateScale(mid)).toBeCloseTo(expectedMid, 10);
    const t = 0.25;
    const expected = 1 + (LOOT_NAMEPLATE_MID_SCALE - 1) * t;
    const span = LOOT_NAMEPLATE_FADE_DIST - LOOT_NAMEPLATE_NEAR_DIST;
    expect(lootNameplateScale(LOOT_NAMEPLATE_NEAR_DIST + span * t)).toBeCloseTo(
      expected,
      10,
    );
  });

  test("omitido / NaN / no finito → 1", () => {
    expect(lootNameplateScale()).toBe(1);
    expect(lootNameplateScale(Number.NaN)).toBe(1);
    expect(lootNameplateScale(Number.POSITIVE_INFINITY)).toBe(1);
    expect(lootNameplateScale(Number.NEGATIVE_INFINITY)).toBe(1);
  });

  test("dist negativa se clampa a full size → 1", () => {
    expect(lootNameplateScale(-0.4)).toBe(1);
  });
});

describe("lootNameplateVisible", () => {
  test("visible si opacity > 0; dist 1.6 full; dist 8+ hidden", () => {
    expect(lootNameplateVisible(false, 0)).toBe(true);
    expect(lootNameplateVisible(false, 1.6)).toBe(true);
    expect(lootNameplateVisible(false, 2)).toBe(true);
    expect(lootNameplateVisible(false, 2.3)).toBe(true);
    expect(lootNameplateVisible(false, 5.49)).toBe(true);
    expect(lootNameplateVisible(false, 5.5)).toBe(true);
    expect(lootNameplateVisible(false, 6.324)).toBe(true);
    expect(lootNameplateVisible(false, 6.325)).toBe(true);
    expect(lootNameplateVisible(false, 7.27374)).toBe(true);
    expect(lootNameplateVisible(false, 7.27375)).toBe(false);
    expect(lootNameplateVisible(false, 8)).toBe(false);
    expect(lootNameplateVisible(false, 11)).toBe(false);
  });

  test("empty → false; con loot → true", () => {
    expect(lootNameplateVisible(true, 0)).toBe(false);
    expect(lootNameplateVisible(false, 0)).toBe(true);
    expect(lootNameplateVisible(true, 5)).toBe(false);
  });

  test("NaN → false", () => {
    expect(lootNameplateVisible(false, Number.NaN)).toBe(false);
  });

  test("Infinity → false", () => {
    expect(lootNameplateVisible(false, Number.POSITIVE_INFINITY)).toBe(false);
  });

  test("dist negativa en fade → true", () => {
    expect(lootNameplateVisible(false, -0.4)).toBe(true);
    expect(lootNameplateVisible(true, -0.4)).toBe(false);
  });

  test("visible(empty(inv), dist) oculta pila vacía; drop de vuelta muestra", () => {
    const emptyInv = { slots: [] as { id: string; qty: number }[] };
    const qty0 = { slots: [{ id: "wood", qty: 0 }] };
    const full = { slots: [{ id: "wood", qty: 1 }] };
    expect(lootNameplateVisible(lootNameplateInvEmpty(emptyInv), 0)).toBe(
      false,
    );
    expect(lootNameplateVisible(lootNameplateInvEmpty(qty0), 0)).toBe(false);
    expect(lootNameplateVisible(lootNameplateInvEmpty(full), 0)).toBe(true);
    expect(lootNameplateVisible(lootNameplateInvEmpty(full), 8)).toBe(false);
  });
});

describe("lootNameplateVisible (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte oculta nameplate; ya oculto no-op; load-muerto hidden; vivo/load-vivo pinta", () => {
    expect(lootNameplateVisible(false, 0, true)).toBe(false);
    expect(lootNameplateVisible(false, 2.3, true)).toBe(false);

    const alreadyHidden = lootNameplateVisible(true, 0, true);
    expect(alreadyHidden).toBe(false);
    expect(lootNameplateVisible(false, 8, true)).toBe(false);
    expect(lootNameplateVisible(false, Number.NaN, true)).toBe(false);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(lootNameplateVisible(false, 0, deadRt.gameOver)).toBe(false);
    expect(lootNameplateVisible(true, 0, deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(lootNameplateVisible(false, 0, liveRt.gameOver)).toBe(true);
    expect(lootNameplateVisible(false, 2.3, liveRt.gameOver)).toBe(true);
    expect(lootNameplateVisible(true, 0, liveRt.gameOver)).toBe(false);
    expect(lootNameplateVisible(false, 8, liveRt.gameOver)).toBe(false);

    expect(lootNameplateVisible(false, 0)).toBe(true);
    expect(lootNameplateVisible(false, 0, false)).toBe(true);
    expect(lootNameplateVisible(true, 0)).toBe(false);
  });

  test("Game / worldView cablean lootNameplateVisible(gameOver); freeze y F9 load-muerto siguen sync", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toMatch(
      /syncInteractFocus\(dt = 0\): void \{[\s\S]{0,400}this\.view\.syncLootFocus\([\s\S]{0,200}this\.gameOver/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,720}this\.syncInteractFocus\(\)/,
    );
    expect(gameSrc).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,900}if \(this\.gameOver\) this\.syncInteractFocus\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2200}this\.syncInteractFocus\(dt\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );

    const viewSrc = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(viewSrc).toContain(
      "e.nameplate.visible = lootNameplateVisibleFromLook(empty, d, gameOver)",
    );
    expect(viewSrc).toMatch(
      /syncLootFocus\(wx, wy, dt, emptyIds, gameOver = false\) \{[\s\S]{0,400}applyLootNameplateLook\(wx, wy, emptyIds, gameOver\)/,
    );
    expect(viewSrc).toMatch(
      /function applyLootNameplateLook\([\s\S]{0,500}lootNameplateVisibleFromLook\(empty, d, gameOver\)/,
    );
  });
});

describe("lootNameplateInvEmpty", () => {
  test("null / undefined / slots vacíos → true", () => {
    expect(lootNameplateInvEmpty(null)).toBe(true);
    expect(lootNameplateInvEmpty(undefined)).toBe(true);
    expect(lootNameplateInvEmpty({ slots: [] })).toBe(true);
  });

  test("todos qty 0 → true", () => {
    expect(lootNameplateInvEmpty({ slots: [{ id: "wood", qty: 0 }] })).toBe(
      true,
    );
    expect(
      lootNameplateInvEmpty({
        slots: [
          { id: "wood", qty: 0 },
          { id: "ammo", qty: 0 },
        ],
      }),
    ).toBe(true);
  });

  test("algún qty > 0 → false", () => {
    expect(lootNameplateInvEmpty({ slots: [{ id: "wood", qty: 1 }] })).toBe(
      false,
    );
    expect(
      lootNameplateInvEmpty({
        slots: [
          { id: "wood", qty: 0 },
          { id: "ammo", qty: 2 },
        ],
      }),
    ).toBe(false);
  });

  test("agujeros null / undefined no cuentan", () => {
    expect(lootNameplateInvEmpty({ slots: [null, undefined] })).toBe(true);
    expect(
      lootNameplateInvEmpty({
        slots: [null, { id: "wood", qty: 3 }],
      }),
    ).toBe(false);
  });
});

describe("lootNameplateLeadId", () => {
  test("vacío / qty 0 → null", () => {
    expect(lootNameplateLeadId(null)).toBeNull();
    expect(lootNameplateLeadId(undefined)).toBeNull();
    expect(lootNameplateLeadId({ slots: [] })).toBeNull();
    expect(lootNameplateLeadId({ slots: [{ id: "wood", qty: 0 }] })).toBeNull();
  });

  test("water_bottle primero", () => {
    expect(
      lootNameplateLeadId({
        slots: [{ id: "water_bottle", qty: 1 }, { id: "wood", qty: 2 }],
      }),
    ).toBe("water_bottle");
  });

  test("salta agujero vacío y toma wood", () => {
    expect(
      lootNameplateLeadId({
        slots: [
          { id: "cloth", qty: 0 },
          { id: "wood", qty: 3 },
        ],
      }),
    ).toBe("wood");
  });
});

describe("lootNameplateIconKind", () => {
  test("mapea ids conocidos; knife/cloth/unknown → diamond", () => {
    expect(lootNameplateIconKind("water_bottle")).toBe("bottle");
    expect(lootNameplateIconKind("empty_bottle")).toBe("bottle");
    expect(lootNameplateIconKind("canned_food")).toBe("can");
    expect(lootNameplateIconKind("wood")).toBe("wood");
    expect(lootNameplateIconKind("ammo")).toBe("ammo");
    expect(lootNameplateIconKind("pistol")).toBe("pistol");
    expect(lootNameplateIconKind("flashlight")).toBe("flashlight");
    expect(lootNameplateIconKind("knife")).toBe("diamond");
    expect(lootNameplateIconKind("cloth")).toBe("diamond");
    expect(lootNameplateIconKind("unknown")).toBe("diamond");
  });
});

function mockNameplateCtx(): CanvasRenderingContext2D {
  const noop = () => {};
  return {
    save: noop,
    restore: noop,
    translate: noop,
    scale: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    rect: noop,
    fill: noop,
    stroke: noop,
    fillRect: noop,
    strokeRect: noop,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineJoin: "round",
    lineCap: "round",
  } as unknown as CanvasRenderingContext2D;
}

describe("paintLootNameplateIcon", () => {
  test("no tira con ids conocidos, unknown y ctx mínimo", () => {
    const ctx = mockNameplateCtx();
    expect(() => paintLootNameplateIcon(ctx, "water_bottle", 0, 0, 32)).not.toThrow();
    expect(() => paintLootNameplateIcon(ctx, "canned_food", 0, 0, 22)).not.toThrow();
    expect(() => paintLootNameplateIcon(ctx, "wood", 8, 8, 16)).not.toThrow();
    expect(() => paintLootNameplateIcon(ctx, "ammo", 0, 0, 32)).not.toThrow();
    expect(() => paintLootNameplateIcon(ctx, "pistol", 0, 0, 32)).not.toThrow();
    expect(() => paintLootNameplateIcon(ctx, "flashlight", 0, 0, 32)).not.toThrow();
    expect(() => paintLootNameplateIcon(ctx, "knife", 0, 0, 32)).not.toThrow();
    expect(() => paintLootNameplateIcon(ctx, "unknown", 0, 0, 32)).not.toThrow();
    expect(() => paintLootNameplateIcon(ctx, "", 0, 0, 0)).not.toThrow();
  });
});

describe("lootNameplateAfterRestart (R / softReset)", () => {
  test("look fresco (spawn 24.5, 15.5); leftover ctor dist 0 / Three opacity 1 / origin / far no filtra", () => {
    const barrio = createNeighborhood(48);
    const wood = barrio.containers.list.find((c) => c.id === "madera-spawn");
    expect(wood).toBeTruthy();
    const woodMx = wood!.x + 0.5;
    const woodMy = wood!.y + 0.5;
    const bootWx = lootNameplateLookXAfterRestart();
    const bootWy = lootNameplateLookZAfterRestart();
    const bootDist = lootNameplateDistAfterRestart(woodMx, woodMy);
    const bootOp = lootNameplateOpacityAfterRestart(bootDist);
    const bootVis = lootNameplateVisibleAfterRestart(false, bootDist);
    const bootScale = lootNameplateScaleAfterRestart(bootDist);

    expect(bootWx).toBe(lootNameplateLookXFromLook(24.5));
    expect(bootWy).toBe(lootNameplateLookZFromLook(15.5));
    expect(bootWx).toBe(LOOT_NAMEPLATE_LOOK_X_SPAWN);
    expect(bootWy).toBe(LOOT_NAMEPLATE_LOOK_Z_SPAWN);
    expect(bootWx).toBe(barrio.spawn.x);
    expect(bootWy).toBe(barrio.spawn.y);
    expect(lootNameplateLookXAfterRestart(24.5)).toBe(bootWx);
    expect(lootNameplateLookZAfterRestart(15.5)).toBe(bootWy);
    expect(lootNameplateLookXAfterRestart(0)).toBe(lootNameplateLookXFromLook(0));
    expect(lootNameplateLookZAfterRestart(40)).toBe(lootNameplateLookZFromLook(40));

    expect(bootDist).toBe(1);
    expect(bootDist).toBe(lootNameplateDistFromLook(24.5, 15.5, woodMx, woodMy));
    expect(bootOp).toBe(1);
    expect(bootOp).toBe(lootNameplateOpacityFromLook(bootDist));
    expect(bootVis).toBe(true);
    expect(bootVis).toBe(lootNameplateVisibleFromLook(false, bootDist));
    expect(bootScale).toBe(1);
    expect(bootScale).toBe(lootNameplateScaleFromLook(bootDist));

    const leftoverCtorDist = 0;
    const leftoverCtorOp = 1;
    const leftoverCtorVis = lootNameplateVisible(false, 0);
    const leftoverCtorScale = lootNameplateScale(0);
    expect(leftoverCtorDist).not.toBe(bootDist);
    expect(leftoverCtorOp).toBe(1);
    expect(leftoverCtorVis).toBe(true);
    expect(leftoverCtorScale).toBe(1);

    const far = barrio.containers.list.find((c) => c.id !== "madera-spawn");
    expect(far).toBeTruthy();
    const farDist = lootNameplateDistAfterRestart(far!.x + 0.5, far!.y + 0.5);
    expect(farDist).toBeGreaterThan(LOOT_NAMEPLATE_FADE_DIST);
    expect(lootNameplateOpacityAfterRestart(farDist)).toBe(0);
    expect(lootNameplateVisibleAfterRestart(false, farDist)).toBe(false);
    expect(lootNameplateScaleAfterRestart(farDist)).toBe(LOOT_NAMEPLATE_MID_SCALE);
    expect(leftoverCtorOp).not.toBe(lootNameplateOpacityAfterRestart(farDist));
    expect(leftoverCtorVis).not.toBe(
      lootNameplateVisibleAfterRestart(false, farDist),
    );
    expect(leftoverCtorScale).not.toBe(lootNameplateScaleAfterRestart(farDist));
    expect(leftoverCtorDist).not.toBe(farDist);

    const leftoverOriginDist = lootNameplateDistFromLook(0, 0, woodMx, woodMy);
    expect(leftoverOriginDist).not.toBe(bootDist);
    expect(lootNameplateLookXFromLook(0)).toBe(0);
    expect(lootNameplateLookXFromLook(0)).not.toBe(bootWx);
    expect(lootNameplateOpacityFromLook(leftoverOriginDist)).toBe(0);
    expect(lootNameplateVisibleFromLook(false, leftoverOriginDist)).toBe(false);
    expect(lootNameplateOpacityFromLook(leftoverOriginDist)).not.toBe(bootOp);

    const leftoverFarDist = lootNameplateDistFromLook(40, 30, woodMx, woodMy);
    expect(leftoverFarDist).not.toBe(bootDist);
    expect(lootNameplateLookXFromLook(40)).toBe(40);
    expect(lootNameplateLookZFromLook(30)).toBe(30);
    expect(lootNameplateLookXFromLook(40)).not.toBe(bootWx);
    expect(lootNameplateLookZFromLook(30)).not.toBe(bootWy);
    expect(lootNameplateOpacityFromLook(leftoverFarDist)).toBe(0);
    expect(lootNameplateVisibleFromLook(false, leftoverFarDist)).toBe(false);
    expect(lootNameplateOpacityFromLook(leftoverFarDist)).not.toBe(bootOp);
    expect(leftoverFarDist).not.toBe(
      lootNameplateDistAfterRestart(woodMx, woodMy),
    );

    expect(lootNameplateDistFromLook(24.5, 15.5, woodMx, woodMy)).toBe(bootDist);
    expect(lootNameplateOpacityFromLook(bootDist)).toBe(bootOp);
    expect(lootNameplateVisibleFromLook(true, bootDist)).toBe(false);
    expect(lootNameplateVisibleAfterRestart(false, bootDist, true)).toBe(false);
    expect(lootNameplateOpacityAfterRestart(bootDist)).toBe(bootOp);
  });

  test("vivo tick no usa el helper (fade avanza con look)", () => {
    const barrio = createNeighborhood(48);
    const wood = barrio.containers.list.find((c) => c.id === "madera-spawn")!;
    const woodMx = wood.x + 0.5;
    const woodMy = wood.y + 0.5;
    const bootDist = lootNameplateDistAfterRestart(woodMx, woodMy);
    const bootOp = lootNameplateOpacityAfterRestart(bootDist);
    const liveLookX = lootNameplateLookXFromLook(40);
    const liveLookZ = lootNameplateLookZFromLook(30);
    const liveDist = lootNameplateDistFromLook(40, 30, woodMx, woodMy);
    expect(liveLookX).toBe(40);
    expect(liveLookZ).toBe(30);
    expect(liveLookX).not.toBe(lootNameplateLookXAfterRestart());
    expect(liveLookZ).not.toBe(lootNameplateLookZAfterRestart());
    expect(liveDist).not.toBe(bootDist);
    expect(liveDist).not.toBe(lootNameplateDistAfterRestart(woodMx, woodMy));
    expect(lootNameplateOpacityFromLook(liveDist)).toBe(0);
    expect(lootNameplateOpacityFromLook(liveDist)).not.toBe(bootOp);
    expect(lootNameplateVisibleFromLook(false, liveDist)).toBe(false);
    expect(lootNameplateScaleFromLook(liveDist)).toBe(LOOT_NAMEPLATE_MID_SCALE);
    expect(lootNameplateLookXFromLook(24.5)).toBe(lootNameplateLookXAfterRestart());
    expect(lootNameplateLookZFromLook(15.5)).toBe(lootNameplateLookZAfterRestart());
    expect(lootNameplateOpacityFromLook(bootDist)).toBe(bootOp);
  });
});

describe("loot nameplate recreate lock (R / softReset)", () => {
  test("Game softReset dispose nace nameplate fresco; F9 no helper", () => {
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
    const plateSrc = readFileSync(
      resolve(process.cwd(), "src/render/lootNameplate.ts"),
      "utf8",
    );
    expect(plateSrc).toContain("lootNameplateLookXAfterRestart(");
    expect(plateSrc).toContain("lootNameplateLookZAfterRestart(");
    expect(plateSrc).toContain("lootNameplateLookXFromLook(");
    expect(plateSrc).toContain("lootNameplateLookZFromLook(");
    expect(plateSrc).toContain("lootNameplateDistAfterRestart(");
    expect(plateSrc).toContain("lootNameplateDistFromLook(");
    expect(plateSrc).toContain("lootNameplateOpacityAfterRestart(");
    expect(plateSrc).toContain("lootNameplateOpacityFromLook(");
    expect(plateSrc).toContain("lootNameplateVisibleAfterRestart(");
    expect(plateSrc).toContain("lootNameplateVisibleFromLook(");
    expect(plateSrc).toContain("lootNameplateScaleAfterRestart(");
    expect(plateSrc).toContain("lootNameplateScaleFromLook(");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_LOOK_X_SPAWN");
    expect(plateSrc).toContain("LOOT_NAMEPLATE_LOOK_Z_SPAWN");
    expect(plateSrc).toMatch(
      /lootNameplateLookXAfterRestart\([\s\S]{0,200}lootNameplateLookXFromLook\(/,
    );
    expect(plateSrc).toMatch(
      /lootNameplateLookZAfterRestart\([\s\S]{0,200}lootNameplateLookZFromLook\(/,
    );
    expect(plateSrc).toMatch(
      /lootNameplateOpacityAfterRestart\([\s\S]{0,200}lootNameplateOpacityFromLook\(/,
    );
    expect(plateSrc).toMatch(
      /lootNameplateVisibleAfterRestart\([\s\S]{0,200}lootNameplateVisibleFromLook\(/,
    );
    expect(viewSrc).toContain("lootNameplateLookXAfterRestart(");
    expect(viewSrc).toContain("lootNameplateLookZAfterRestart(");
    expect(viewSrc).toContain("lootNameplateDistFromLook(");
    expect(viewSrc).toContain("lootNameplateOpacityFromLook(");
    expect(viewSrc).toContain("lootNameplateVisibleFromLook(");
    expect(viewSrc).toContain("lootNameplateScaleFromLook(");
    expect(viewSrc).toMatch(
      /applyLootNameplateLook\(\s*lootNameplateLookXAfterRestart\(\),\s*lootNameplateLookZAfterRestart\(\),\s*emptyIds/,
    );
    expect(viewSrc).toMatch(
      /const d = lootNameplateDistFromLook\(\s*wx,\s*wy,\s*e\.x,\s*e\.y\)/,
    );
    expect(viewSrc).toMatch(
      /e\.nameplate\.visible = lootNameplateVisibleFromLook\(\s*empty,\s*d,\s*gameOver\)/,
    );
    expect(viewSrc).toContain("applyLootNameplateLook(");
    expect(viewSrc).toMatch(
      /nameplate\.visible = lootNameplateVisible\(empty, 0\)/,
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
    expect(gameSrc).toMatch(
      /syncInteractFocus\(dt = 0\): void \{[\s\S]{0,400}this\.view\.syncLootFocus\(/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3800}this\.syncInteractFocus\(dt\)/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}lootNameplateLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}lootNameplateLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}lootNameplateLookXAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}lootNameplateLookXAfterRestart/,
    );
    expect(gameSrc).not.toContain("lootNameplateLookXAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateLookZAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateDistAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateOpacityAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateVisibleAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateScaleAfterRestart(");
    expect(gameSrc).not.toContain("lootNameplateLookXFromLook(");
    expect(saveSrc).not.toContain("lootNameplateLookXAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateOpacityAfterRestart");
    expect(saveSrc).not.toContain("lootNameplateLookXFromLook");
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
