import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { PlayerSim } from "../src/actors/player";
import {
  addItem,
  createInventory,
  FLASHLIGHT_FOV_BONUS,
  fovRadiusWithFlashlight,
  getItemDef,
  hasFlashlight,
  inventorySummary,
  torchLightApplies,
  torchLightIntensity,
  flashlightToggleApplies,
  nextFlashlightOn,
  LOOT_CABINET,
} from "../src/items";
import {
  flashlightConeVisible,
} from "../src/render/flashlightCone";
import {
  applySave,
  createMemoryStorage,
  loadFromString,
  readSave,
  saveToString,
  writeSave,
} from "../src/core/save";
import { GameClock } from "../src/core/clock";
import { createNeighborhood } from "../src/world/neighborhood";
import { makeFloor } from "../src/world/tile";
import { TileMap } from "../src/world/tilemap";
import {
  computeVisibleTiles,
  DEFAULT_FOV_RADIUS,
  tileKey,
} from "../src/world/los";

describe("flashlight def", () => {
  test("catálogo: linterna peso/stack/uso none", () => {
    const def = getItemDef("flashlight");
    expect(def.name).toBe("linterna");
    expect(def.weight).toBeCloseTo(0.5, 5);
    expect(def.stackable).toBe(false);
    expect(def.maxStack).toBe(1);
    expect(def.use).toBe("none");
    expect(def.relief).toBe(0);
  });

  test("inventorySummary label corto linterna", () => {
    const inv = createInventory(4, 20, [{ id: "flashlight", qty: 1 }]);
    expect(inventorySummary(inv)).toContain("linterna×1");
  });

  test("loot cabinet incluye flashlight ~0.4", () => {
    const entry = LOOT_CABINET.find((e) => e.id === "flashlight");
    expect(entry).toBeDefined();
    expect(entry!.chance).toBeCloseTo(0.4, 5);
    expect(entry!.min).toBe(1);
    expect(entry!.max).toBe(1);
  });
});

describe("hasFlashlight / FOV / intensity", () => {
  test("hasFlashlight true solo con item", () => {
    const empty = createInventory(4, 20);
    const withTorch = createInventory(4, 20, [{ id: "flashlight", qty: 1 }]);
    expect(hasFlashlight(empty)).toBe(false);
    expect(hasFlashlight(withTorch)).toBe(true);
  });

  test("FLASHLIGHT_FOV_BONUS y fovRadiusWithFlashlight", () => {
    expect(FLASHLIGHT_FOV_BONUS).toBe(4);
    expect(
      fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, true, true),
    ).toBe(DEFAULT_FOV_RADIUS + FLASHLIGHT_FOV_BONUS);
    expect(fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, false, true)).toBe(
      DEFAULT_FOV_RADIUS,
    );
    expect(fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, true, false)).toBe(
      DEFAULT_FOV_RADIUS,
    );
    expect(fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, false, false)).toBe(
      DEFAULT_FOV_RADIUS,
    );
    expect(fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, true, true, true)).toBe(
      DEFAULT_FOV_RADIUS,
    );
    expect(fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, true, true, false)).toBe(
      DEFAULT_FOV_RADIUS + FLASHLIGHT_FOV_BONUS,
    );
    expect(fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, false, true, false)).toBe(
      DEFAULT_FOV_RADIUS,
    );
    expect(fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, true, false, false)).toBe(
      DEFAULT_FOV_RADIUS,
    );
  });

  test("torchLightIntensity: 0 off/sin item; noche > día", () => {
    expect(torchLightIntensity(false, true, 0.1)).toBe(0);
    expect(torchLightIntensity(true, false, 0.1)).toBe(0);
    expect(torchLightIntensity(false, false, 0.1)).toBe(0);

    const night = torchLightIntensity(true, true, 0.08);
    const day = torchLightIntensity(true, true, 1);
    expect(day).toBeCloseTo(0.35, 2);
    expect(night).toBeGreaterThanOrEqual(1.2);
    expect(night).toBeLessThanOrEqual(1.8);
    expect(night).toBeGreaterThan(day);
  });
});

describe("torchLightApplies (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte oculta torch; ya apagado no-op; load-muerto hidden; vivo/load-vivo pinta", () => {
    const nightOn = torchLightIntensity(true, true, 0.08);
    expect(nightOn).toBeGreaterThan(1);
    expect(flashlightConeVisible(nightOn)).toBe(true);

    expect(torchLightApplies(true)).toBe(false);
    expect(torchLightIntensity(true, true, 0.08, true)).toBe(0);
    expect(flashlightConeVisible(nightOn, true)).toBe(false);
    expect(flashlightConeVisible(0, true)).toBe(false);

    const alreadyOff = torchLightIntensity(false, true, 0.08, true);
    expect(alreadyOff).toBe(0);
    expect(torchLightIntensity(true, false, 0.08, true)).toBe(0);
    expect(flashlightConeVisible(alreadyOff, true)).toBe(false);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(torchLightApplies(deadRt.gameOver)).toBe(false);
    expect(torchLightIntensity(true, true, 0.08, deadRt.gameOver)).toBe(0);
    expect(flashlightConeVisible(nightOn, deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(torchLightApplies(liveRt.gameOver)).toBe(true);
    expect(torchLightIntensity(true, true, 0.08, liveRt.gameOver)).toBeGreaterThan(
      1,
    );
    expect(
      flashlightConeVisible(
        torchLightIntensity(true, true, 0.08, liveRt.gameOver),
        liveRt.gameOver,
      ),
    ).toBe(true);
    expect(torchLightIntensity(false, true, 0.08, liveRt.gameOver)).toBe(0);
    expect(torchLightIntensity(true, false, 0.08, liveRt.gameOver)).toBe(0);

    expect(torchLightApplies(false)).toBe(true);
    expect(torchLightIntensity(true, true, 0.08)).toBe(nightOn);
    expect(torchLightIntensity(true, true, 0.08, false)).toBe(nightOn);
  });

  test("Game syncLighting usa torchLightApplies(gameOver); freeze y F9 load-muerto siguen sync", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("torchLightApplies(");
    expect(gameSrc).toMatch(
      /syncLighting\(\): void \{[\s\S]{0,900}torchLightApplies\(\s*this\.gameOver/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,1000}this\.syncLighting\(\)/,
    );
    expect(gameSrc).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,900}this\.syncLighting\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2200}this\.syncLighting\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,900}this\.flashlightOn = false/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}this\.flashlightOn = false/,
    );
  });
});

describe("fovRadiusWithFlashlight (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: radio base aunque on+item; vivo/load-vivo bonus; off/sin item base", () => {
    expect(FLASHLIGHT_FOV_BONUS).toBe(4);
    expect(
      fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, true, true, true),
    ).toBe(DEFAULT_FOV_RADIUS);
    expect(
      fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, true, true, false),
    ).toBe(DEFAULT_FOV_RADIUS + FLASHLIGHT_FOV_BONUS);
    expect(
      fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, false, true, false),
    ).toBe(DEFAULT_FOV_RADIUS);
    expect(
      fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, true, false, false),
    ).toBe(DEFAULT_FOV_RADIUS);
    expect(
      fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, false, true, true),
    ).toBe(DEFAULT_FOV_RADIUS);
    expect(
      fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, true, false, true),
    ).toBe(DEFAULT_FOV_RADIUS);
    expect(fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, true, true)).toBe(
      DEFAULT_FOV_RADIUS + FLASHLIGHT_FOV_BONUS,
    );

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(
      fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, true, true, deadRt.gameOver),
    ).toBe(DEFAULT_FOV_RADIUS);
    expect(
      fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, false, true, deadRt.gameOver),
    ).toBe(DEFAULT_FOV_RADIUS);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(
      fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, true, true, liveRt.gameOver),
    ).toBe(DEFAULT_FOV_RADIUS + FLASHLIGHT_FOV_BONUS);
    expect(
      fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, false, true, liveRt.gameOver),
    ).toBe(DEFAULT_FOV_RADIUS);
    expect(
      fovRadiusWithFlashlight(DEFAULT_FOV_RADIUS, true, false, liveRt.gameOver),
    ).toBe(DEFAULT_FOV_RADIUS);
  });

  test("Game applyFov usa gameOver; enterGameOver / freeze / F9 load-muerto re-aplican FOV; no muta flashlightOn", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toMatch(
      /applyFov\(\): void \{[\s\S]{0,400}fovRadiusWithFlashlight\([\s\S]{0,200}this\.gameOver/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,900}this\.applyFov\(\)/,
    );
    expect(gameSrc).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,400}this\.applyFov\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}this\.applyFov\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,900}this\.flashlightOn = false/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}this\.flashlightOn = false/,
    );
  });

  test("Game enterGameOver / freeze / F9 load-muerto llaman syncHostileView tras applyFov", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,900}this\.applyFov\(\)[\s\S]{0,200}this\.syncHostileView\(\)/,
    );
    expect(gameSrc).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,400}this\.applyFov\(\)[\s\S]{0,200}this\.syncHostileView\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}this\.applyFov\(\)[\s\S]{0,80}this\.syncHostileView/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,900}this\.flashlightOn = false/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,900}this\.flashlightOn = false/,
    );
  });

  test("anillo +4: gameOver + FOV base oculta; vivo con bonus sigue pintando; fuera ya hidden", () => {
    const map = new TileMap(48, 48, makeFloor);
    const px = 20;
    const py = 20;
    const ring = DEFAULT_FOV_RADIUS + 2;
    expect(ring).toBeGreaterThan(DEFAULT_FOV_RADIUS);
    expect(ring).toBeLessThan(DEFAULT_FOV_RADIUS + FLASHLIGHT_FOV_BONUS);
    const ringKey = tileKey(px + ring, py);
    const farKey = tileKey(
      px + DEFAULT_FOV_RADIUS + FLASHLIGHT_FOV_BONUS + 2,
      py,
    );
    const nearKey = tileKey(px + 3, py);

    const liveRadius = fovRadiusWithFlashlight(
      DEFAULT_FOV_RADIUS,
      true,
      true,
      false,
    );
    const deadRadius = fovRadiusWithFlashlight(
      DEFAULT_FOV_RADIUS,
      true,
      true,
      true,
    );
    expect(liveRadius).toBe(DEFAULT_FOV_RADIUS + FLASHLIGHT_FOV_BONUS);
    expect(deadRadius).toBe(DEFAULT_FOV_RADIUS);

    const liveFov = computeVisibleTiles(map, px, py, liveRadius);
    const deadFov = computeVisibleTiles(map, px, py, deadRadius);

    // Misma culling que syncHostileView: fovVisible.has(tileKey(floor x, floor y)).
    expect(liveFov.has(ringKey)).toBe(true);
    expect(deadFov.has(ringKey)).toBe(false);
    expect(liveFov.has(nearKey)).toBe(true);
    expect(deadFov.has(nearKey)).toBe(true);
    expect(liveFov.has(farKey)).toBe(false);
    expect(deadFov.has(farKey)).toBe(false);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(
      computeVisibleTiles(
        map,
        px,
        py,
        fovRadiusWithFlashlight(
          DEFAULT_FOV_RADIUS,
          true,
          true,
          deadRt.gameOver,
        ),
      ).has(ringKey),
    ).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(
      computeVisibleTiles(
        map,
        px,
        py,
        fovRadiusWithFlashlight(
          DEFAULT_FOV_RADIUS,
          true,
          true,
          liveRt.gameOver,
        ),
      ).has(ringKey),
    ).toBe(true);
  });
});

describe("flashlightToggleApplies / nextFlashlightOn (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: L no flippea; vivo togglea si hay item; sin item se queda off", () => {
    expect(flashlightToggleApplies(true)).toBe(false);
    expect(flashlightToggleApplies(false)).toBe(true);

    expect(nextFlashlightOn(true, true, true, true)).toBe(true);
    expect(nextFlashlightOn(true, false, true, true)).toBe(false);
    expect(nextFlashlightOn(true, true, true, false)).toBe(true);
    expect(nextFlashlightOn(true, false, true, false)).toBe(false);
    expect(nextFlashlightOn(true, true, false, true)).toBe(true);
    expect(nextFlashlightOn(true, false, false, true)).toBe(false);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(flashlightToggleApplies(deadRt.gameOver)).toBe(false);
    expect(nextFlashlightOn(deadRt.gameOver, true, true, true)).toBe(true);
    expect(nextFlashlightOn(deadRt.gameOver, false, true, true)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(flashlightToggleApplies(liveRt.gameOver)).toBe(true);
    expect(nextFlashlightOn(liveRt.gameOver, false, true, true)).toBe(true);
    expect(nextFlashlightOn(liveRt.gameOver, true, true, true)).toBe(false);
    expect(nextFlashlightOn(liveRt.gameOver, true, true, false)).toBe(false);
    expect(nextFlashlightOn(liveRt.gameOver, false, true, false)).toBe(false);
    expect(nextFlashlightOn(liveRt.gameOver, true, false, true)).toBe(true);

    expect(nextFlashlightOn(false, false, true, true)).toBe(true);
    expect(nextFlashlightOn(false, true, true, true)).toBe(false);
    expect(nextFlashlightOn(false, true, true, false)).toBe(false);
    expect(nextFlashlightOn(false, false, true, false)).toBe(false);
  });

  test("Game freeze / enterGameOver / F9 load-muerto drenan L sin assign flashlightOn; vivo gatea", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("flashlightToggleApplies(");
    expect(gameSrc).toContain("nextFlashlightOn(");
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}consumeFlashlightToggle\(\)/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,400}consumeFlashlightToggle\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}if \(loaded\.gameOver\) \{[\s\S]{0,80}consumeFlashlightToggle\(\);[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)/,
    );
    expect(gameSrc).toMatch(
      /flashlightToggleApplies\(\s*this\.gameOver[\s\S]{0,80}wantsFlashlight[\s\S]{0,200}nextFlashlightOn\(/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}this\.flashlightOn = /,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}this\.flashlightOn = /,
    );
  });
});

describe("toggle sin item (lógica headless)", () => {
  test("sin linterna: no enciende", () => {
    const inv = createInventory(4, 20, [{ id: "scrap", qty: 1 }]);
    expect(hasFlashlight(inv)).toBe(false);
    const flashlightOn = nextFlashlightOn(
      false,
      false,
      true,
      hasFlashlight(inv),
    );
    expect(flashlightOn).toBe(false);
    expect(
      torchLightIntensity(flashlightOn, hasFlashlight(inv), 0.1),
    ).toBe(0);
  });

  test("con linterna: toggle on/off cambia intensidad/FOV", () => {
    const inv = createInventory(4, 20, [{ id: "flashlight", qty: 1 }]);
    expect(hasFlashlight(inv)).toBe(true);
    let on = nextFlashlightOn(false, false, true, true);
    expect(on).toBe(true);
    expect(fovRadiusWithFlashlight(12, on, true)).toBe(16);
    expect(torchLightIntensity(on, true, 0.08)).toBeGreaterThan(1);
    on = nextFlashlightOn(false, on, true, true);
    expect(on).toBe(false);
    expect(fovRadiusWithFlashlight(12, on, true)).toBe(12);
    expect(torchLightIntensity(on, true, 0.08)).toBe(0);
  });

  test("pierde item → intensidad 0 aunque on flag quede", () => {
    const inv = createInventory(4, 20, [{ id: "flashlight", qty: 1 }]);
    let on = true;
    inv.slots.length = 0;
    if (!hasFlashlight(inv)) on = false;
    expect(on).toBe(false);
    expect(torchLightIntensity(true, hasFlashlight(inv), 0.1)).toBe(0);
  });
});

describe("flashlight save roundtrip", () => {
  test("save/load acepta flashlight en inventario", () => {
    const neighborhood = createNeighborhood(42);
    const player = new PlayerSim(
      { x: 5, y: 5 },
      undefined,
      createInventory(8, 20),
    );
    addItem(player.inventory, "flashlight", 1);
    const world = {
      map: neighborhood.map,
      containers: neighborhood.containers,
      player,
      clock: new GameClock(48),
    };
    const storage = createMemoryStorage();
    writeSave(storage, world);
    const loaded = readSave(storage);
    expect(loaded).not.toBeNull();
    expect(
      loaded!.player.inventory.slots.some((s) => s.id === "flashlight"),
    ).toBe(true);
    expect(
      loaded!.player.inventory.slots.find((s) => s.id === "flashlight")?.qty,
    ).toBe(1);

    const json = saveToString(world);
    const parsed = loadFromString(json);
    expect(
      parsed.player.inventory.slots.some((s) => s.id === "flashlight"),
    ).toBe(true);

    const world2 = {
      map: createNeighborhood(99).map,
      containers: createNeighborhood(99).containers,
      player: new PlayerSim({ x: 0, y: 0 }),
      clock: new GameClock(48),
    };
    applySave(world2, loaded!);
    expect(hasFlashlight(world2.player.inventory)).toBe(true);
    expect(inventorySummary(world2.player.inventory)).toContain("linterna");
  });
});
