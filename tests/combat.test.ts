import { describe, expect, test } from "vitest";
import { makeFloor, makeWall } from "../src/world/tile";
import { TileMap } from "../src/world/tilemap";
import { HostileSim } from "../src/ai";
import { PlayerSim } from "../src/actors/player";
import {
  HOSTILE_MAX_HEALTH,
  MAX_HEALTH,
  TOUCH_DAMAGE,
  isAlive,
  createBody,
  applyDamage,
} from "../src/actors/body";
import {
  MELEE_DAMAGE,
  MELEE_RANGE,
  MELEE_WHIFF_COOLDOWN,
  pickMeleeTarget,
  resolveMeleeWeapon,
  BARE_HANDS,
  RANGED_DAMAGE,
  RANGED_RANGE,
  checkRangedReady,
  pickRangedTarget,
} from "../src/combat";
import { addItem, createInventory, getItemDef, totalQty, findSlot } from "../src/items";
import { NoiseBus, NOISE_PRESETS } from "../src/world/noise";

function openMap(w = 12, h = 8): TileMap {
  const map = new TileMap(w, h, makeFloor);
  for (let x = 0; x < w; x++) {
    map.set(x, 0, makeWall());
    map.set(x, h - 1, makeWall());
  }
  for (let y = 0; y < h; y++) {
    map.set(0, y, makeWall());
    map.set(w - 1, y, makeWall());
  }
  return map;
}

describe("melee combat", () => {
  test("pickMeleeTarget prioriza facing y respeta rango", () => {
    const targets = [
      { id: "behind", x: 4.5, y: 5.5 },
      { id: "front", x: 6.5, y: 5.5 },
      { id: "far", x: 10.5, y: 5.5 },
    ];
    const pick = pickMeleeTarget(5.5, 5.5, 1, 0, targets, MELEE_RANGE);
    expect(pick?.id).toBe("front");
    expect(pickMeleeTarget(5.5, 5.5, 1, 0, [{ id: "far", x: 10.5, y: 5.5 }])).toBeNull();
  });

  test("player tryMelee daña hostil adyacente y emite contexto de ruido attack", () => {
    const map = openMap();
    const player = new PlayerSim({ x: 5.5, y: 4.5 });
    player.facingX = 1;
    player.facingY = 0;
    const sim = new HostileSim({ speed: 0, visionRange: 0, hearRange: 0 });
    sim.add("mute", 6.4, 4.5);
    expect(sim.hostiles[0]!.health).toBe(HOSTILE_MAX_HEALTH);

    const result = player.tryMelee(sim);
    expect(result).not.toBeNull();
    expect(result!.damage).toBe(MELEE_DAMAGE);
    expect(result!.weapon.label).toBe("puños");
    expect(result!.health).toBe(HOSTILE_MAX_HEALTH - MELEE_DAMAGE);
    expect(result!.killed).toBe(false);
    expect(sim.hostiles.length).toBe(1);

    // Cooldown: segundo golpe inmediato falla
    expect(player.tryMelee(sim)).toBeNull();
    player.tickCombat(1);
    const second = player.tryMelee(sim);
    expect(second?.killed).toBe(false);
    expect(second?.weapon.label).toBe("puños");
    player.tickCombat(1);
    const third = player.tryMelee(sim);
    expect(third?.killed).toBe(true);
    expect(sim.hostiles.length).toBe(0);

    // Noise preset attack disponible para el bus del Game
    const bus = new NoiseBus();
    bus.emitAttack(player.x, player.y);
    expect(bus.loudest()?.source).toBe("attack");
    expect(bus.loudest()?.radius).toBe(NOISE_PRESETS.attack.radius);
    expect(map.walkable(5, 4)).toBe(true);
  });

  test("tryMelee sin target: null, CD corto, no daño; no apila mientras CD", () => {
    const player = new PlayerSim({ x: 5.5, y: 4.5 });
    const sim = new HostileSim({ speed: 0, visionRange: 0, hearRange: 0 });
    sim.add("far", 10.5, 4.5);
    const hp = sim.hostiles[0]!.health;
    expect(player.attackCd).toBe(0);

    expect(player.tryMelee(sim)).toBeNull();
    expect(player.attackCd).toBe(MELEE_WHIFF_COOLDOWN);
    expect(MELEE_WHIFF_COOLDOWN).toBeGreaterThanOrEqual(0.25);
    expect(MELEE_WHIFF_COOLDOWN).toBeLessThanOrEqual(0.35);
    expect(sim.hostiles[0]!.health).toBe(hp);

    expect(player.tryMelee(sim)).toBeNull();
    expect(player.attackCd).toBe(MELEE_WHIFF_COOLDOWN);

    player.tickCombat(MELEE_WHIFF_COOLDOWN);
    expect(player.attackCd).toBe(0);
    expect(player.tryMelee(sim)).toBeNull();
    expect(player.attackCd).toBe(MELEE_WHIFF_COOLDOWN);
  });

  test("hostil a HP 0 se remueve del sim (mundo)", () => {
    const sim = new HostileSim({ maxHealth: 10 });
    sim.add("a", 1, 1);
    sim.add("b", 2, 2);
    const r = sim.damage("a", 10);
    expect(r?.killed).toBe(true);
    expect(sim.get("a")).toBeUndefined();
    expect(sim.hostiles.map((h) => h.id)).toEqual(["b"]);
  });
});

describe("melee weapon variety", () => {
  test("resolveMeleeWeapon: puños sin arma; mejor daño del inv", () => {
    const empty = createInventory();
    expect(resolveMeleeWeapon(empty)).toEqual(BARE_HANDS);
    expect(BARE_HANDS.damage).toBe(MELEE_DAMAGE);

    const inv = createInventory(8, 20);
    addItem(inv, "knife", 1);
    const knife = resolveMeleeWeapon(inv);
    expect(knife.id).toBe("knife");
    expect(knife.damage).toBe(getItemDef("knife").meleeDamage);
    expect(knife.damage).toBeGreaterThan(MELEE_DAMAGE);

    addItem(inv, "crowbar", 1);
    const best = resolveMeleeWeapon(inv);
    expect(best.id).toBe("crowbar");
    expect(best.damage).toBe(getItemDef("crowbar").meleeDamage);
    expect(best.damage).toBeGreaterThan(knife.damage);
  });

  test("tryMelee bare-hands vs armed damage", () => {
    const map = openMap();
    const bare = new PlayerSim({ x: 5.5, y: 4.5 });
    bare.facingX = 1;
    bare.facingY = 0;
    const simBare = new HostileSim({ speed: 0, visionRange: 0, hearRange: 0 });
    simBare.add("a", 6.4, 4.5);
    const rBare = bare.tryMelee(simBare);
    expect(rBare!.damage).toBe(MELEE_DAMAGE);
    expect(rBare!.weapon.label).toBe("puños");

    const armed = new PlayerSim({ x: 5.5, y: 4.5 });
    armed.facingX = 1;
    armed.facingY = 0;
    addItem(armed.inventory, "crowbar", 1);
    const simArmed = new HostileSim({ speed: 0, visionRange: 0, hearRange: 0 });
    simArmed.add("b", 6.4, 4.5);
    const rArmed = armed.tryMelee(simArmed);
    expect(rArmed!.weapon.id).toBe("crowbar");
    expect(rArmed!.weapon.label).toBe("palanca");
    expect(rArmed!.damage).toBe(getItemDef("crowbar").meleeDamage);
    expect(rArmed!.damage).toBeGreaterThan(rBare!.damage);
    expect(map.walkable(5, 4)).toBe(true);
  });

  test("knife defs y reach/cooldown opcionales", () => {
    const k = getItemDef("knife");
    expect(k.name).toBe("cuchillo");
    expect(k.meleeDamage).toBe(25);
    expect(k.meleeReach).toBeCloseTo(1.15);
    const c = getItemDef("crowbar");
    expect(c.name).toBe("palanca");
    expect(c.meleeDamage).toBe(35);
    expect(c.meleeReach!).toBeGreaterThan(MELEE_RANGE);
  });
});

describe("death / game-over sim", () => {
  test("isAlive y applyDamage a 0", () => {
    const body = createBody({ health: TOUCH_DAMAGE });
    applyDamage(body, TOUCH_DAMAGE);
    expect(body.health).toBe(0);
    expect(isAlive(body)).toBe(false);
  });

  test("player HP ≤ 0: alive false, no move / no melee / no rest", () => {
    const map = openMap();
    const player = new PlayerSim(
      { x: 5.5, y: 4.5 },
      undefined,
      undefined,
      { health: 5 },
    );
    const sim = new HostileSim({ speed: 0 });
    sim.add("x", 6.2, 4.5);
    player.takeDamage(20);
    expect(player.health).toBe(0);
    expect(player.alive).toBe(false);
    expect(player.move(0.1, { x: 1, z: 0 }, map)).toBe(0);
    expect(player.tryMelee(sim)).toBeNull();
    const fat = player.needs.fatigue;
    player.rest();
    expect(player.needs.fatigue).toBe(fat);
  });

  test("toques repetidos llevan a muerte (HP 0)", () => {
    const map = openMap();
    const player = new PlayerSim({ x: 5.5, y: 4.5 });
    const sim = new HostileSim({
      touchRange: 1,
      touchDamage: TOUCH_DAMAGE,
      attackCooldown: 0.01,
      speed: 0,
      visionRange: 20,
      hearRange: 20,
    });
    sim.add("biter", 5.5, 4.5);
    let guard = 0;
    while (player.alive && guard < 40) {
      const hits = sim.tick(0.05, map, player.x, player.y);
      for (const h of hits) player.takeDamage(h.damage);
      guard++;
    }
    expect(player.alive).toBe(false);
    expect(player.health).toBe(0);
    expect(player.health).toBeLessThanOrEqual(0);
    // Partía de full HP
    expect(MAX_HEALTH).toBe(100);
  });
});

describe("ranged stub", () => {
  test("checkRangedReady: sin pistola / sin ammo falla; con ambos ok", () => {
    const empty = createInventory();
    expect(checkRangedReady(empty).ok).toBe(false);
    expect((checkRangedReady(empty) as { message: string }).message).toBe("sin pistola");

    const onlyGun = createInventory(8, 20);
    addItem(onlyGun, "pistol", 1);
    expect(checkRangedReady(onlyGun).ok).toBe(false);
    expect((checkRangedReady(onlyGun) as { message: string }).message).toBe(
      "sin munición",
    );

    const onlyAmmo = createInventory(8, 20);
    addItem(onlyAmmo, "ammo", 3);
    expect(checkRangedReady(onlyAmmo).ok).toBe(false);

    const both = createInventory(8, 20);
    addItem(both, "pistol", 1);
    addItem(both, "ammo", 4);
    const ready = checkRangedReady(both);
    expect(ready.ok).toBe(true);
    if (ready.ok) {
      expect(ready.damage).toBe(RANGED_DAMAGE);
      expect(ready.range).toBe(RANGED_RANGE);
      expect(ready.damage).toBeGreaterThan(getItemDef("knife").meleeDamage!);
    }
  });

  test("tryShoot sin arma/ammo: fail HUD, no gasta, no daño", () => {
    const map = openMap();
    const player = new PlayerSim({ x: 3.5, y: 4.5 });
    player.facingX = 1;
    player.facingY = 0;
    const sim = new HostileSim({ speed: 0, visionRange: 0, hearRange: 0 });
    sim.add("t", 8.5, 4.5);
    const hp = sim.hostiles[0]!.health;

    const noGun = player.tryShoot(sim, map);
    expect(noGun.kind).toBe("fail");
    if (noGun.kind === "fail") expect(noGun.message).toBe("sin pistola");
    expect(sim.hostiles[0]!.health).toBe(hp);

    addItem(player.inventory, "pistol", 1);
    const noAmmo = player.tryShoot(sim, map);
    expect(noAmmo.kind).toBe("fail");
    if (noAmmo.kind === "fail") expect(noAmmo.message).toBe("sin munición");
    expect(sim.hostiles[0]!.health).toBe(hp);
  });

  test("tryShoot con pistola+ammo y hostil en LOS: daño y gasta 1 ammo", () => {
    const map = openMap(16, 8);
    const player = new PlayerSim({ x: 3.5, y: 4.5 });
    player.facingX = 1;
    player.facingY = 0;
    addItem(player.inventory, "pistol", 1);
    addItem(player.inventory, "ammo", 3);
    // HP alto: un tiro (45) no mata (HOSTILE_MAX_HEALTH=40)
    const sim = new HostileSim({
      speed: 0,
      visionRange: 0,
      hearRange: 0,
      maxHealth: 100,
    });
    sim.add("far", 9.5, 4.5); // ~6 tiles, within range 7
    const before = sim.hostiles[0]!.health;
    const ammoBefore = totalQty(player.inventory); // pistol 1 + ammo 3

    const shot = player.tryShoot(sim, map);
    expect(shot.kind).toBe("shot");
    if (shot.kind === "shot") {
      expect(shot.hit).toBe(true);
      if (shot.hit) {
        expect(shot.damage).toBe(RANGED_DAMAGE);
        expect(shot.hostileId).toBe("far");
        expect(shot.killed).toBe(false);
        expect(shot.health).toBe(before - RANGED_DAMAGE);
      }
    }
    expect(sim.hostiles[0]!.health).toBe(before - RANGED_DAMAGE);
    expect(findSlot(player.inventory, "ammo")).toBeGreaterThanOrEqual(0);
    expect(player.inventory.slots.find((s) => s.id === "ammo")!.qty).toBe(2);
    expect(totalQty(player.inventory)).toBe(ammoBefore - 1);

    // ruido gun preset
    const bus = new NoiseBus();
    bus.emitGun(player.x, player.y);
    expect(bus.loudest()?.source).toBe("gun");
    expect(bus.loudest()?.radius).toBe(NOISE_PRESETS.gun.radius);
    expect(NOISE_PRESETS.gun.radius).toBeGreaterThan(NOISE_PRESETS.attack.radius);
  });

  test("tryShoot sin LOS: gasta ammo, no hit", () => {
    const map = openMap(16, 8);
    // pared entre player y hostil
    for (let y = 1; y < 7; y++) map.set(6, y, makeWall());
    const player = new PlayerSim({ x: 3.5, y: 4.5 });
    player.facingX = 1;
    player.facingY = 0;
    addItem(player.inventory, "pistol", 1);
    addItem(player.inventory, "ammo", 2);
    const sim = new HostileSim({ speed: 0, visionRange: 0, hearRange: 0 });
    sim.add("blocked", 9.5, 4.5);
    const hp = sim.hostiles[0]!.health;

    const shot = player.tryShoot(sim, map);
    expect(shot.kind).toBe("shot");
    if (shot.kind === "shot") {
      expect(shot.hit).toBe(false);
      expect(shot.message).toContain("fallido");
    }
    expect(sim.hostiles[0]!.health).toBe(hp);
    expect(player.inventory.slots.find((s) => s.id === "ammo")!.qty).toBe(1);
  });

  test("pickRangedTarget respeta facing y rango", () => {
    const map = openMap(16, 8);
    const targets = [
      { id: "behind", x: 2.5, y: 4.5 },
      { id: "front", x: 8.5, y: 4.5 },
      { id: "tooFar", x: 14.5, y: 4.5 },
    ];
    const pick = pickRangedTarget(3.5, 4.5, 1, 0, targets, map, RANGED_RANGE);
    expect(pick?.id).toBe("front");
    expect(
      pickRangedTarget(3.5, 4.5, 1, 0, [{ id: "tooFar", x: 14.5, y: 4.5 }], map),
    ).toBeNull();
  });

  test("pistol defs: daño > knife melee", () => {
    const p = getItemDef("pistol");
    expect(p.name).toBe("pistola");
    expect(p.rangedDamage).toBe(45);
    expect(p.rangedRange).toBe(7);
    expect(getItemDef("ammo").name).toBe("munición");
    expect(p.rangedDamage!).toBeGreaterThan(getItemDef("knife").meleeDamage!);
  });
});
