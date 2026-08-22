import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { makeDoor, makeFloor, makeWall } from "../src/world/tile";
import { TileMap } from "../src/world/tilemap";
import {
  HostileSim,
  defaultHostileSpawns,
  defaultPossessedSpawns,
  SPAWN_GRACE_SECONDS,
  spawnGraceAfterRestart,
  tickSpawnGrace,
  hostileDamageAllowed,
  loadAliveRuntime,
} from "../src/ai";
import { NoiseBus } from "../src/world/noise";
import { PlayerSim } from "../src/actors/player";
import { MAX_HEALTH, TOUCH_DAMAGE } from "../src/actors/body";
import { createNeighborhood } from "../src/world/neighborhood";

function corridorMap(): TileMap {
  // 16x5 pasillo abierto
  const map = new TileMap(16, 5, makeFloor);
  for (let x = 0; x < 16; x++) {
    map.set(x, 0, makeWall());
    map.set(x, 4, makeWall());
  }
  return map;
}

describe("HostileSim AI tick", () => {
  test("spawns y wander mueve sin WebGL", () => {
    const map = corridorMap();
    let i = 0;
    const rng = () => {
      i += 1;
      return (i % 10) / 10;
    };
    const sim = new HostileSim({ wanderRadius: 3, speed: 3 }, rng);
    sim.add("h1", 2.5, 2.5);
    const x0 = sim.hostiles[0]!.x;
    for (let t = 0; t < 40; t++) {
      sim.tick(0.1, map, 14.5, 2.5); // player lejos, sin oír
    }
    const h = sim.hostiles[0]!;
    // Debe haber intentado moverse (wander)
    expect(Math.hypot(h.x - x0, h.y - 2.5) + Math.abs(h.y - 2.5)).toBeGreaterThan(
      0.05,
    );
    expect(h.mode).toBe("wander");
  });

  test("persigue si player en visión (LOS)", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      visionRange: 10,
      hearRange: 0.5,
      speed: 4,
    });
    sim.add("chaser", 2.5, 2.5);
    // Player en el mismo pasillo, LOS libre
    for (let t = 0; t < 30; t++) {
      sim.tick(0.1, map, 10.5, 2.5);
    }
    const h = sim.hostiles[0]!;
    expect(h.mode).toBe("chase");
    expect(h.x).toBeGreaterThan(2.5);
  });

  test("muro corta visión: no chase por LOS; ruido atrae investigate", () => {
    const map = new TileMap(12, 12, makeFloor);
    for (let y = 0; y < 12; y++) map.set(6, y, makeWall());
    map.set(6, 6, makeDoor(false)); // cerrado — bloquea vista y paso
    const sim = new HostileSim({
      visionRange: 10,
      hearRange: 0,
      speed: 3,
    });
    sim.add("mute", 3.5, 6.5);
    const bus = new NoiseBus();
    // Player al otro lado, sin ruido
    sim.tick(0.05, map, 9.5, 6.5, bus);
    expect(sim.hostiles[0]!.mode).toBe("wander");

    // Ruido cerca del hostile (p.ej. puerta) → investigate
    bus.emitDoor(4.5, 6.5);
    sim.tick(0.05, map, 9.5, 6.5, bus);
    expect(sim.hostiles[0]!.mode).toBe("investigate");
  });

  test("toque aplica daño a health del player", () => {
    const map = corridorMap();
    const player = new PlayerSim({ x: 5.5, y: 2.5 });
    expect(player.health).toBe(MAX_HEALTH);
    const sim = new HostileSim({
      touchRange: 0.8,
      touchDamage: TOUCH_DAMAGE,
      attackCooldown: 0.5,
      hearRange: 20,
      visionRange: 20,
      speed: 0, // quieto encima
    });
    sim.add("biter", 5.5, 2.5);
    const hits = sim.tick(0.1, map, player.x, player.y);
    expect(hits.length).toBe(1);
    expect(hits[0]!.damage).toBe(TOUCH_DAMAGE);
    player.takeDamage(hits[0]!.damage);
    expect(player.health).toBe(MAX_HEALTH - TOUCH_DAMAGE);

    // Cooldown: sin segundo hit inmediato
    const hits2 = sim.tick(0.1, map, player.x, player.y);
    expect(hits2.length).toBe(0);
  });

  test("pathfinding respeta puerta cerrada en chase (no atraviesa)", () => {
    const map = new TileMap(10, 5, makeFloor);
    for (let y = 0; y < 5; y++) map.set(5, y, makeWall());
    map.set(5, 2, makeDoor(false));
    const sim = new HostileSim({
      visionRange: 0,
      hearRange: 0,
      speed: 5,
    });
    sim.add("stuck", 2.5, 2.5);
    const bus = new NoiseBus();
    for (let t = 0; t < 40; t++) {
      bus.emitAttack(8.5, 2.5);
      bus.tick(0.1);
      sim.tick(0.1, map, 8.5, 2.5, bus);
    }
    const h = sim.hostiles[0]!;
    expect(h.x).toBeLessThan(5); // no cruzó el muro/puerta
  });

  test("neighborhood spawn tiles son walkable", () => {
    const { map } = createNeighborhood(48);
    for (const s of [...defaultHostileSpawns(), ...defaultPossessedSpawns()]) {
      expect(map.walkable(Math.floor(s.x), Math.floor(s.y))).toBe(true);
    }
  });

  test("default spawns ≥12 tiles del spawn barrio (24.5,15.5)", () => {
    const px = 24.5;
    const py = 15.5;
    const all = [...defaultHostileSpawns(), ...defaultPossessedSpawns()];
    expect(defaultHostileSpawns()).toHaveLength(3);
    expect(defaultPossessedSpawns()).toHaveLength(2);
    for (const s of all) {
      const d = Math.hypot(s.x - px, s.y - py);
      expect(d).toBeGreaterThanOrEqual(12);
      // Fuera del corredor horizontal del spawn (misma y → drift LOS)
      expect(s.y).not.toBeCloseTo(py, 5);
    }
  });

  test("add() guarda homeX/homeY = coords de spawn", () => {
    const sim = new HostileSim();
    const h = sim.add("home-check", 11.5, 7.5);
    expect(h.homeX).toBe(11.5);
    expect(h.homeY).toBe(7.5);
    expect(h.x).toBe(11.5);
    expect(h.y).toBe(7.5);
  });

  test("planWander target queda ≤ wanderRadius+1 del home (no de pos actual)", () => {
    const map = corridorMap();
    const wanderRadius = 3;
    let i = 0;
    const rng = () => {
      i += 1;
      return (i % 7) / 7;
    };
    const sim = new HostileSim({ wanderRadius, speed: 0, visionRange: 0, hearRange: 0 }, rng);
    const h = sim.add("anchored", 3.5, 2.5);
    // Drift artificial lejos del home: si planeara desde aquí, targets estarían cerca de x=12
    h.x = 12.5;
    h.y = 2.5;
    for (let t = 0; t < 12; t++) {
      h.replanAt = 0;
      h.path = [];
      h.pathIndex = 0;
      sim.tick(0.05, map, 14.5, 2.5);
      expect(h.path.length).toBeGreaterThan(0);
      const end = h.path[h.path.length - 1]!;
      const distHome = Math.hypot(end.x + 0.5 - h.homeX, end.y + 0.5 - h.homeY);
      expect(distHome).toBeLessThanOrEqual(wanderRadius + 1);
    }
  });
});

describe("spawn grace (demo survivable)", () => {
  test("defaults kiteable: CD 1.15, touchRange 0.58, grace 6, TOUCH_DAMAGE 12", () => {
    const sim = new HostileSim();
    expect(sim.attackCooldown).toBe(1.15);
    expect(sim.touchRange).toBe(0.58);
    expect(SPAWN_GRACE_SECONDS).toBe(6);
    expect(TOUCH_DAMAGE).toBe(12);
  });

  test("tickSpawnGrace baja con dt y clampa a 0", () => {
    expect(SPAWN_GRACE_SECONDS).toBe(6);
    expect(tickSpawnGrace(6, 1)).toBeCloseTo(5);
    expect(tickSpawnGrace(0.2, 0.5)).toBe(0);
    expect(tickSpawnGrace(0, 1)).toBe(0);
  });

  test("durante gracia no se aplica daño touch; luego sí", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      visionRange: 0,
      hearRange: 0,
      speed: 0,
      touchRange: 1,
      attackCooldown: 0.1,
    });
    // Encima del player → hit inmediato si se aplica
    sim.add("touchy", 2.5, 2.5);
    const player = new PlayerSim({ x: 2.5, y: 2.5 });
    let grace = SPAWN_GRACE_SECONDS;

    // ~2s dentro de la gracia (6s): hostiles.tick puede devolver hits, pero no aplicamos
    for (let t = 0; t < 20; t++) {
      const hits = sim.tick(0.1, map, player.x, player.y);
      if (hostileDamageAllowed(grace)) {
        for (const hit of hits) player.takeDamage(hit.damage);
      }
      grace = tickSpawnGrace(grace, 0.1);
    }
    expect(grace).toBeGreaterThan(0);
    expect(player.health).toBe(MAX_HEALTH);

    // Agotar gracia
    grace = tickSpawnGrace(grace, 10);
    expect(grace).toBe(0);

    const hits = sim.tick(0.1, map, player.x, player.y);
    expect(hits.length).toBeGreaterThan(0);
    if (hostileDamageAllowed(grace)) {
      for (const hit of hits) player.takeDamage(hit.damage);
    }
    expect(player.health).toBe(MAX_HEALTH - TOUCH_DAMAGE);
  });

  test("20s AFK en spawn defaults+grace: player sobrevive (hp>0) y sin chase ≤8s", () => {
    const { map } = createNeighborhood(48);
    const sim = new HostileSim(); // defaults: vision 8, speed 2.4, wanderRadius 4
    for (const s of defaultHostileSpawns()) sim.add(s.id, s.x, s.y, undefined, "mute");
    for (const s of defaultPossessedSpawns()) {
      sim.add(s.id, s.x, s.y, undefined, "possessed");
    }
    const player = new PlayerSim({ x: 24.5, y: 15.5 });
    let grace = SPAWN_GRACE_SECONDS;
    let chasedBefore8s = false;
    const dt = 0.1;
    const steps = Math.round(20 / dt);
    for (let t = 0; t < steps; t++) {
      const elapsed = (t + 1) * dt;
      const hits = sim.tick(dt, map, player.x, player.y, null);
      if (hostileDamageAllowed(grace)) {
        for (const hit of hits) player.takeDamage(hit.damage);
      }
      grace = tickSpawnGrace(grace, dt);
      if (elapsed <= 8 && sim.hostiles.some((h) => h.mode === "chase")) {
        chasedBefore8s = true;
      }
    }
    expect(chasedBefore8s).toBe(false);
    expect(player.health).toBeGreaterThan(0);
    expect(player.alive).toBe(true);
  });
});

describe("HostileSim chase-search polish", () => {
  test("tras investigar ruido y llegar sin player → wander (no freeze)", () => {
    const map = corridorMap();
    // rng fijo: wander predecible tras el search
    const sim = new HostileSim(
      {
        visionRange: 0,
        hearRange: 0,
        speed: 5,
        investigateTimeout: 6,
        searchCooldown: 2,
        maxInvestigateRange: 20,
        wanderRadius: 2,
      },
      () => 0.5,
    );
    sim.add("seeker", 2.5, 2.5);
    const bus = new NoiseBus();
    // Ruido breve: oye una vez; la memoria mantiene search hasta llegar
    bus.emit(5.5, 2.5, "door", { ttl: 0.3 });
    sim.tick(0.05, map, 14.5, 2.5, bus);
    expect(sim.hostiles[0]!.mode).toBe("investigate");

    let reachedNoise = false;
    let sawWanderAfterSearch = false;
    for (let t = 0; t < 30; t++) {
      bus.tick(0.1);
      sim.tick(0.1, map, 14.5, 2.5, bus);
      const h = sim.hostiles[0]!;
      if (Math.hypot(h.x - 5.5, h.y - 2.5) < 0.7) reachedNoise = true;
      if (reachedNoise && h.mode === "wander" && h.searchCd > 0) {
        sawWanderAfterSearch = true;
        break;
      }
    }
    expect(reachedNoise).toBe(true);
    expect(sawWanderAfterSearch).toBe(true);
    expect(sim.hostiles[0]!.mode).toBe("wander");
  });

  test("timeout investigate: olvida y vuelve a wander sin llegar", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      visionRange: 0,
      hearRange: 0,
      speed: 0.2, // muy lento: no llega en el TTL
      investigateTimeout: 0.6,
      searchCooldown: 0.5,
      maxInvestigateRange: 20,
    });
    sim.add("slow", 2.5, 2.5);
    const bus = new NoiseBus();
    // TTL de ruido corto para no refrescar investigateTtl
    bus.emit(12.5, 2.5, "attack", { ttl: 0.15, radius: 14 });
    sim.tick(0.05, map, 14.5, 2.5, bus);
    expect(sim.hostiles[0]!.mode).toBe("investigate");

    for (let t = 0; t < 25; t++) {
      bus.tick(0.1);
      sim.tick(0.1, map, 14.5, 2.5, bus);
    }
    const h = sim.hostiles[0]!;
    expect(h.mode).toBe("wander");
    expect(h.investigateTtl).toBe(0);
    // No alcanzó el ruido lejano
    expect(h.x).toBeLessThan(5);
  });

  test("ruido lejos de maxInvestigateRange se ignora", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      visionRange: 0,
      hearRange: 0,
      speed: 0,
      maxInvestigateRange: 3,
    });
    sim.add("deafish", 2.5, 2.5);
    const bus = new NoiseBus();
    // attack radio 10 — NoiseBus oye, pero HostileSim filtra por maxInvestigateRange
    bus.emitAttack(8.5, 2.5);
    expect(bus.heardFrom(2.5, 2.5)).not.toBeNull();
    sim.tick(0.05, map, 8.5, 2.5, bus);
    expect(sim.hostiles[0]!.mode).toBe("wander");
  });

  test("pierde LOS en chase → investigate última vista (no wander inmediato)", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      visionRange: 4,
      hearRange: 0,
      speed: 4,
      investigateTimeout: 3,
    });
    sim.add("hunter", 2.5, 2.5);
    for (let t = 0; t < 5; t++) {
      sim.tick(0.1, map, 5.5, 2.5); // dentro de visión
    }
    expect(sim.hostiles[0]!.mode).toBe("chase");
    // Player salta fuera de visionRange
    sim.tick(0.1, map, 14.5, 2.5);
    expect(sim.hostiles[0]!.mode).toBe("investigate");
    expect(sim.hostiles[0]!.investigateTtl).toBeGreaterThan(0);
    // Memoria apunta a la última vista (~5.5), no al player actual
    expect(sim.hostiles[0]!.investigateX).toBeCloseTo(5.5, 0);
  });

  test("re-path en chase cuando el player se mueve", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      visionRange: 14,
      hearRange: 0,
      speed: 2,
    });
    sim.add("chaser", 2.5, 2.5);
    sim.tick(0.1, map, 6.5, 2.5);
    expect(sim.hostiles[0]!.mode).toBe("chase");

    // Player se mueve más lejos; tras replanAt el path debe actualizarse
    for (let t = 0; t < 6; t++) {
      sim.tick(0.1, map, 12.5, 2.5);
    }
    const h = sim.hostiles[0]!;
    expect(h.mode).toBe("chase");
    expect(h.x).toBeGreaterThan(2.5);
  });
});

describe("F9 load-alive (clip death + gracia)", () => {
  test("vivo: no gameOver, gracia 6, sin death clip; hostiles no dañan", () => {
    const rt = loadAliveRuntime(true);
    expect(rt.gameOver).toBe(false);
    expect(rt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    expect(rt.deathClip).toBe(false);
    expect(hostileDamageAllowed(rt.spawnGrace)).toBe(false);
  });

  test("muerto: gameOver, gracia 0, death clip", () => {
    const rt = loadAliveRuntime(false);
    expect(rt.gameOver).toBe(true);
    expect(rt.spawnGrace).toBe(0);
    expect(rt.deathClip).toBe(true);
    expect(hostileDamageAllowed(rt.spawnGrace)).toBe(true);
  });

  test("gracia agotada + muerte → load-vivo restaura gracia (touch no daña)", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      visionRange: 0,
      hearRange: 0,
      speed: 0,
      touchRange: 1,
      attackCooldown: 0.1,
    });
    sim.add("touchy", 2.5, 2.5);
    const player = new PlayerSim({ x: 2.5, y: 2.5 });

    let grace = tickSpawnGrace(SPAWN_GRACE_SECONDS, 10);
    expect(grace).toBe(0);
    expect(hostileDamageAllowed(grace)).toBe(true);

    const hits = sim.tick(0.1, map, player.x, player.y);
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) player.takeDamage(hit.damage);
    player.takeDamage(player.health);
    expect(player.alive).toBe(false);

    // applySave living: health vuelve; doLoad usa loadAliveRuntime(alive)
    player.body.health = MAX_HEALTH;
    expect(player.alive).toBe(true);
    const rt = loadAliveRuntime(player.alive);
    grace = rt.spawnGrace;
    expect(rt.gameOver).toBe(false);
    expect(rt.deathClip).toBe(false);
    expect(grace).toBe(SPAWN_GRACE_SECONDS);
    expect(hostileDamageAllowed(grace)).toBe(false);

    const after = sim.tick(0.1, map, player.x, player.y);
    expect(after.length).toBeGreaterThan(0);
    if (hostileDamageAllowed(grace)) {
      for (const hit of after) player.takeDamage(hit.damage);
    }
    expect(player.health).toBe(MAX_HEALTH);
    expect(player.alive).toBe(true);
  });
});

describe("spawnGraceAfterRestart (R / softReset)", () => {
  test("reinicio → gracia del ctor; leftover 0 no filtra", () => {
    expect(spawnGraceAfterRestart()).toBe(SPAWN_GRACE_SECONDS);
    expect(spawnGraceAfterRestart()).toBe(6);

    let current = 0;
    expect(hostileDamageAllowed(current)).toBe(true);
    current = spawnGraceAfterRestart();
    expect(current).toBe(SPAWN_GRACE_SECONDS);
    expect(current).not.toBe(0);
    expect(hostileDamageAllowed(current)).toBe(false);

    current = tickSpawnGrace(SPAWN_GRACE_SECONDS, 10);
    expect(current).toBe(0);
    expect(hostileDamageAllowed(current)).toBe(true);
    current = spawnGraceAfterRestart();
    expect(current).toBe(SPAWN_GRACE_SECONDS);
    expect(current).not.toBe(0);
    expect(hostileDamageAllowed(current)).toBe(false);

    current = tickSpawnGrace(SPAWN_GRACE_SECONDS, 4);
    expect(current).toBeCloseTo(2);
    current = spawnGraceAfterRestart();
    expect(current).toBe(SPAWN_GRACE_SECONDS);
    expect(hostileDamageAllowed(current)).toBe(false);
  });

  test("vivo tick no usa el helper (tickSpawnGrace / hostileDamageAllowed igual que hoy)", () => {
    expect(tickSpawnGrace(6, 1)).toBeCloseTo(5);
    expect(tickSpawnGrace(0.2, 0.5)).toBe(0);
    expect(tickSpawnGrace(0, 1)).toBe(0);
    expect(tickSpawnGrace(SPAWN_GRACE_SECONDS, 10)).toBe(0);
    expect(hostileDamageAllowed(SPAWN_GRACE_SECONDS)).toBe(false);
    expect(hostileDamageAllowed(0.1)).toBe(false);
    expect(hostileDamageAllowed(0)).toBe(true);
    expect(hostileDamageAllowed(spawnGraceAfterRestart())).toBe(false);
    expect(hostileDamageAllowed(0)).not.toBe(
      hostileDamageAllowed(spawnGraceAfterRestart()),
    );
    expect(tickSpawnGrace(0, 1)).not.toBe(spawnGraceAfterRestart());
  });

  test("Game softReset usa helper; F9 load assign loaded; freeze no inventa gracia", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toContain("spawnGraceAfterRestart(");
    expect(gameSrc).toMatch(
      /softReset\(\): void \{[\s\S]{0,3500}this\.spawnGrace = spawnGraceAfterRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /this\.isoFrustum = isoFrustumAfterRestart\(\);[\s\S]{0,200}this\.resize\(\);[\s\S]{0,200}this\.spawnGrace = spawnGraceAfterRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /spawnThreats\(\): void \{[\s\S]{0,800}this\.spawnGrace = SPAWN_GRACE_SECONDS/,
    );
    expect(gameSrc).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2000}this\.spawnGrace = loaded\.spawnGrace/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2000}spawnGraceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}spawnGraceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}this\.spawnGrace\s*=/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}spawnGraceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}this\.spawnGrace\s*=/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}spawnGraceAfterRestart/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}this\.spawnGrace\s*=/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeLoad\(\)/,
    );
  });
});
