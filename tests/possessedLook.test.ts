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
import { SURVIVOR_BODY_COLOR } from "../src/render/survivorLook";
import {
  POSSESSED_ACCENT,
  POSSESSED_ACCENT_COLOR,
  POSSESSED_ACCENT_EMISSIVE,
  POSSESSED_ACCENT_EMISSIVE_INTENSITY,
  POSSESSED_ACCENT_ROUGHNESS,
  POSSESSED_BODY_COLOR,
  POSSESSED_BODY_EMISSIVE,
  POSSESSED_BODY_EMISSIVE_INTENSITY,
  POSSESSED_BODY_ROUGHNESS,
  POSSESSED_CRUSHED_BODY,
  POSSESSED_FALLBACK_EMISSIVE,
  POSSESSED_MAP_TINT,
  applyPossessedLook,
  isPossessedAccentName,
} from "../src/render/possessedLook";

function channelLum(hex: number): number {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("possessedLook constants", () => {
  test("split knobs: fill levantado, map tint, crushed lock, emisivos", () => {
    expect(POSSESSED_BODY_COLOR).toBe(0x432e40);
    expect(POSSESSED_MAP_TINT).toBe(0x8a6a82);
    expect(POSSESSED_BODY_EMISSIVE).toBe(0x21141e);
    expect(POSSESSED_ACCENT).toBe(0x8a2a55);
    expect(POSSESSED_ACCENT_COLOR).toBe(POSSESSED_ACCENT);
    expect(POSSESSED_ACCENT_EMISSIVE).toBe(0x4a1028);
    expect(POSSESSED_FALLBACK_EMISSIVE).toBe(0x2a0814);
    expect(POSSESSED_CRUSHED_BODY).toBe(0x1c141c);
    expect(POSSESSED_BODY_COLOR).not.toBe(POSSESSED_CRUSHED_BODY);
    expect(POSSESSED_MAP_TINT).not.toBe(POSSESSED_CRUSHED_BODY);
    expect(POSSESSED_BODY_EMISSIVE).not.toBe(POSSESSED_FALLBACK_EMISSIVE);

    expect(channelLum(POSSESSED_BODY_COLOR)).toBeLessThan(
      channelLum(SURVIVOR_BODY_COLOR),
    );
    expect(POSSESSED_BODY_COLOR).toBeLessThan(SURVIVOR_BODY_COLOR);

    const accR = (POSSESSED_ACCENT >> 16) & 0xff;
    const accB = POSSESSED_ACCENT & 0xff;
    // Rojo-violeta: R dominante o alto, B presente
    expect(accR).toBeGreaterThan(0x70);
    expect(accB).toBeGreaterThan(0x40);
    expect(POSSESSED_BODY_ROUGHNESS).toBe(0.666072);
    expect(POSSESSED_BODY_ROUGHNESS).toBeCloseTo(0.7656 * 0.87, 10);
    expect(POSSESSED_BODY_ROUGHNESS).toBeGreaterThan(0.6);
    expect(POSSESSED_ACCENT_ROUGHNESS).toBe(0.30276);
    expect(POSSESSED_ACCENT_ROUGHNESS).toBeCloseTo(0.348 * 0.87, 10);
    expect(POSSESSED_ACCENT_ROUGHNESS).toBeLessThan(POSSESSED_BODY_ROUGHNESS);
    expect(POSSESSED_BODY_EMISSIVE_INTENSITY).toBe(1.15);
    expect(POSSESSED_BODY_EMISSIVE_INTENSITY).toBeCloseTo(1 * 1.15, 10);
    expect(POSSESSED_ACCENT_EMISSIVE_INTENSITY).toBe(1.124125);
    expect(POSSESSED_ACCENT_EMISSIVE_INTENSITY).toBeCloseTo(0.9775 * 1.15, 10);
    expect(POSSESSED_ACCENT_EMISSIVE_INTENSITY).toBeGreaterThan(0.5);
    expect(POSSESSED_ACCENT_EMISSIVE_INTENSITY).toBeLessThan(1.2);
    expect(POSSESSED_ACCENT_EMISSIVE & 0xff0000).toBeGreaterThan(0);

    const crushR = (POSSESSED_CRUSHED_BODY >> 16) & 0xff;
    const bodyR = (POSSESSED_BODY_COLOR >> 16) & 0xff;
    expect(bodyR).toBeGreaterThan(crushR);
  });

  test("body fill 0x3a2838 × 1.15/canal → 0x432e40; map-tint/emissive/accent/roughness/intensity/crushed iguales", () => {
    expect(POSSESSED_BODY_COLOR).toBe(0x432e40);
    const r = (POSSESSED_BODY_COLOR >> 16) & 0xff;
    const g = (POSSESSED_BODY_COLOR >> 8) & 0xff;
    const b = POSSESSED_BODY_COLOR & 0xff;
    expect(r).toBe(0x43);
    expect(g).toBe(0x2e);
    expect(b).toBe(0x40);
    expect(Math.round((0x3a * 115) / 100)).toBe(r);
    expect(Math.round((0x28 * 115) / 100)).toBe(g);
    expect(Math.round((0x38 * 115) / 100)).toBe(b);
    expect(POSSESSED_MAP_TINT).toBe(0x8a6a82);
    expect(POSSESSED_BODY_EMISSIVE).toBe(0x21141e);
    expect(POSSESSED_ACCENT).toBe(0x8a2a55);
    expect(POSSESSED_ACCENT_COLOR).toBe(POSSESSED_ACCENT);
    expect(POSSESSED_ACCENT_EMISSIVE).toBe(0x4a1028);
    expect(POSSESSED_FALLBACK_EMISSIVE).toBe(0x2a0814);
    expect(POSSESSED_CRUSHED_BODY).toBe(0x1c141c);
    expect(POSSESSED_BODY_ROUGHNESS).toBe(0.666072);
    expect(POSSESSED_ACCENT_ROUGHNESS).toBe(0.30276);
    expect(POSSESSED_BODY_EMISSIVE_INTENSITY).toBe(1.15);
    expect(POSSESSED_ACCENT_EMISSIVE_INTENSITY).toBe(1.124125);
  });

  test("body emissive intensity 1 × 1.15; color/looks iguales", () => {
    expect(POSSESSED_BODY_EMISSIVE_INTENSITY).toBe(1.15);
    expect(POSSESSED_BODY_EMISSIVE_INTENSITY).toBeCloseTo(1 * 1.15, 10);
    expect(POSSESSED_ACCENT_EMISSIVE_INTENSITY).toBe(1.124125);
    expect(POSSESSED_ACCENT_EMISSIVE).toBe(0x4a1028);
    expect(POSSESSED_BODY_EMISSIVE).toBe(0x21141e);
    expect(POSSESSED_BODY_COLOR).toBe(0x432e40);
    expect(POSSESSED_MAP_TINT).toBe(0x8a6a82);
    expect(POSSESSED_ACCENT).toBe(0x8a2a55);
    expect(POSSESSED_BODY_ROUGHNESS).toBe(0.666072);
    expect(POSSESSED_ACCENT_ROUGHNESS).toBe(0.30276);
    expect(POSSESSED_CRUSHED_BODY).toBe(0x1c141c);
  });

  test("accent emissive intensity 0.9775 × 1.15; color/looks iguales", () => {
    expect(POSSESSED_ACCENT_EMISSIVE_INTENSITY).toBe(1.124125);
    expect(POSSESSED_ACCENT_EMISSIVE_INTENSITY).toBeCloseTo(0.9775 * 1.15, 10);
    expect(POSSESSED_ACCENT_EMISSIVE).toBe(0x4a1028);
    expect(POSSESSED_BODY_EMISSIVE).toBe(0x21141e);
    expect(POSSESSED_BODY_COLOR).toBe(0x432e40);
    expect(POSSESSED_MAP_TINT).toBe(0x8a6a82);
    expect(POSSESSED_ACCENT).toBe(0x8a2a55);
    expect(POSSESSED_CRUSHED_BODY).toBe(0x1c141c);
  });

  test("body roughness 0.7656 × 0.87; color/looks/teclas iguales", () => {
    expect(POSSESSED_BODY_ROUGHNESS).toBe(0.666072);
    expect(POSSESSED_BODY_ROUGHNESS).toBeCloseTo(0.7656 * 0.87, 10);
    expect(POSSESSED_ACCENT_ROUGHNESS).toBe(0.30276);
    expect(POSSESSED_ACCENT_ROUGHNESS).toBeLessThan(POSSESSED_BODY_ROUGHNESS);
    expect(POSSESSED_BODY_COLOR).toBe(0x432e40);
    expect(POSSESSED_MAP_TINT).toBe(0x8a6a82);
    expect(POSSESSED_ACCENT).toBe(0x8a2a55);
    expect(POSSESSED_ACCENT_EMISSIVE).toBe(0x4a1028);
    expect(POSSESSED_BODY_EMISSIVE).toBe(0x21141e);
    expect(POSSESSED_ACCENT_EMISSIVE_INTENSITY).toBe(1.124125);
    expect(POSSESSED_CRUSHED_BODY).toBe(0x1c141c);
  });

  test("accent roughness 0.348 × 0.87; color/looks/teclas iguales", () => {
    expect(POSSESSED_ACCENT_ROUGHNESS).toBe(0.30276);
    expect(POSSESSED_ACCENT_ROUGHNESS).toBeCloseTo(0.348 * 0.87, 10);
    expect(POSSESSED_ACCENT_ROUGHNESS).toBeLessThan(POSSESSED_BODY_ROUGHNESS);
    expect(POSSESSED_BODY_ROUGHNESS).toBe(0.666072);
    expect(POSSESSED_BODY_COLOR).toBe(0x432e40);
    expect(POSSESSED_MAP_TINT).toBe(0x8a6a82);
    expect(POSSESSED_ACCENT).toBe(0x8a2a55);
    expect(POSSESSED_ACCENT_EMISSIVE).toBe(0x4a1028);
    expect(POSSESSED_BODY_EMISSIVE).toBe(0x21141e);
    expect(POSSESSED_ACCENT_EMISSIVE_INTENSITY).toBe(1.124125);
    expect(POSSESSED_CRUSHED_BODY).toBe(0x1c141c);
  });
});

describe("isPossessedAccentName", () => {
  test("head / visor / helmet / helm", () => {
    expect(isPossessedAccentName("SoldierHead")).toBe(true);
    expect(isPossessedAccentName("vanguard_visor")).toBe(true);
    expect(isPossessedAccentName("Helmet_LOD")).toBe(true);
    expect(isPossessedAccentName("helm_glass")).toBe(true);
    expect(isPossessedAccentName("vanguard_Mesh")).toBe(false);
    expect(isPossessedAccentName("")).toBe(false);
  });
});

describe("applyPossessedLook", () => {
  test("sin map: fill oscuro levantado + emisivo bajo; acento por nombre", () => {
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

    applyPossessedLook(root);

    expect(body.material).not.toBe(bodyMat);
    expect(visor.material).not.toBe(visorMat);
    const tintedBody = body.material as MeshStandardMaterial;
    const tintedVisor = visor.material as MeshStandardMaterial;
    expect(tintedBody.color.getHex()).toBe(POSSESSED_BODY_COLOR);
    expect(tintedBody.color.getHex()).not.toBe(POSSESSED_CRUSHED_BODY);
    expect(tintedBody.emissive.getHex()).toBe(POSSESSED_BODY_EMISSIVE);
    expect(tintedBody.emissive.getHex()).not.toBe(POSSESSED_FALLBACK_EMISSIVE);
    expect(tintedBody.emissiveIntensity).toBe(POSSESSED_BODY_EMISSIVE_INTENSITY);
    expect(tintedVisor.color.getHex()).toBe(POSSESSED_ACCENT);
    expect(tintedVisor.emissive.getHex()).toBe(POSSESSED_ACCENT_EMISSIVE);
    expect(tintedVisor.emissiveIntensity).toBe(
      POSSESSED_ACCENT_EMISSIVE_INTENSITY,
    );
    expect(tintedBody.roughness).toBe(POSSESSED_BODY_ROUGHNESS);
    expect(tintedVisor.roughness).toBe(POSSESSED_ACCENT_ROUGHNESS);
    // Originales intactos (cache del loader / template)
    expect(bodyMat.color.getHex()).toBe(0x00ff00);
    expect(visorMat.color.getHex()).toBe(0xff0000);
  });

  test("con map: multiply del tint (conserva variación); no fill negro aplastado", () => {
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

    applyPossessedLook(root);

    const tintedA = meshA.material as MeshStandardMaterial;
    const tintedB = meshB.material as MeshStandardMaterial;
    const expectedA = new Color(srcA).multiply(new Color(POSSESSED_MAP_TINT));
    const expectedB = new Color(srcB).multiply(new Color(POSSESSED_MAP_TINT));
    expect(tintedA.color.getHex()).toBe(expectedA.getHex());
    expect(tintedB.color.getHex()).toBe(expectedB.getHex());
    expect(tintedA.color.getHex()).not.toBe(tintedB.color.getHex());
    expect(tintedA.color.getHex()).not.toBe(POSSESSED_BODY_COLOR);
    expect(tintedA.color.getHex()).not.toBe(POSSESSED_CRUSHED_BODY);
    expect(tintedB.color.getHex()).not.toBe(POSSESSED_CRUSHED_BODY);
    expect(tintedA.emissive.getHex()).toBe(POSSESSED_BODY_EMISSIVE);
    expect(tintedB.emissive.getHex()).toBe(POSSESSED_BODY_EMISSIVE);
    expect(matA.color.getHex()).toBe(srcA);
    expect(matB.color.getHex()).toBe(srcB);
  });

  test("soporta MeshBasicMaterial (solo color)", () => {
    const mat = new MeshBasicMaterial({ color: 0xffffff });
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), mat);
    mesh.name = "body";
    applyPossessedLook(mesh);
    expect((mesh.material as MeshBasicMaterial).color.getHex()).toBe(
      POSSESSED_BODY_COLOR,
    );
    expect((mesh.material as MeshBasicMaterial).color.getHex()).not.toBe(
      POSSESSED_CRUSHED_BODY,
    );
    expect(mesh.material).not.toBe(mat);
  });
});
