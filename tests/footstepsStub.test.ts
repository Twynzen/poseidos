import { describe, expect, test } from "vitest";
import {
  createFootstepsBus,
  tickFootsteps,
  footstepsLevel,
  footstepsTarget,
  describeFootsteps,
  type FootstepsState,
} from "../src/audio/footstepsStub";

function settle(
  bus: ReturnType<typeof createFootstepsBus>,
  state: FootstepsState,
  seconds = 0.5,
): void {
  const steps = 10;
  const dt = seconds / steps;
  for (let i = 0; i < steps; i++) tickFootsteps(bus, state, dt);
}

describe("footstepsTarget", () => {
  test("sin movimiento → 0", () => {
    expect(footstepsTarget({ moved: 0 })).toBe(0);
  });

  test("con movimiento → > 0; sprint ≥ walk", () => {
    const walk = footstepsTarget({ moved: 0.1 });
    const sprint = footstepsTarget({ moved: 0.1, sprint: true });
    expect(walk).toBeGreaterThan(0.3);
    expect(sprint).toBeGreaterThanOrEqual(walk);
  });
});

describe("tickFootsteps / footstepsLevel", () => {
  test("movimiento → level alto; quieto → decae", () => {
    const bus = createFootstepsBus();
    settle(bus, { moved: 0.12 });
    expect(footstepsLevel(bus)).toBeGreaterThan(0.3);

    settle(bus, { moved: 0 }, 1);
    expect(footstepsLevel(bus)).toBeLessThan(0.05);
  });

  test("muted → level 0 y describe null", () => {
    const bus = createFootstepsBus();
    settle(bus, { moved: 0.15 });
    expect(footstepsLevel(bus)).toBeGreaterThan(0.2);
    expect(describeFootsteps(bus)).toBe("pisadas");

    bus.muted = true;
    expect(footstepsLevel(bus)).toBe(0);
    expect(describeFootsteps(bus)).toBeNull();
  });

  test("state.muted sincroniza el bus", () => {
    const bus = createFootstepsBus();
    tickFootsteps(bus, { moved: 0.1, muted: true }, 0.1);
    expect(bus.muted).toBe(true);
    expect(footstepsLevel(bus)).toBe(0);
    tickFootsteps(bus, { moved: 0.1, muted: false }, 0.1);
    expect(bus.muted).toBe(false);
  });

  test("tick es determinista", () => {
    const s: FootstepsState = { moved: 0.08, sprint: true };
    const a = createFootstepsBus();
    const b = createFootstepsBus();
    for (let i = 0; i < 12; i++) {
      tickFootsteps(a, s, 0.05);
      tickFootsteps(b, s, 0.05);
    }
    expect(footstepsLevel(a)).toEqual(footstepsLevel(b));
    expect(a.phase).toEqual(b.phase);
  });

  test('describeFootsteps: "pisadas" / null', () => {
    const moving = createFootstepsBus();
    settle(moving, { moved: 0.1 });
    expect(describeFootsteps(moving)).toBe("pisadas");

    const still = createFootstepsBus();
    settle(still, { moved: 0 });
    expect(describeFootsteps(still)).toBeNull();
  });
});
