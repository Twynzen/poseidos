import { describe, expect, test } from "vitest";
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from "three";
import {
  SURVIVOR_ACCENT_COLOR,
  SURVIVOR_ACCENT_ROUGHNESS,
  SURVIVOR_BODY_COLOR,
  SURVIVOR_BODY_ROUGHNESS,
  applySurvivorLook,
  isSurvivorAccentName,
} from "../src/render/survivorLook";

describe("survivorLook constants", () => {
  test("paleta tierra/gris (body) y acento frío (visor)", () => {
    const bodyR = (SURVIVOR_BODY_COLOR >> 16) & 0xff;
    const bodyG = (SURVIVOR_BODY_COLOR >> 8) & 0xff;
    const bodyB = SURVIVOR_BODY_COLOR & 0xff;
    // Tierra: canales cercanos, sin verde militar dominante
    expect(Math.abs(bodyR - bodyG)).toBeLessThan(24);
    expect(bodyG).toBeGreaterThan(bodyB - 8);
    expect(SURVIVOR_BODY_ROUGHNESS).toBeGreaterThan(0.6);

    const accB = SURVIVOR_ACCENT_COLOR & 0xff;
    const accR = (SURVIVOR_ACCENT_COLOR >> 16) & 0xff;
    expect(accB).toBeGreaterThan(accR);
    expect(SURVIVOR_ACCENT_ROUGHNESS).toBeLessThan(SURVIVOR_BODY_ROUGHNESS);
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
  test("clona materiales y tinte body vs acento por nombre", () => {
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
    expect(tintedVisor.color.getHex()).toBe(SURVIVOR_ACCENT_COLOR);
    expect(tintedBody.roughness).toBe(SURVIVOR_BODY_ROUGHNESS);
    expect(tintedVisor.roughness).toBe(SURVIVOR_ACCENT_ROUGHNESS);
    // Originales intactos (cache del loader)
    expect(bodyMat.color.getHex()).toBe(0x00ff00);
    expect(visorMat.color.getHex()).toBe(0xff0000);
  });

  test("soporta MeshBasicMaterial (solo color)", () => {
    const mat = new MeshBasicMaterial({ color: 0xffffff });
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), mat);
    mesh.name = "body";
    applySurvivorLook(mesh);
    expect((mesh.material as MeshBasicMaterial).color.getHex()).toBe(
      SURVIVOR_BODY_COLOR,
    );
    expect(mesh.material).not.toBe(mat);
  });
});
