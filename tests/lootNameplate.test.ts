import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  LOOT_NAMEPLATE_FADE_DIST,
  LOOT_NAMEPLATE_FILL,
  LOOT_NAMEPLATE_GOLD_FILL,
  LOOT_NAMEPLATE_FONT_PX,
  LOOT_NAMEPLATE_ICON_PAD,
  LOOT_NAMEPLATE_ICON_SIZE,
  LOOT_NAMEPLATE_MAX_CHARS,
  LOOT_NAMEPLATE_MID_SCALE,
  LOOT_NAMEPLATE_SCALE_X,
  LOOT_NAMEPLATE_SCALE_Y,
  LOOT_NAMEPLATE_STROKE_PX,
  LOOT_NAMEPLATE_Y,
  lootNameplateIconKind,
  lootNameplateInvEmpty,
  lootNameplateLabel,
  lootNameplateLeadId,
  lootNameplateOpacity,
  lootNameplateScale,
  lootNameplateVisible,
  paintLootNameplateIcon,
  truncateLootLabel,
} from "../src/render/lootNameplate";

describe("constantes", () => {
  test("GOLD_FILL opacity 0.368 (0.32 × 1.15); fill/stroke/font/fade/mid-scale/icon/pad/scale/Y sin cambio", () => {
    expect(LOOT_NAMEPLATE_GOLD_FILL).toBe("rgba(232,195,106,0.368)");
    expect(LOOT_NAMEPLATE_GOLD_FILL).toMatch(/rgba\(232,\s*195,\s*106,\s*0\.368\)/);
    const opacity = Number(LOOT_NAMEPLATE_GOLD_FILL.match(/[\d.]+(?=\)$)/)?.[0]);
    expect(opacity).toBe(0.368);
    expect(opacity).toBeCloseTo(0.32 * 1.15, 5);
    expect(LOOT_NAMEPLATE_FILL).toBe("#ffdd6e");
    expect(LOOT_NAMEPLATE_STROKE_PX).toBe(5.175);
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(39.1);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(6.325);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.552);
    expect(LOOT_NAMEPLATE_Y).toBe(2.4725);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(2.99);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.7475);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(73.6);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(78.2);
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
    expect(ctx.fillStyle).toBe("rgba(232,195,106,0.368)");
  });

  test("fill #ffdd6e (#f0c060 ×1.15); stroke/font/fade/mid-scale/iconos/scale/Y/teclas sin cambio", () => {
    expect(LOOT_NAMEPLATE_FILL).toBe("#ffdd6e");
    expect(LOOT_NAMEPLATE_STROKE_PX).toBe(5.175);
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(39.1);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(6.325);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.552);
    expect(LOOT_NAMEPLATE_Y).toBe(2.4725);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(2.99);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.7475);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(73.6);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(78.2);
  });

  test("worldView aplica LOOT_NAMEPLATE_FILL al canvas existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("ctx.fillStyle = LOOT_NAMEPLATE_FILL");
    expect(src).not.toMatch(/ctx\.fillStyle = "#f0c060"/);
    expect(src).toMatch(/ctx\.strokeStyle = "rgba\(0,0,0,0\.7\)"/);
    expect(src).toContain("ctx.lineWidth = LOOT_NAMEPLATE_STROKE_PX");
  });

  test("stroke 5.175 (4.5 × 1.15); font/fade/mid-scale/iconos/scale/Y/teclas sin cambio", () => {
    expect(LOOT_NAMEPLATE_STROKE_PX).toBe(5.175);
    expect(LOOT_NAMEPLATE_STROKE_PX).toBeCloseTo(4.5 * 1.15, 5);
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(39.1);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(6.325);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.552);
    expect(LOOT_NAMEPLATE_Y).toBe(2.4725);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(2.99);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.7475);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(73.6);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(78.2);
  });

  test("worldView aplica LOOT_NAMEPLATE_STROKE_PX al canvas existente", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("ctx.lineWidth = LOOT_NAMEPLATE_STROKE_PX");
    expect(src).not.toMatch(/ctx\.lineWidth = 4\.5;/);
    expect(src).not.toMatch(/ctx\.lineWidth = 3;/);
    expect(src).toMatch(/ctx\.strokeStyle = "rgba\(0,0,0,0\.7\)"/);
    expect(src).toContain("ctx.fillStyle = LOOT_NAMEPLATE_FILL");
  });

  test("font 39.1 (34 × 1.15); fade/mid-scale/iconos/scale/Y/teclas sin cambio", () => {
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(39.1);
    expect(LOOT_NAMEPLATE_FONT_PX).toBeCloseTo(34 * 1.15, 5);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(6.325);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.552);
    expect(LOOT_NAMEPLATE_Y).toBe(2.4725);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(2.99);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.7475);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(73.6);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(78.2);
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

  test("mid-scale 0.552 (0.48 × 1.15); fade/Y/iconos/scale/font/teclas sin cambio", () => {
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.552);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBeCloseTo(0.48 * 1.15, 5);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(6.325);
    expect(LOOT_NAMEPLATE_Y).toBe(2.4725);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(2.99);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.7475);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(73.6);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(78.2);
    expect(lootNameplateScale(LOOT_NAMEPLATE_FADE_DIST)).toBe(
      LOOT_NAMEPLATE_MID_SCALE,
    );
    expect(lootNameplateScale(LOOT_NAMEPLATE_FADE_DIST)).toBe(0.552);
  });

  test("fade dist 6.325 (5.5 × 1.15); iconos/scale/Y/mid-scale/font/teclas sin cambio", () => {
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(6.325);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBeCloseTo(5.5 * 1.15, 5);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.552);
    expect(LOOT_NAMEPLATE_Y).toBe(2.4725);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(2.99);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.7475);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(73.6);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(78.2);
    expect(lootNameplateOpacity(LOOT_NAMEPLATE_FADE_DIST)).toBe(0);
    expect(lootNameplateScale(LOOT_NAMEPLATE_FADE_DIST)).toBe(
      LOOT_NAMEPLATE_MID_SCALE,
    );
  });

  test("scaleY 0.7475 (0.65 × 1.15); X/fade/mid-scale/font/iconos sin cambio", () => {
    expect(LOOT_NAMEPLATE_MAX_CHARS).toBe(20);
    expect(LOOT_NAMEPLATE_FADE_DIST).toBe(6.325);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.552);
    expect(LOOT_NAMEPLATE_Y).toBe(2.4725);
    expect(LOOT_NAMEPLATE_Y).toBeCloseTo(2.15 * 1.15, 5);
    expect(LOOT_NAMEPLATE_SCALE_X).toBe(2.99);
    expect(LOOT_NAMEPLATE_SCALE_X).toBeCloseTo(2.6 * 1.15, 5);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBe(0.7475);
    expect(LOOT_NAMEPLATE_SCALE_Y).toBeCloseTo(0.65 * 1.15, 5);
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

  test("icon pad 78.2 (68 × 1.15); size 73.6 / scale / Y / fade / mid-scale sin cambio", () => {
    expect(LOOT_NAMEPLATE_ICON_PAD).toBe(78.2);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBeCloseTo(68 * 1.15, 5);
    expect(LOOT_NAMEPLATE_ICON_PAD).toBeGreaterThanOrEqual(48);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBe(73.6);
    expect(LOOT_NAMEPLATE_ICON_SIZE).toBeCloseTo(64 * 1.15, 5);
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

  test("nameplate font 39.1px; canvas 384×80", () => {
    expect(LOOT_NAMEPLATE_FONT_PX).toBe(39.1);
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

  test("nameplate text stroke 5.175; fill gold; dark outline", () => {
    expect(LOOT_NAMEPLATE_STROKE_PX).toBe(5.175);
    const src = readFileSync(
      resolve(process.cwd(), "src/render/worldView.ts"),
      "utf8",
    );
    expect(src).toContain("ctx.lineWidth = LOOT_NAMEPLATE_STROKE_PX");
    expect(src).not.toMatch(/ctx\.lineWidth = 4\.5;/);
    expect(src).not.toMatch(/ctx\.lineWidth = 3;/);
    expect(src).toMatch(/ctx\.strokeStyle = "rgba\(0,0,0,0\.7\)"/);
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

  test("pila de madera ×12 cabe en 20", () => {
    expect(lootNameplateLabel("pila de madera ×12")).toBe("pila de madera ×12");
    expect("pila de madera ×12".length).toBe(18);
  });

  test("exacto 20 sin cambio", () => {
    const s = "12345678901234567890";
    expect(s.length).toBe(20);
    expect(lootNameplateLabel(s)).toBe(s);
    expect(truncateLootLabel(s)).toBe(s);
  });

  test("más de 20 → slice a 20", () => {
    expect(lootNameplateLabel("123456789012345678901")).toBe(
      "12345678901234567890",
    );
    expect(lootNameplateLabel("pila de madera extra!")).toBe(
      "pila de madera extra",
    );
    expect(lootNameplateLabel("pila de madera extra!").length).toBe(20);
  });

  test('vacío → ""', () => {
    expect(lootNameplateLabel("")).toBe("");
    expect(truncateLootLabel("")).toBe("");
  });
});

describe("lootNameplateOpacity", () => {
  test("1 en dist ≤ 2 (in-reach 1.6); 0 en fade 6.325; 0 fuera", () => {
    expect(lootNameplateOpacity(0)).toBe(1);
    expect(lootNameplateOpacity(1.6)).toBe(1);
    expect(lootNameplateOpacity(2)).toBe(1);
    expect(lootNameplateOpacity(5.5)).toBeGreaterThan(0);
    expect(lootNameplateOpacity(6.325)).toBe(0);
    expect(lootNameplateOpacity(6.326)).toBe(0);
    expect(lootNameplateOpacity(6.5)).toBe(0);
    expect(lootNameplateOpacity(8)).toBe(0);
    expect(lootNameplateOpacity(80)).toBe(0);
  });

  test("lerp lineal 1 → 0 de 2 a fade 6.325", () => {
    const mid = (2 + LOOT_NAMEPLATE_FADE_DIST) / 2;
    expect(lootNameplateOpacity(mid)).toBeCloseTo(0.5, 10);
    const t = 0.25;
    const span = LOOT_NAMEPLATE_FADE_DIST - 2;
    expect(lootNameplateOpacity(2 + span * t)).toBeCloseTo(1 - t, 10);
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
  test("1 en dist ≤ 2 (in-reach 1.6); 0.552 en fade 6.325 y más allá", () => {
    expect(lootNameplateScale(0)).toBe(1);
    expect(lootNameplateScale(1.6)).toBe(1);
    expect(lootNameplateScale(2)).toBe(1);
    expect(lootNameplateScale(6.325)).toBe(LOOT_NAMEPLATE_MID_SCALE);
    expect(lootNameplateScale(6.326)).toBe(LOOT_NAMEPLATE_MID_SCALE);
    expect(lootNameplateScale(6.5)).toBe(LOOT_NAMEPLATE_MID_SCALE);
    expect(lootNameplateScale(8)).toBe(LOOT_NAMEPLATE_MID_SCALE);
    expect(lootNameplateScale(80)).toBe(LOOT_NAMEPLATE_MID_SCALE);
    expect(LOOT_NAMEPLATE_MID_SCALE).toBe(0.552);
  });

  test("lerp lineal 1 → 0.552 de 2 a fade 6.325", () => {
    const mid = (2 + LOOT_NAMEPLATE_FADE_DIST) / 2;
    const expectedMid = 1 + (LOOT_NAMEPLATE_MID_SCALE - 1) * 0.5;
    expect(lootNameplateScale(mid)).toBeCloseTo(expectedMid, 10);
    const t = 0.25;
    const expected = 1 + (LOOT_NAMEPLATE_MID_SCALE - 1) * t;
    const span = LOOT_NAMEPLATE_FADE_DIST - 2;
    expect(lootNameplateScale(2 + span * t)).toBeCloseTo(expected, 10);
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
    expect(lootNameplateVisible(false, 5.49)).toBe(true);
    expect(lootNameplateVisible(false, 5.5)).toBe(true);
    expect(lootNameplateVisible(false, 6.324)).toBe(true);
    expect(lootNameplateVisible(false, 6.325)).toBe(false);
    expect(lootNameplateVisible(false, 6.5)).toBe(false);
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
