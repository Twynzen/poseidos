import { describe, expect, test } from "vitest";
import {
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Texture,
} from "three";
import { SURVIVOR_BODY_COLOR, SURVIVOR_MAP_TINT } from "../src/render/survivorLook";
import {
  POSSESSED_BODY_COLOR,
  POSSESSED_MAP_TINT,
} from "../src/render/possessedLook";
import {
  MUTE_ACCENT,
  MUTE_ACCENT_COLOR,
  MUTE_ACCENT_EMISSIVE,
  MUTE_ACCENT_EMISSIVE_INTENSITY,
  MUTE_ACCENT_ROUGHNESS,
  MUTE_BODY_COLOR,
  MUTE_BODY_EMISSIVE,
  MUTE_BODY_EMISSIVE_INTENSITY,
  MUTE_BODY_ROUGHNESS,
  MUTE_CRUSHED_BODY,
  MUTE_MAP_TINT,
  applyMuteLook,
  isMuteAccentName,
} from "../src/render/muteLook";

function rgb(hex: number): { r: number; g: number; b: number } {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff,
  };
}

function assertSickGreenGray(hex: number, maxChannel = 0x90): void {
  const c = rgb(hex);
  expect(c.g).toBeGreaterThanOrEqual(c.r);
  expect(c.g).toBeGreaterThanOrEqual(c.b);
  expect(c.r).toBeLessThan(maxChannel);
  expect(c.b).toBeLessThan(maxChannel);
}

describe("muteLook constants", () => {
  test("split knobs: fill levantado, map tint, crushed lock, emisivos", () => {
    expect(MUTE_BODY_COLOR).toBe(0x647262);
    expect(MUTE_MAP_TINT).toBe(0xa8b8a4);
    expect(MUTE_BODY_EMISSIVE).toBe(0x1c2319);
    expect(MUTE_ACCENT).toBe(0x6b7a68);
    expect(MUTE_ACCENT_COLOR).toBe(MUTE_ACCENT);
    expect(MUTE_ACCENT_EMISSIVE).toBe(0x1a2218);
    expect(MUTE_CRUSHED_BODY).toBe(0x4a5648);
    expect(MUTE_BODY_COLOR).not.toBe(MUTE_CRUSHED_BODY);
    expect(MUTE_MAP_TINT).not.toBe(MUTE_CRUSHED_BODY);

    assertSickGreenGray(MUTE_BODY_COLOR, 0x70);
    assertSickGreenGray(MUTE_MAP_TINT, 0xc0);
    assertSickGreenGray(MUTE_BODY_EMISSIVE, 0x40);
    assertSickGreenGray(MUTE_ACCENT, 0x90);
    assertSickGreenGray(MUTE_ACCENT_EMISSIVE, 0x40);

    expect(MUTE_BODY_ROUGHNESS).toBe(0.7656);
    expect(MUTE_BODY_ROUGHNESS).toBeCloseTo(0.88 * 0.87, 10);
    expect(MUTE_BODY_ROUGHNESS).toBeGreaterThan(0.7);
    expect(MUTE_ACCENT_ROUGHNESS).toBe(0.435);
    expect(MUTE_ACCENT_ROUGHNESS).toBeCloseTo(0.5 * 0.87, 10);
    expect(MUTE_ACCENT_ROUGHNESS).toBeLessThan(MUTE_BODY_ROUGHNESS);
    expect(MUTE_BODY_EMISSIVE_INTENSITY).toBe(1.15);
    expect(MUTE_BODY_EMISSIVE_INTENSITY).toBeCloseTo(1 * 1.15, 10);
    expect(MUTE_ACCENT_EMISSIVE_INTENSITY).toBe(0.4025);
    expect(MUTE_ACCENT_EMISSIVE_INTENSITY).toBeCloseTo(0.35 * 1.15, 10);
    expect(MUTE_ACCENT_EMISSIVE_INTENSITY).toBeGreaterThan(0.2);
    expect(MUTE_ACCENT_EMISSIVE_INTENSITY).toBeLessThan(0.6);

    const crushG = (MUTE_CRUSHED_BODY >> 8) & 0xff;
    const bodyG = (MUTE_BODY_COLOR >> 8) & 0xff;
    expect(bodyG).toBeGreaterThan(crushG);
  });

  test("body emissive intensity 1 × 1.15; color/looks iguales", () => {
    expect(MUTE_BODY_EMISSIVE_INTENSITY).toBe(1.15);
    expect(MUTE_BODY_EMISSIVE_INTENSITY).toBeCloseTo(1 * 1.15, 10);
    expect(MUTE_ACCENT_EMISSIVE_INTENSITY).toBe(0.4025);
    expect(MUTE_ACCENT_EMISSIVE).toBe(0x1a2218);
    expect(MUTE_BODY_EMISSIVE).toBe(0x1c2319);
    expect(MUTE_BODY_COLOR).toBe(0x647262);
    expect(MUTE_MAP_TINT).toBe(0xa8b8a4);
    expect(MUTE_ACCENT).toBe(0x6b7a68);
    expect(MUTE_BODY_ROUGHNESS).toBe(0.7656);
    expect(MUTE_ACCENT_ROUGHNESS).toBe(0.435);
    expect(MUTE_CRUSHED_BODY).toBe(0x4a5648);
  });

  test("accent emissive intensity 0.35 × 1.15; color/looks iguales", () => {
    expect(MUTE_ACCENT_EMISSIVE_INTENSITY).toBe(0.4025);
    expect(MUTE_ACCENT_EMISSIVE_INTENSITY).toBeCloseTo(0.35 * 1.15, 10);
    expect(MUTE_ACCENT_EMISSIVE).toBe(0x1a2218);
    expect(MUTE_BODY_EMISSIVE).toBe(0x1c2319);
    expect(MUTE_BODY_COLOR).toBe(0x647262);
    expect(MUTE_MAP_TINT).toBe(0xa8b8a4);
    expect(MUTE_ACCENT).toBe(0x6b7a68);
    expect(MUTE_CRUSHED_BODY).toBe(0x4a5648);
  });

  test("body roughness 0.88 × 0.87; color/looks/teclas iguales", () => {
    expect(MUTE_BODY_ROUGHNESS).toBe(0.7656);
    expect(MUTE_BODY_ROUGHNESS).toBeCloseTo(0.88 * 0.87, 10);
    expect(MUTE_ACCENT_ROUGHNESS).toBe(0.435);
    expect(MUTE_ACCENT_ROUGHNESS).toBeLessThan(MUTE_BODY_ROUGHNESS);
    expect(MUTE_BODY_COLOR).toBe(0x647262);
    expect(MUTE_MAP_TINT).toBe(0xa8b8a4);
    expect(MUTE_ACCENT).toBe(0x6b7a68);
    expect(MUTE_ACCENT_EMISSIVE).toBe(0x1a2218);
    expect(MUTE_BODY_EMISSIVE).toBe(0x1c2319);
    expect(MUTE_ACCENT_EMISSIVE_INTENSITY).toBe(0.4025);
    expect(MUTE_CRUSHED_BODY).toBe(0x4a5648);
  });

  test("accent roughness 0.5 × 0.87; color/looks/teclas iguales", () => {
    expect(MUTE_ACCENT_ROUGHNESS).toBe(0.435);
    expect(MUTE_ACCENT_ROUGHNESS).toBeCloseTo(0.5 * 0.87, 10);
    expect(MUTE_ACCENT_ROUGHNESS).toBeLessThan(MUTE_BODY_ROUGHNESS);
    expect(MUTE_BODY_ROUGHNESS).toBe(0.7656);
    expect(MUTE_BODY_COLOR).toBe(0x647262);
    expect(MUTE_MAP_TINT).toBe(0xa8b8a4);
    expect(MUTE_ACCENT).toBe(0x6b7a68);
    expect(MUTE_ACCENT_EMISSIVE).toBe(0x1a2218);
    expect(MUTE_BODY_EMISSIVE).toBe(0x1c2319);
    expect(MUTE_ACCENT_EMISSIVE_INTENSITY).toBe(0.4025);
    expect(MUTE_CRUSHED_BODY).toBe(0x4a5648);
  });

  test("distinto de survivor tierra y possessed violeta; sin rojo-violeta", () => {
    expect(MUTE_BODY_COLOR).not.toBe(SURVIVOR_BODY_COLOR);
    expect(MUTE_BODY_COLOR).not.toBe(POSSESSED_BODY_COLOR);
    expect(MUTE_MAP_TINT).not.toBe(SURVIVOR_MAP_TINT);
    expect(MUTE_MAP_TINT).not.toBe(POSSESSED_MAP_TINT);

    const mute = rgb(MUTE_BODY_COLOR);
    const survivor = rgb(SURVIVOR_BODY_COLOR);
    const possessed = rgb(POSSESSED_BODY_COLOR);
    // Survivor tierra: R ≥ G. Mute: G ≥ R.
    expect(mute.g).toBeGreaterThanOrEqual(mute.r);
    expect(survivor.r).toBeGreaterThanOrEqual(survivor.g);
    // Possessed violeta: R y B por encima de G. Mute: G dominante.
    expect(possessed.r).toBeGreaterThan(possessed.g);
    expect(possessed.b).toBeGreaterThan(possessed.g);
    expect(mute.g).toBeGreaterThan(mute.r);
    expect(mute.g).toBeGreaterThan(mute.b);

    const em = rgb(MUTE_BODY_EMISSIVE);
    expect(em.g).toBeGreaterThanOrEqual(em.r);
    expect(em.r).toBeLessThan(0x28);
    expect(em.b).toBeLessThanOrEqual(em.g);
  });
});

describe("isMuteAccentName", () => {
  test("head / visor / helmet / helm", () => {
    expect(isMuteAccentName("SoldierHead")).toBe(true);
    expect(isMuteAccentName("vanguard_visor")).toBe(true);
    expect(isMuteAccentName("Helmet_LOD")).toBe(true);
    expect(isMuteAccentName("helm_glass")).toBe(true);
    expect(isMuteAccentName("vanguard_Mesh")).toBe(false);
    expect(isMuteAccentName("")).toBe(false);
  });
});

describe("applyMuteLook", () => {
  test("sin map: fill gris-verde levantado + emisivo bajo; acento por nombre", () => {
    const bodyMat = new MeshStandardMaterial({
      color: 0x00ff00,
      name: "VanguardBodyMat",
    });
    const visorMat = new MeshStandardMaterial({
      color: 0xff0000,
      name: "Vanguard_VisorMat",
    });
    const body = new Mesh(new BoxGeometry(1, 1, 1), bodyMat);
    body.name = "vanguard_Mesh";
    const visor = new Mesh(new BoxGeometry(0.5, 0.5, 0.5), visorMat);
    visor.name = "vanguard_visor";
    const root = new Group();
    root.add(body, visor);

    applyMuteLook(root);

    expect(body.material).not.toBe(bodyMat);
    expect(visor.material).not.toBe(visorMat);
    const tintedBody = body.material as MeshStandardMaterial;
    const tintedVisor = visor.material as MeshStandardMaterial;
    expect(tintedBody.color.getHex()).toBe(MUTE_BODY_COLOR);
    expect(tintedBody.color.getHex()).not.toBe(MUTE_CRUSHED_BODY);
    expect(tintedBody.emissive.getHex()).toBe(MUTE_BODY_EMISSIVE);
    expect(tintedBody.emissiveIntensity).toBe(MUTE_BODY_EMISSIVE_INTENSITY);
    expect(tintedVisor.color.getHex()).toBe(MUTE_ACCENT);
    expect(tintedVisor.emissive.getHex()).toBe(MUTE_ACCENT_EMISSIVE);
    expect(tintedVisor.emissiveIntensity).toBe(MUTE_ACCENT_EMISSIVE_INTENSITY);
    expect(tintedBody.roughness).toBe(MUTE_BODY_ROUGHNESS);
    expect(tintedVisor.roughness).toBe(MUTE_ACCENT_ROUGHNESS);
    // Originales intactos (cache del loader / template)
    expect(bodyMat.color.getHex()).toBe(0x00ff00);
    expect(visorMat.color.getHex()).toBe(0xff0000);
  });

  test("con map: multiply del tint (conserva variación); no fill plano aplastado", () => {
    const map = new Texture();
    const srcA = 0xa0b0c0;
    const srcB = 0x403020;
    const matA = new MeshStandardMaterial({ color: srcA, map });
    const matB = new MeshStandardMaterial({ color: srcB, map });
    const meshA = new Mesh(new BoxGeometry(1, 1, 1), matA);
    meshA.name = "body_hi";
    const meshB = new Mesh(new BoxGeometry(1, 1, 1), matB);
    meshB.name = "body_lo";
    const root = new Group();
    root.add(meshA, meshB);

    applyMuteLook(root);

    const tintedA = meshA.material as MeshStandardMaterial;
    const tintedB = meshB.material as MeshStandardMaterial;
    const expectedA = new Color(srcA).multiply(new Color(MUTE_MAP_TINT));
    const expectedB = new Color(srcB).multiply(new Color(MUTE_MAP_TINT));
    expect(tintedA.color.getHex()).toBe(expectedA.getHex());
    expect(tintedB.color.getHex()).toBe(expectedB.getHex());
    expect(tintedA.color.getHex()).not.toBe(tintedB.color.getHex());
    expect(tintedA.color.getHex()).not.toBe(MUTE_BODY_COLOR);
    expect(tintedA.color.getHex()).not.toBe(MUTE_CRUSHED_BODY);
    expect(tintedB.color.getHex()).not.toBe(MUTE_CRUSHED_BODY);
    expect(tintedA.emissive.getHex()).toBe(MUTE_BODY_EMISSIVE);
    expect(tintedB.emissive.getHex()).toBe(MUTE_BODY_EMISSIVE);
    expect(tintedA.emissive.getHex()).not.toBe(0x000000);
    expect(matA.color.getHex()).toBe(srcA);
    expect(matB.color.getHex()).toBe(srcB);
  });

  test("soporta MeshBasicMaterial (solo color)", () => {
    const mat = new MeshBasicMaterial({ color: 0xffffff });
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), mat);
    mesh.name = "body";
    applyMuteLook(mesh);
    expect((mesh.material as MeshBasicMaterial).color.getHex()).toBe(
      MUTE_BODY_COLOR,
    );
    expect((mesh.material as MeshBasicMaterial).color.getHex()).not.toBe(
      MUTE_CRUSHED_BODY,
    );
    expect(mesh.material).not.toBe(mat);
  });
});
