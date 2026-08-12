import { describe, expect, test } from "vitest";
import { makeDoor, makeFloor, makeWall } from "../src/world/tile";
import { TileMap } from "../src/world/tilemap";
import { NoiseBus, NOISE_PRESETS } from "../src/world/noise";
import { HostileSim } from "../src/ai";

function corridorMap(): TileMap {
  const map = new TileMap(16, 5, makeFloor);
  for (let x = 0; x < 16; x++) {
    map.set(x, 0, makeWall());
    map.set(x, 4, makeWall());
  }
  return map;
}

describe("NoiseBus", () => {
  test("emit + TTL decae y expira", () => {
    const bus = new NoiseBus();
    const e = bus.emitDoor(5, 5);
    expect(e.radius).toBe(NOISE_PRESETS.door.radius);
    expect(bus.events.length).toBe(1);
    bus.tick(e.ttl / 2);
    expect(bus.events.length).toBe(1);
    expect(bus.events[0]!.ttl).toBeLessThan(NOISE_PRESETS.door.ttl);
    bus.tick(e.ttl + 0.01);
    expect(bus.events.length).toBe(0);
  });
});

describe("NoiseBus heardFrom", () => {
  test("oye dentro del radio; no oye fuera", () => {
    const bus = new NoiseBus();
    bus.emitLoot(4, 4);
    expect(bus.heardFrom(4, 4)).not.toBeNull();
    expect(bus.heardFrom(4.5, 4.2)?.source).toBe("loot");
    // loot radius 4 — fuera
    expect(bus.heardFrom(20, 20)).toBeNull();
  });

  test("prioriza ruido más fuerte (mayor radio)", () => {
    const bus = new NoiseBus();
    bus.emitWalk(5, 5);
    bus.emitAttack(5, 5);
    const heard = bus.heardFrom(5.1, 5.1);
    expect(heard?.source).toBe("attack");
    expect(heard!.radius).toBe(NOISE_PRESETS.attack.radius);
  });

  test("presets: run > walk en radio", () => {
    expect(NOISE_PRESETS.run.radius).toBeGreaterThan(NOISE_PRESETS.walk.radius);
    expect(NOISE_PRESETS.door.radius).toBeGreaterThan(NOISE_PRESETS.loot.radius);
  });

  test("preset gun más fuerte que attack", () => {
    expect(NOISE_PRESETS.gun.radius).toBeGreaterThan(NOISE_PRESETS.attack.radius);
    const bus = new NoiseBus();
    bus.emitGun(1, 1);
    expect(bus.loudest()?.source).toBe("gun");
  });

  test("loudest para HUD", () => {
    const bus = new NoiseBus();
    expect(bus.loudest()).toBeNull();
    bus.emitWalk(1, 1);
    bus.emitDoor(2, 2);
    expect(bus.loudest()?.source).toBe("door");
  });
});

describe("HostileSim + ruido", () => {
  test("sin LOS: ruido atrae a investigate hacia el punto", () => {
    const map = new TileMap(14, 14, makeFloor);
    for (let y = 0; y < 14; y++) map.set(7, y, makeWall());
    map.set(7, 7, makeDoor(false));
    const sim = new HostileSim({
      visionRange: 12,
      hearRange: 0,
      speed: 4,
    });
    sim.add("mute", 3.5, 7.5);
    const bus = new NoiseBus();
    // Player al otro lado — sin LOS; ruido en lado del hostile cerca de la puerta
    bus.emitDoor(5.5, 7.5);

    sim.tick(0.05, map, 10.5, 7.5, bus);
    expect(sim.hostiles[0]!.mode).toBe("investigate");

    const x0 = sim.hostiles[0]!.x;
    for (let t = 0; t < 25; t++) {
      bus.tick(0.1);
      // re-emit para mantener ruido vivo durante la investigación
      if (t % 5 === 0) bus.emitDoor(5.5, 7.5);
      sim.tick(0.1, map, 10.5, 7.5, bus);
    }
    expect(sim.hostiles[0]!.x).toBeGreaterThan(x0);
    expect(sim.hostiles[0]!.x).toBeLessThan(7); // no atraviesa muro
  });

  test("caminar lejos no atrae; puerta sí", () => {
    const map = corridorMap();
    const sim = new HostileSim({ visionRange: 0, hearRange: 0, speed: 3 });
    sim.add("h", 2.5, 2.5);
    const bus = new NoiseBus();
    bus.emitWalk(14.5, 2.5); // radio 2.5 — hostile no oye
    sim.tick(0.05, map, 14.5, 2.5, bus);
    expect(sim.hostiles[0]!.mode).toBe("wander");

    bus.clear();
    bus.emitDoor(5.5, 2.5); // radio 8 — oye
    sim.tick(0.05, map, 14.5, 2.5, bus);
    expect(sim.hostiles[0]!.mode).toBe("investigate");
  });

  test("visión pisa a ruido: chase al player", () => {
    const map = corridorMap();
    const sim = new HostileSim({
      visionRange: 12,
      hearRange: 0,
      speed: 4,
    });
    sim.add("seer", 2.5, 2.5);
    const bus = new NoiseBus();
    bus.emitAttack(4, 2.5); // ruido cerca
    for (let t = 0; t < 20; t++) {
      bus.tick(0.1);
      if (t % 3 === 0) bus.emitAttack(4, 2.5);
      sim.tick(0.1, map, 10.5, 2.5, bus);
    }
    expect(sim.hostiles[0]!.mode).toBe("chase");
    expect(sim.hostiles[0]!.x).toBeGreaterThan(3);
  });

  test("correr (run) atrae desde más lejos que walk", () => {
    const map = corridorMap();
    const sim = new HostileSim({ visionRange: 0, hearRange: 0, speed: 0 });
    sim.add("ear", 2.5, 2.5);
    const bus = new NoiseBus();
    // Distancia ~4.5: walk (r2.5) no alcanza; run (r6) sí
    bus.emitWalk(7, 2.5);
    sim.tick(0.05, map, 7, 2.5, bus);
    expect(sim.hostiles[0]!.mode).toBe("wander");
    bus.clear();
    bus.emitRun(7, 2.5);
    sim.tick(0.05, map, 7, 2.5, bus);
    expect(sim.hostiles[0]!.mode).toBe("investigate");
  });
});
