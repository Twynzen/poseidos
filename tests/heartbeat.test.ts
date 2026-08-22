import { describe, expect, test } from "vitest";
import {
  HEARTBEAT_HP_RATIO,
  heartbeatIntervalSec,
  createHeartbeatBus,
  tickHeartbeat,
} from "../src/audio/heartbeat";

describe("HEARTBEAT_HP_RATIO", () => {
  test("umbral 0.35", () => {
    expect(HEARTBEAT_HP_RATIO).toBe(0.35);
  });
});

describe("heartbeatIntervalSec", () => {
  test("hp ≤ 0 → null", () => {
    expect(heartbeatIntervalSec(0)).toBeNull();
    expect(heartbeatIntervalSec(-1)).toBeNull();
  });

  test("ratio ≥ 0.35 → null", () => {
    expect(heartbeatIntervalSec(35)).toBeNull();
    expect(heartbeatIntervalSec(35.0001)).toBeNull();
    expect(heartbeatIntervalSec(50)).toBeNull();
    expect(heartbeatIntervalSec(100)).toBeNull();
  });

  test("hp / maxHp no finito o max ≤ 0 → null", () => {
    expect(heartbeatIntervalSec(NaN)).toBeNull();
    expect(heartbeatIntervalSec(10, 0)).toBeNull();
    expect(heartbeatIntervalSec(10, -100)).toBeNull();
    expect(heartbeatIntervalSec(10, Infinity)).toBeNull();
  });

  test("ratio < 0.35 → lerp 1.2s (umbral) → 0.45s (cerca de 0)", () => {
    const nearThreshold = heartbeatIntervalSec(34.999);
    expect(nearThreshold).not.toBeNull();
    expect(nearThreshold!).toBeCloseTo(1.2, 2);

    const nearDeath = heartbeatIntervalSec(0.001);
    expect(nearDeath).not.toBeNull();
    expect(nearDeath!).toBeCloseTo(0.45, 2);

    const mid = heartbeatIntervalSec(17.5);
    expect(mid).not.toBeNull();
    expect(mid!).toBeCloseTo(0.825, 5);
  });

  test("respeta maxHp al calcular ratio", () => {
    expect(heartbeatIntervalSec(20, 40)).toBeNull();
    const low = heartbeatIntervalSec(7, 40);
    expect(low).not.toBeNull();
    const t = 7 / 40 / HEARTBEAT_HP_RATIO;
    expect(low!).toBeCloseTo(0.45 + (1.2 - 0.45) * t, 8);
  });
});

describe("tickHeartbeat", () => {
  test("HP alto o muerto → no beat; resetea acc", () => {
    const bus = createHeartbeatBus();
    bus.acc = 0.9;
    expect(tickHeartbeat(bus, 100, 0.5)).toEqual({ beat: false });
    expect(bus.acc).toBe(0);

    bus.acc = 0.9;
    expect(tickHeartbeat(bus, 0, 0.5)).toEqual({ beat: false });
    expect(bus.acc).toBe(0);
  });

  test("HAS MUERTO / freeze: HP 0 no emite beat (acc stale + dt largo)", () => {
    const bus = createHeartbeatBus();
    const lowInterval = heartbeatIntervalSec(20)!;
    tickHeartbeat(bus, 20, lowInterval);
    expect(bus.acc).toBeGreaterThanOrEqual(0);

    bus.acc = 10;
    expect(tickHeartbeat(bus, 0, 5)).toEqual({ beat: false });
    expect(bus.acc).toBe(0);
    expect(tickHeartbeat(bus, 0, 1.2)).toEqual({ beat: false });
    expect(tickHeartbeat(bus, 0, lowInterval)).toEqual({ beat: false });
  });

  test("HP bajo: no beat hasta acumular el intervalo", () => {
    const bus = createHeartbeatBus();
    const interval = heartbeatIntervalSec(17.5)!;
    expect(tickHeartbeat(bus, 17.5, interval * 0.5)).toEqual({ beat: false });
    expect(bus.acc).toBeCloseTo(interval * 0.5, 8);

    expect(tickHeartbeat(bus, 17.5, interval * 0.5)).toEqual({ beat: true });
    expect(bus.acc).toBeCloseTo(0, 8);
  });

  test("dt negativo o inválido no adelanta", () => {
    const bus = createHeartbeatBus();
    expect(tickHeartbeat(bus, 10, -1)).toEqual({ beat: false });
    expect(bus.acc).toBe(0);
    expect(tickHeartbeat(bus, 10, NaN)).toEqual({ beat: false });
    expect(bus.acc).toBe(0);
  });

  test("recupera HP ≥ umbral → corta el ritmo", () => {
    const bus = createHeartbeatBus();
    tickHeartbeat(bus, 10, 0.4);
    expect(bus.acc).toBeGreaterThan(0);
    expect(tickHeartbeat(bus, 80, 0.1)).toEqual({ beat: false });
    expect(bus.acc).toBe(0);
  });
});
