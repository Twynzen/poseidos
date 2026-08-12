import { describe, expect, test } from "vitest";
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from "three";
import {
  POSSESSED_ACCENT_COLOR,
  POSSESSED_ACCENT_EMISSIVE,
  POSSESSED_ACCENT_EMISSIVE_INTENSITY,
  POSSESSED_ACCENT_ROUGHNESS,
  POSSESSED_BODY_COLOR,
  POSSESSED_BODY_ROUGHNESS,
  applyPossessedLook,
  isPossessedAccentName,
} from "../src/render/possessedLook";

describe("possessedLook constants", () => {
  test("cuerpo oscuro + acento rojo/violeta emisivo", () => {
    const bodyR = (POSSESSED_BODY_COLOR >> 16) & 0xff;
    const bodyG = (POSSESSED_BODY_COLOR >> 8) & 0xff;
    const bodyB = POSSESSED_BODY_COLOR & 0xff;
    // Oscuro: canales bajos
    expect(bodyR).toBeLessThan(48);
    expect(bodyG).toBeLessThan(48);
    expect(bodyB).toBeLessThan(48);
    expect(POSSESSED_BODY_ROUGHNESS).toBeGreaterThan(0.7);

    const accR = (POSSESSED_ACCENT_COLOR >> 16) & 0xff;
    const accB = POSSESSED_ACCENT_COLOR & 0xff;
    // Rojo-violeta: R dominante o alto, B presente
    expect(accR).toBeGreaterThan(0x70);
    expect(accB).toBeGreaterThan(0x40);
    expect(POSSESSED_ACCENT_ROUGHNESS).toBeLessThan(POSSESSED_BODY_ROUGHNESS);
    expect(POSSESSED_ACCENT_EMISSIVE_INTENSITY).toBeGreaterThan(0.5);
    expect(POSSESSED_ACCENT_EMISSIVE & 0xff0000).toBeGreaterThan(0);
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

    applyPossessedLook(root);

    expect(body.material).not.toBe(bodyMat);
    expect(visor.material).not.toBe(visorMat);
    const tintedBody = body.material as MeshStandardMaterial;
    const tintedVisor = visor.material as MeshStandardMaterial;
    expect(tintedBody.color.getHex()).toBe(POSSESSED_BODY_COLOR);
    expect(tintedVisor.color.getHex()).toBe(POSSESSED_ACCENT_COLOR);
    expect(tintedBody.roughness).toBe(POSSESSED_BODY_ROUGHNESS);
    expect(tintedVisor.roughness).toBe(POSSESSED_ACCENT_ROUGHNESS);
    expect(tintedVisor.emissive.getHex()).toBe(POSSESSED_ACCENT_EMISSIVE);
    expect(tintedVisor.emissiveIntensity).toBe(
      POSSESSED_ACCENT_EMISSIVE_INTENSITY,
    );
    // Originales intactos (cache del loader / template)
    expect(bodyMat.color.getHex()).toBe(0x00ff00);
    expect(visorMat.color.getHex()).toBe(0xff0000);
  });

  test("soporta MeshBasicMaterial (solo color)", () => {
    const mat = new MeshBasicMaterial({ color: 0xffffff });
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), mat);
    mesh.name = "body";
    applyPossessedLook(mesh);
    expect((mesh.material as MeshBasicMaterial).color.getHex()).toBe(
      POSSESSED_BODY_COLOR,
    );
    expect(mesh.material).not.toBe(mat);
  });
});
