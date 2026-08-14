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
import {
  SURVIVOR_ACCENT,
  SURVIVOR_ACCENT_COLOR,
  SURVIVOR_ACCENT_EMISSIVE,
  SURVIVOR_ACCENT_EMISSIVE_INTENSITY,
  SURVIVOR_ACCENT_ROUGHNESS,
  SURVIVOR_BODY_COLOR,
  SURVIVOR_BODY_EMISSIVE,
  SURVIVOR_BODY_EMISSIVE_INTENSITY,
  SURVIVOR_BODY_ROUGHNESS,
  SURVIVOR_CRUSHED_EARTH,
  SURVIVOR_MAP_TINT,
  applySurvivorLook,
  isSurvivorAccentName,
} from "../src/render/survivorLook";

describe("survivorLook constants", () => {
  test("split knobs: fill claro, map tint, crushed lock, emisivos", () => {
    expect(SURVIVOR_BODY_COLOR).toBe(0x9f9381);
    expect(SURVIVOR_MAP_TINT).toBe(0xe6d8c1);
    expect(SURVIVOR_BODY_EMISSIVE).toBe(0x28251f);
    expect(SURVIVOR_ACCENT).toBe(0xbbb3a1);
    expect(SURVIVOR_ACCENT_COLOR).toBe(SURVIVOR_ACCENT);
    expect(SURVIVOR_ACCENT_EMISSIVE).toBe(0x2a2820);
    expect(SURVIVOR_CRUSHED_EARTH).toBe(0x5c5346);
    expect(SURVIVOR_BODY_COLOR).not.toBe(SURVIVOR_CRUSHED_EARTH);
    expect(SURVIVOR_MAP_TINT).not.toBe(SURVIVOR_CRUSHED_EARTH);

    const bodyR = (SURVIVOR_BODY_COLOR >> 16) & 0xff;
    const bodyG = (SURVIVOR_BODY_COLOR >> 8) & 0xff;
    const bodyB = SURVIVOR_BODY_COLOR & 0xff;
    // Tierra: canales cercanos, sin verde militar dominante
    expect(Math.abs(bodyR - bodyG)).toBeLessThan(24);
    expect(bodyG).toBeGreaterThan(bodyB - 8);
    expect(SURVIVOR_BODY_ROUGHNESS).toBe(0.620658);
    expect(SURVIVOR_BODY_ROUGHNESS).toBeCloseTo(0.7134 * 0.87, 10);
    expect(SURVIVOR_BODY_ROUGHNESS).toBeGreaterThan(0.6);
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBe(0.340605);
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBeCloseTo(0.3915 * 0.87, 10);

    const crushR = (SURVIVOR_CRUSHED_EARTH >> 16) & 0xff;
    expect(bodyR).toBeGreaterThan(crushR);
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBeLessThan(SURVIVOR_BODY_ROUGHNESS);
    expect(SURVIVOR_BODY_EMISSIVE_INTENSITY).toBe(1.15);
    expect(SURVIVOR_BODY_EMISSIVE_INTENSITY).toBeCloseTo(1 * 1.15, 10);
    expect(SURVIVOR_ACCENT_EMISSIVE_INTENSITY).toBe(0.198375);
    expect(SURVIVOR_ACCENT_EMISSIVE_INTENSITY).toBeCloseTo(0.1725 * 1.15, 10);
    expect(SURVIVOR_ACCENT_EMISSIVE_INTENSITY).toBeGreaterThan(0.1);
    expect(SURVIVOR_ACCENT_EMISSIVE_INTENSITY).toBeLessThan(0.3);
  });

  test("accent 0xa39c8c × 1.15/canal → 0xbbb3a1; body/map-tint/emissive/roughness/intensity/crushed iguales", () => {
    expect(SURVIVOR_ACCENT).toBe(0xbbb3a1);
    const r = (SURVIVOR_ACCENT >> 16) & 0xff;
    const g = (SURVIVOR_ACCENT >> 8) & 0xff;
    const b = SURVIVOR_ACCENT & 0xff;
    expect(r).toBe(0xbb);
    expect(g).toBe(0xb3);
    expect(b).toBe(0xa1);
    expect(Math.round((0xa3 * 115) / 100)).toBe(r);
    expect(Math.round((0x9c * 115) / 100)).toBe(g);
    expect(Math.round((0x8c * 115) / 100)).toBe(b);
    expect(SURVIVOR_ACCENT_COLOR).toBe(SURVIVOR_ACCENT);
    expect(SURVIVOR_BODY_COLOR).toBe(0x9f9381);
    expect(SURVIVOR_MAP_TINT).toBe(0xe6d8c1);
    expect(SURVIVOR_BODY_EMISSIVE).toBe(0x28251f);
    expect(SURVIVOR_ACCENT_EMISSIVE).toBe(0x2a2820);
    expect(SURVIVOR_CRUSHED_EARTH).toBe(0x5c5346);
    expect(SURVIVOR_BODY_ROUGHNESS).toBe(0.620658);
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBe(0.340605);
    expect(SURVIVOR_BODY_EMISSIVE_INTENSITY).toBe(1.15);
    expect(SURVIVOR_ACCENT_EMISSIVE_INTENSITY).toBe(0.198375);
  });

  test("body emissive 0x23201b × 1.15/canal → 0x28251f; body/map-tint/accent/roughness/intensity/crushed iguales", () => {
    expect(SURVIVOR_BODY_EMISSIVE).toBe(0x28251f);
    const r = (SURVIVOR_BODY_EMISSIVE >> 16) & 0xff;
    const g = (SURVIVOR_BODY_EMISSIVE >> 8) & 0xff;
    const b = SURVIVOR_BODY_EMISSIVE & 0xff;
    expect(r).toBe(0x28);
    expect(g).toBe(0x25);
    expect(b).toBe(0x1f);
    expect(Math.round((0x23 * 115) / 100)).toBe(r);
    expect(Math.round((0x20 * 115) / 100)).toBe(g);
    expect(Math.round((0x1b * 115) / 100)).toBe(b);
    expect(SURVIVOR_BODY_COLOR).toBe(0x9f9381);
    expect(SURVIVOR_MAP_TINT).toBe(0xe6d8c1);
    expect(SURVIVOR_ACCENT).toBe(0xbbb3a1);
    expect(SURVIVOR_ACCENT_COLOR).toBe(SURVIVOR_ACCENT);
    expect(SURVIVOR_ACCENT_EMISSIVE).toBe(0x2a2820);
    expect(SURVIVOR_CRUSHED_EARTH).toBe(0x5c5346);
    expect(SURVIVOR_BODY_ROUGHNESS).toBe(0.620658);
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBe(0.340605);
    expect(SURVIVOR_BODY_EMISSIVE_INTENSITY).toBe(1.15);
    expect(SURVIVOR_ACCENT_EMISSIVE_INTENSITY).toBe(0.198375);
  });

  test("map tint 0xc8bca8 × 1.15/canal → 0xe6d8c1; body/emissive/accent/roughness/intensity/crushed iguales", () => {
    expect(SURVIVOR_MAP_TINT).toBe(0xe6d8c1);
    const r = (SURVIVOR_MAP_TINT >> 16) & 0xff;
    const g = (SURVIVOR_MAP_TINT >> 8) & 0xff;
    const b = SURVIVOR_MAP_TINT & 0xff;
    expect(r).toBe(0xe6);
    expect(g).toBe(0xd8);
    expect(b).toBe(0xc1);
    expect(Math.round((0xc8 * 115) / 100)).toBe(r);
    expect(Math.round((0xbc * 115) / 100)).toBe(g);
    expect(Math.round((0xa8 * 115) / 100)).toBe(b);
    expect(SURVIVOR_BODY_COLOR).toBe(0x9f9381);
    expect(SURVIVOR_BODY_EMISSIVE).toBe(0x28251f);
    expect(SURVIVOR_ACCENT).toBe(0xbbb3a1);
    expect(SURVIVOR_ACCENT_COLOR).toBe(SURVIVOR_ACCENT);
    expect(SURVIVOR_ACCENT_EMISSIVE).toBe(0x2a2820);
    expect(SURVIVOR_CRUSHED_EARTH).toBe(0x5c5346);
    expect(SURVIVOR_BODY_ROUGHNESS).toBe(0.620658);
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBe(0.340605);
    expect(SURVIVOR_BODY_EMISSIVE_INTENSITY).toBe(1.15);
    expect(SURVIVOR_ACCENT_EMISSIVE_INTENSITY).toBe(0.198375);
  });

  test("body fill 0x8a8070 × 1.15/canal → 0x9f9381; map-tint/emissive/accent/roughness/intensity/crushed iguales", () => {
    expect(SURVIVOR_BODY_COLOR).toBe(0x9f9381);
    const r = (SURVIVOR_BODY_COLOR >> 16) & 0xff;
    const g = (SURVIVOR_BODY_COLOR >> 8) & 0xff;
    const b = SURVIVOR_BODY_COLOR & 0xff;
    expect(r).toBe(0x9f);
    expect(g).toBe(0x93);
    expect(b).toBe(0x81);
    expect(Math.round((0x8a * 115) / 100)).toBe(r);
    expect(Math.round((0x80 * 115) / 100)).toBe(g);
    expect(Math.round((0x70 * 115) / 100)).toBe(b);
    expect(SURVIVOR_MAP_TINT).toBe(0xe6d8c1);
    expect(SURVIVOR_BODY_EMISSIVE).toBe(0x28251f);
    expect(SURVIVOR_ACCENT).toBe(0xbbb3a1);
    expect(SURVIVOR_ACCENT_COLOR).toBe(SURVIVOR_ACCENT);
    expect(SURVIVOR_ACCENT_EMISSIVE).toBe(0x2a2820);
    expect(SURVIVOR_CRUSHED_EARTH).toBe(0x5c5346);
    expect(SURVIVOR_BODY_ROUGHNESS).toBe(0.620658);
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBe(0.340605);
    expect(SURVIVOR_BODY_EMISSIVE_INTENSITY).toBe(1.15);
    expect(SURVIVOR_ACCENT_EMISSIVE_INTENSITY).toBe(0.198375);
  });

  test("body emissive intensity 1 × 1.15; color/looks iguales", () => {
    expect(SURVIVOR_BODY_EMISSIVE_INTENSITY).toBe(1.15);
    expect(SURVIVOR_BODY_EMISSIVE_INTENSITY).toBeCloseTo(1 * 1.15, 10);
    expect(SURVIVOR_ACCENT_EMISSIVE_INTENSITY).toBe(0.198375);
    expect(SURVIVOR_ACCENT_EMISSIVE).toBe(0x2a2820);
    expect(SURVIVOR_BODY_EMISSIVE).toBe(0x28251f);
    expect(SURVIVOR_BODY_COLOR).toBe(0x9f9381);
    expect(SURVIVOR_MAP_TINT).toBe(0xe6d8c1);
    expect(SURVIVOR_ACCENT).toBe(0xbbb3a1);
    expect(SURVIVOR_BODY_ROUGHNESS).toBe(0.620658);
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBe(0.340605);
    expect(SURVIVOR_CRUSHED_EARTH).toBe(0x5c5346);
  });

  test("accent emissive intensity 0.1725 × 1.15; color/looks iguales", () => {
    expect(SURVIVOR_ACCENT_EMISSIVE_INTENSITY).toBe(0.198375);
    expect(SURVIVOR_ACCENT_EMISSIVE_INTENSITY).toBeCloseTo(0.1725 * 1.15, 10);
    expect(SURVIVOR_ACCENT_EMISSIVE).toBe(0x2a2820);
    expect(SURVIVOR_BODY_EMISSIVE).toBe(0x28251f);
    expect(SURVIVOR_BODY_COLOR).toBe(0x9f9381);
    expect(SURVIVOR_MAP_TINT).toBe(0xe6d8c1);
    expect(SURVIVOR_ACCENT).toBe(0xbbb3a1);
    expect(SURVIVOR_CRUSHED_EARTH).toBe(0x5c5346);
  });

  test("body roughness 0.7134 × 0.87; color/looks/teclas iguales", () => {
    expect(SURVIVOR_BODY_ROUGHNESS).toBe(0.620658);
    expect(SURVIVOR_BODY_ROUGHNESS).toBeCloseTo(0.7134 * 0.87, 10);
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBe(0.340605);
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBeLessThan(SURVIVOR_BODY_ROUGHNESS);
    expect(SURVIVOR_BODY_COLOR).toBe(0x9f9381);
    expect(SURVIVOR_MAP_TINT).toBe(0xe6d8c1);
    expect(SURVIVOR_ACCENT).toBe(0xbbb3a1);
    expect(SURVIVOR_ACCENT_EMISSIVE).toBe(0x2a2820);
    expect(SURVIVOR_BODY_EMISSIVE).toBe(0x28251f);
    expect(SURVIVOR_ACCENT_EMISSIVE_INTENSITY).toBe(0.198375);
    expect(SURVIVOR_CRUSHED_EARTH).toBe(0x5c5346);
  });

  test("accent roughness 0.3915 × 0.87; color/looks/teclas iguales", () => {
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBe(0.340605);
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBeCloseTo(0.3915 * 0.87, 10);
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBeLessThan(SURVIVOR_BODY_ROUGHNESS);
    expect(SURVIVOR_BODY_ROUGHNESS).toBe(0.620658);
    expect(SURVIVOR_BODY_COLOR).toBe(0x9f9381);
    expect(SURVIVOR_MAP_TINT).toBe(0xe6d8c1);
    expect(SURVIVOR_ACCENT).toBe(0xbbb3a1);
    expect(SURVIVOR_ACCENT_EMISSIVE).toBe(0x2a2820);
    expect(SURVIVOR_BODY_EMISSIVE).toBe(0x28251f);
    expect(SURVIVOR_ACCENT_EMISSIVE_INTENSITY).toBe(0.198375);
    expect(SURVIVOR_CRUSHED_EARTH).toBe(0x5c5346);
  });
});

describe("isSurvivorAccentName", () => {
  test("visor / helmet / helm", () => {
    expect(isSurvivorAccentName("vanguard_visor")).toBe(true);
    expect(isSurvivorAccentName("Vanguard_VisorMat")).toBe(true);
    expect(isSurvivorAccentName("Helmet_LOD")).toBe(true);
    expect(isSurvivorAccentName("helm_glass")).toBe(true);
    expect(isSurvivorAccentName("vanguard_Mesh")).toBe(false);
    expect(isSurvivorAccentName("")).toBe(false);
  });
});

describe("applySurvivorLook", () => {
  test("sin map: fill tierra claro + emisivo bajo; acento por nombre", () => {
    const bodyMat = new MeshStandardMaterial({ color: 0x00ff00, name: "VanguardBodyMat" });
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

    applySurvivorLook(root);

    expect(body.material).not.toBe(bodyMat);
    expect(visor.material).not.toBe(visorMat);
    const tintedBody = body.material as MeshStandardMaterial;
    const tintedVisor = visor.material as MeshStandardMaterial;
    expect(tintedBody.color.getHex()).toBe(SURVIVOR_BODY_COLOR);
    expect(tintedBody.color.getHex()).not.toBe(SURVIVOR_CRUSHED_EARTH);
    expect(tintedBody.emissive.getHex()).toBe(SURVIVOR_BODY_EMISSIVE);
    expect(tintedBody.emissiveIntensity).toBe(SURVIVOR_BODY_EMISSIVE_INTENSITY);
    expect(tintedVisor.color.getHex()).toBe(SURVIVOR_ACCENT);
    expect(tintedVisor.emissive.getHex()).toBe(SURVIVOR_ACCENT_EMISSIVE);
    expect(tintedVisor.emissiveIntensity).toBe(SURVIVOR_ACCENT_EMISSIVE_INTENSITY);
    expect(tintedBody.roughness).toBe(SURVIVOR_BODY_ROUGHNESS);
    expect(tintedVisor.roughness).toBe(SURVIVOR_ACCENT_ROUGHNESS);
    // Originales intactos (cache del loader)
    expect(bodyMat.color.getHex()).toBe(0x00ff00);
    expect(visorMat.color.getHex()).toBe(0xff0000);
  });

  test("con map: multiply del tint (conserva variación); no fill plano", () => {
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

    applySurvivorLook(root);

    const tintedA = meshA.material as MeshStandardMaterial;
    const tintedB = meshB.material as MeshStandardMaterial;
    const expectedA = new Color(srcA).multiply(new Color(SURVIVOR_MAP_TINT));
    const expectedB = new Color(srcB).multiply(new Color(SURVIVOR_MAP_TINT));
    expect(tintedA.color.getHex()).toBe(expectedA.getHex());
    expect(tintedB.color.getHex()).toBe(expectedB.getHex());
    expect(tintedA.color.getHex()).not.toBe(tintedB.color.getHex());
    expect(tintedA.color.getHex()).not.toBe(SURVIVOR_BODY_COLOR);
    expect(tintedA.color.getHex()).not.toBe(SURVIVOR_CRUSHED_EARTH);
    expect(tintedB.color.getHex()).not.toBe(SURVIVOR_CRUSHED_EARTH);
    expect(tintedA.emissive.getHex()).toBe(SURVIVOR_BODY_EMISSIVE);
    expect(tintedB.emissive.getHex()).toBe(SURVIVOR_BODY_EMISSIVE);
    expect(matA.color.getHex()).toBe(srcA);
    expect(matB.color.getHex()).toBe(srcB);
  });

  test("soporta MeshBasicMaterial (solo color)", () => {
    const mat = new MeshBasicMaterial({ color: 0xffffff });
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), mat);
    mesh.name = "body";
    applySurvivorLook(mesh);
    expect((mesh.material as MeshBasicMaterial).color.getHex()).toBe(
      SURVIVOR_BODY_COLOR,
    );
    expect((mesh.material as MeshBasicMaterial).color.getHex()).not.toBe(
      SURVIVOR_CRUSHED_EARTH,
    );
    expect(mesh.material).not.toBe(mat);
  });
});
