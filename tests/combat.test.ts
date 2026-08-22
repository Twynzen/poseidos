import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { makeFloor, makeWall } from "../src/world/tile";
import { TileMap } from "../src/world/tilemap";
import { HostileSim, loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
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
  meleeInputApplies,
  applyMeleeInput,
  RANGED_DAMAGE,
  RANGED_RANGE,
  checkRangedReady,
  pickRangedTarget,
  shootInputApplies,
  applyShootInput,
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
    player.aimX = 1;
    player.aimY = 0;
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
    bare.aimX = 1;
    bare.aimY = 0;
    const simBare = new HostileSim({ speed: 0, visionRange: 0, hearRange: 0 });
    simBare.add("a", 6.4, 4.5);
    const rBare = bare.tryMelee(simBare);
    expect(rBare!.damage).toBe(MELEE_DAMAGE);
    expect(rBare!.weapon.label).toBe("puños");

    const armed = new PlayerSim({ x: 5.5, y: 4.5 });
    armed.facingX = 1;
    armed.facingY = 0;
    armed.aimX = 1;
    armed.aimY = 0;
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
    const player = new PlayerSim(
      { x: 3.5, y: 4.5 },
      undefined,
      createInventory(8, 20),
    );
    player.facingX = 1;
    player.facingY = 0;
    player.aimX = 1;
    player.aimY = 0;
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
    const inv = createInventory(8, 20);
    addItem(inv, "pistol", 1);
    addItem(inv, "ammo", 3);
    const player = new PlayerSim({ x: 3.5, y: 4.5 }, undefined, inv);
    player.facingX = 1;
    player.facingY = 0;
    player.aimX = 1;
    player.aimY = 0;
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
    const inv = createInventory(8, 20);
    addItem(inv, "pistol", 1);
    addItem(inv, "ammo", 2);
    const player = new PlayerSim({ x: 3.5, y: 4.5 }, undefined, inv);
    player.facingX = 1;
    player.facingY = 0;
    player.aimX = 1;
    player.aimY = 0;
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

describe("combat aim continuo vs facing snap", () => {
  test("move diagonal: aim = ejes raw, facing snap cardinal", () => {
    const map = openMap();
    const player = new PlayerSim({ x: 5.5, y: 4.5 });
    expect(player.aimX).toBe(0);
    expect(player.aimY).toBe(1);
    expect(player.facingX).toBe(0);
    expect(player.facingY).toBe(1);

    player.move(0.05, { x: 1, z: 1 }, map);
    expect(player.aimX).toBe(1);
    expect(player.aimY).toBe(1);
    // |x| >= |z| → snap este
    expect(player.facingX).toBe(1);
    expect(player.facingY).toBe(0);

    player.move(0.05, { x: 0.4, z: 0.9 }, map);
    expect(player.aimX).toBeCloseTo(0.4);
    expect(player.aimY).toBeCloseTo(0.9);
    expect(player.facingX).toBe(0);
    expect(player.facingY).toBe(1);
  });

  test("tryShoot usa aim diagonal, no facing snap", () => {
    const map = openMap(16, 14);
    const inv = createInventory(8, 20);
    addItem(inv, "pistol", 1);
    addItem(inv, "ammo", 2);
    const player = new PlayerSim({ x: 3.5, y: 4.5 }, undefined, inv);
    const ox = player.x;
    const oy = player.y;
    player.move(0.02, { x: 1, z: 1 }, map);
    player.x = ox;
    player.y = oy;
    expect(player.facingX).toBe(1);
    expect(player.facingY).toBe(0);
    expect(player.aimX).toBe(1);
    expect(player.aimY).toBe(1);

    // NNE: fuera del cono east (facing snap), dentro del cono diagonal (aim)
    const sim = new HostileSim({
      speed: 0,
      visionRange: 0,
      hearRange: 0,
      maxHealth: 100,
    });
    sim.add("diag", 4.5, 9.5);
    const targets = [{ id: "diag", x: 4.5, y: 9.5 }];
    expect(
      pickRangedTarget(player.x, player.y, player.facingX, player.facingY, targets, map),
    ).toBeNull();
    expect(
      pickRangedTarget(player.x, player.y, player.aimX, player.aimY, targets, map)?.id,
    ).toBe("diag");

    const shot = player.tryShoot(sim, map);
    expect(shot.kind).toBe("shot");
    if (shot.kind === "shot") {
      expect(shot.hit).toBe(true);
      if (shot.hit) expect(shot.hostileId).toBe("diag");
    }
  });

  test("tryMelee prioriza aim diagonal sobre facing snap", () => {
    const map = openMap();
    const player = new PlayerSim({ x: 5.5, y: 5.5 });
    const ox = player.x;
    const oy = player.y;
    player.move(0.02, { x: 1, z: 1 }, map);
    player.x = ox;
    player.y = oy;
    expect(player.facingX).toBe(1);
    expect(player.facingY).toBe(0);
    expect(player.aimX).toBe(1);
    expect(player.aimY).toBe(1);

    const sim = new HostileSim({ speed: 0, visionRange: 0, hearRange: 0 });
    // Este (más cerca en eje snap) vs diagonal (aim)
    sim.add("east", 6.55, 5.5);
    sim.add("diag", 6.25, 6.25);

    const byFacing = pickMeleeTarget(
      player.x,
      player.y,
      player.facingX,
      player.facingY,
      sim.hostiles,
    );
    const byAim = pickMeleeTarget(
      player.x,
      player.y,
      player.aimX,
      player.aimY,
      sim.hostiles,
    );
    expect(byFacing?.id).toBe("east");
    expect(byAim?.id).toBe("diag");

    const hit = player.tryMelee(sim);
    expect(hit?.hostileId).toBe("diag");
    expect(map.walkable(5, 5)).toBe(true);
  });
});

describe("shootInputApplies / applyShootInput (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: X no aplica; vivo / load-vivo sí", () => {
    expect(shootInputApplies(true)).toBe(false);
    expect(shootInputApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(shootInputApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(shootInputApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver + wantsShoot no muta ammo ni dispara; vivo X gasta 1 ammo", () => {
    const map = openMap(16, 8);
    const deadInv = createInventory(8, 20);
    addItem(deadInv, "pistol", 1);
    addItem(deadInv, "ammo", 3);
    const deadPlayer = new PlayerSim({ x: 3.5, y: 4.5 }, undefined, deadInv);
    deadPlayer.facingX = 1;
    deadPlayer.facingY = 0;
    deadPlayer.aimX = 1;
    deadPlayer.aimY = 0;
    const deadSim = new HostileSim({
      speed: 0,
      visionRange: 0,
      hearRange: 0,
      maxHealth: 100,
    });
    deadSim.add("far", 9.5, 4.5);
    const beforeDeadAmmo = deadPlayer.inventory.slots.find((s) => s.id === "ammo")!.qty;
    const beforeDeadHp = deadSim.hostiles[0]!.health;
    const beforeDeadSlots = deadPlayer.inventory.slots.map((s) => ({ ...s }));

    expect(
      applyShootInput(true, true, () => deadPlayer.tryShoot(deadSim, map)),
    ).toBeNull();
    expect(deadPlayer.inventory.slots).toEqual(beforeDeadSlots);
    expect(deadPlayer.inventory.slots.find((s) => s.id === "ammo")!.qty).toBe(
      beforeDeadAmmo,
    );
    expect(deadSim.hostiles[0]!.health).toBe(beforeDeadHp);

    const deadRt = loadAliveRuntime(false);
    expect(
      applyShootInput(deadRt.gameOver, true, () =>
        deadPlayer.tryShoot(deadSim, map),
      ),
    ).toBeNull();
    expect(deadPlayer.inventory.slots.find((s) => s.id === "ammo")!.qty).toBe(
      beforeDeadAmmo,
    );
    expect(deadSim.hostiles[0]!.health).toBe(beforeDeadHp);

    const liveInv = createInventory(8, 20);
    addItem(liveInv, "pistol", 1);
    addItem(liveInv, "ammo", 3);
    const livePlayer = new PlayerSim({ x: 3.5, y: 4.5 }, undefined, liveInv);
    livePlayer.facingX = 1;
    livePlayer.facingY = 0;
    livePlayer.aimX = 1;
    livePlayer.aimY = 0;
    const liveSim = new HostileSim({
      speed: 0,
      visionRange: 0,
      hearRange: 0,
      maxHealth: 100,
    });
    liveSim.add("far", 9.5, 4.5);
    const beforeLiveHp = liveSim.hostiles[0]!.health;

    const shot = applyShootInput(false, true, () =>
      livePlayer.tryShoot(liveSim, map),
    );
    expect(shot?.kind).toBe("shot");
    if (shot?.kind === "shot") {
      expect(shot.hit).toBe(true);
    }
    expect(livePlayer.inventory.slots.find((s) => s.id === "ammo")!.qty).toBe(2);
    expect(liveSim.hostiles[0]!.health).toBe(beforeLiveHp - RANGED_DAMAGE);
    expect(
      applyShootInput(false, false, () => livePlayer.tryShoot(liveSim, map)),
    ).toBeNull();
    expect(livePlayer.inventory.slots.find((s) => s.id === "ammo")!.qty).toBe(2);

    const liveRt = loadAliveRuntime(true);
    const againInv = createInventory(8, 20);
    addItem(againInv, "pistol", 1);
    addItem(againInv, "ammo", 1);
    const again = new PlayerSim({ x: 3.5, y: 4.5 }, undefined, againInv);
    again.facingX = 1;
    again.facingY = 0;
    again.aimX = 1;
    again.aimY = 0;
    const againSim = new HostileSim({
      speed: 0,
      visionRange: 0,
      hearRange: 0,
      maxHealth: 100,
    });
    againSim.add("far", 9.5, 4.5);
    expect(
      applyShootInput(liveRt.gameOver, true, () => again.tryShoot(againSim, map))
        ?.kind,
    ).toBe("shot");
    expect(again.inventory.slots.find((s) => s.id === "ammo")).toBeUndefined();
  });

  test("Game freeze / enterGameOver / F9 load-muerto drenan X sin disparo; vivo gatea", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("shootInputApplies(");
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}consumeShoot\(\)/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2200}consumeShoot\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2200}if \(loaded\.gameOver\) this\.input\.consumeShoot\(\)/,
    );
    expect(gameSrc).toMatch(
      /shootInputApplies\(\s*this\.gameOver[\s\S]{0,80}wantsShoot[\s\S]{0,200}tryShoot/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}tryShoot/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}tryShoot/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2400}consumeRestOrRestart\(\)/,
    );
  });
});

describe("meleeInputApplies / applyMeleeInput (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte: Space/V no aplica; vivo / load-vivo sí", () => {
    expect(meleeInputApplies(true)).toBe(false);
    expect(meleeInputApplies(false)).toBe(true);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    expect(meleeInputApplies(deadRt.gameOver)).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(meleeInputApplies(liveRt.gameOver)).toBe(true);
  });

  test("gameOver + wantsAttack no muta HP ni CD; vivo Space/V golpea o whiff", () => {
    const deadPlayer = new PlayerSim({ x: 5.5, y: 4.5 });
    deadPlayer.facingX = 1;
    deadPlayer.facingY = 0;
    deadPlayer.aimX = 1;
    deadPlayer.aimY = 0;
    const deadSim = new HostileSim({ speed: 0, visionRange: 0, hearRange: 0 });
    deadSim.add("mute", 6.4, 4.5);
    const beforeDeadHp = deadSim.hostiles[0]!.health;
    const beforeDeadCd = deadPlayer.attackCd;

    expect(
      applyMeleeInput(true, true, () => deadPlayer.tryMelee(deadSim)),
    ).toBeNull();
    expect(deadSim.hostiles[0]!.health).toBe(beforeDeadHp);
    expect(deadPlayer.attackCd).toBe(beforeDeadCd);

    const deadRt = loadAliveRuntime(false);
    expect(
      applyMeleeInput(deadRt.gameOver, true, () => deadPlayer.tryMelee(deadSim)),
    ).toBeNull();
    expect(deadSim.hostiles[0]!.health).toBe(beforeDeadHp);
    expect(deadPlayer.attackCd).toBe(beforeDeadCd);

    const livePlayer = new PlayerSim({ x: 5.5, y: 4.5 });
    livePlayer.facingX = 1;
    livePlayer.facingY = 0;
    livePlayer.aimX = 1;
    livePlayer.aimY = 0;
    const liveSim = new HostileSim({ speed: 0, visionRange: 0, hearRange: 0 });
    liveSim.add("mute", 6.4, 4.5);
    const beforeLiveHp = liveSim.hostiles[0]!.health;

    const hit = applyMeleeInput(false, true, () => livePlayer.tryMelee(liveSim));
    expect(hit).not.toBeNull();
    expect(hit!.damage).toBe(MELEE_DAMAGE);
    expect(hit!.weapon.label).toBe("puños");
    expect(liveSim.hostiles[0]!.health).toBe(beforeLiveHp - MELEE_DAMAGE);
    expect(livePlayer.attackCd).toBeGreaterThan(0);
    expect(
      applyMeleeInput(false, false, () => livePlayer.tryMelee(liveSim)),
    ).toBeNull();
    expect(liveSim.hostiles[0]!.health).toBe(beforeLiveHp - MELEE_DAMAGE);
    expect(
      applyMeleeInput(false, true, () => livePlayer.tryMelee(liveSim)),
    ).toBeNull();
    expect(liveSim.hostiles[0]!.health).toBe(beforeLiveHp - MELEE_DAMAGE);
    expect(livePlayer.attackCd).toBeGreaterThan(0);

    const missPlayer = new PlayerSim({ x: 5.5, y: 4.5 });
    const missSim = new HostileSim({ speed: 0, visionRange: 0, hearRange: 0 });
    missSim.add("far", 10.5, 4.5);
    const missHp = missSim.hostiles[0]!.health;
    expect(
      applyMeleeInput(false, true, () => missPlayer.tryMelee(missSim)),
    ).toBeNull();
    expect(missSim.hostiles[0]!.health).toBe(missHp);
    expect(missPlayer.attackCd).toBe(MELEE_WHIFF_COOLDOWN);

    const liveRt = loadAliveRuntime(true);
    const again = new PlayerSim({ x: 5.5, y: 4.5 });
    again.facingX = 1;
    again.facingY = 0;
    again.aimX = 1;
    again.aimY = 0;
    addItem(again.inventory, "crowbar", 1);
    const againSim = new HostileSim({ speed: 0, visionRange: 0, hearRange: 0 });
    againSim.add("mute", 6.4, 4.5);
    const armed = applyMeleeInput(liveRt.gameOver, true, () =>
      again.tryMelee(againSim),
    );
    expect(armed?.weapon.id).toBe("crowbar");
    expect(armed?.weapon.label).toBe("palanca");
    expect(armed?.damage).toBe(getItemDef("crowbar").meleeDamage);
    expect(againSim.hostiles[0]!.health).toBe(
      HOSTILE_MAX_HEALTH - getItemDef("crowbar").meleeDamage!,
    );
  });

  test("Game freeze / enterGameOver / F9 load-muerto drenan Space/V sin swing; vivo gatea", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("meleeInputApplies(");
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2600}consumeAttack\(\)/,
    );
    expect(gameSrc).toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}consumeAttack\(\)/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2400}if \(loaded\.gameOver\) this\.input\.consumeAttack\(\)/,
    );
    expect(gameSrc).toMatch(
      /meleeInputApplies\(\s*this\.gameOver[\s\S]{0,80}wantsAttack[\s\S]{0,200}tryMelee/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2600}tryMelee/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,800}tryMelee/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2600}consumeRestOrRestart\(\)/,
    );
  });
});
