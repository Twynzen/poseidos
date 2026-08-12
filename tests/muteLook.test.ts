import { describe, expect, test } from "vitest";
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from "three";
import {
  MUTE_ACCENT_COLOR,
  MUTE_ACCENT_EMISSIVE,
  MUTE_ACCENT_EMISSIVE_INTENSITY,
  MUTE_ACCENT_ROUGHNESS,
  MUTE_BODY_COLOR,
  MUTE_BODY_ROUGHNESS,
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

describe("muteLook constants", () => {
  test("cuerpo gris-verde enfermo, sin rojo/violeta", () => {
    const body = rgb(MUTE_BODY_COLOR);
    // G dominante o empatado: gris-verde, no rojo ni violeta
    expect(body.g).toBeGreaterThanOrEqual(body.r);
    expect(body.g).toBeGreaterThanOrEqual(body.b);
    expect(body.r).toBeLessThan(0x70);
    expect(body.b).toBeLessThan(0x70);
    expect(MUTE_BODY_ROUGHNESS).toBeGreaterThan(0.7);

    const acc = rgb(MUTE_ACCENT_COLOR);
    expect(acc.g).toBeGreaterThanOrEqual(acc.r);
    expect(acc.g).toBeGreaterThanOrEqual(acc.b);
    expect(acc.r).toBeLessThan(0x90);
    expect(MUTE_ACCENT_ROUGHNESS).toBeLessThan(MUTE_BODY_ROUGHNESS);

    const em = rgb(MUTE_ACCENT_EMISSIVE);
    expect(em.g).toBeGreaterThanOrEqual(em.r);
    expect(em.g).toBeGreaterThanOrEqual(em.b);
    expect(em.r).toBeLessThan(0x40);
    expect(MUTE_ACCENT_EMISSIVE_INTENSITY).toBeGreaterThan(0.2);
    expect(MUTE_ACCENT_EMISSIVE_INTENSITY).toBeLessThan(0.6);
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
  test("clona materiales y tinte body vs acento por nombre", () => {
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
    expect(tintedVisor.color.getHex()).toBe(MUTE_ACCENT_COLOR);
    expect(tintedBody.roughness).toBe(MUTE_BODY_ROUGHNESS);
    expect(tintedVisor.roughness).toBe(MUTE_ACCENT_ROUGHNESS);
    expect(tintedVisor.emissive.getHex()).toBe(MUTE_ACCENT_EMISSIVE);
    expect(tintedVisor.emissiveIntensity).toBe(MUTE_ACCENT_EMISSIVE_INTENSITY);
    // Originales intactos (cache del loader / template)
    expect(bodyMat.color.getHex()).toBe(0x00ff00);
    expect(visorMat.color.getHex()).toBe(0xff0000);
  });

  test("soporta MeshBasicMaterial (solo color)", () => {
    const mat = new MeshBasicMaterial({ color: 0xffffff });
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), mat);
    mesh.name = "body";
    applyMuteLook(mesh);
    expect((mesh.material as MeshBasicMaterial).color.getHex()).toBe(
      MUTE_BODY_COLOR,
    );
    expect(mesh.material).not.toBe(mat);
  });
});
