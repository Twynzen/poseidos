import { describe, expect, test } from "vitest";
import {
  createCharacterAnimator,
  setLocomotion,
  setAction,
  tickCharacterAnimator,
  currentRole,
  DEFAULT_ATTACK_DURATION,
  DEFAULT_HIT_DURATION,
} from "../src/render/characterAnimator";

describe("setLocomotion / currentRole", () => {
  test("idle por defecto", () => {
    const a = createCharacterAnimator();
    expect(currentRole(a)).toBe("idle");
    expect(a.locoRole).toBe("idle");
  });

  test("moving -> walk; sprinting -> run; stop -> idle", () => {
    const a = createCharacterAnimator();
    setLocomotion(a, { moving: true, sprinting: false });
    expect(currentRole(a)).toBe("walk");
    setLocomotion(a, { moving: true, sprinting: true });
    expect(currentRole(a)).toBe("run");
    setLocomotion(a, { moving: false, sprinting: true });
    expect(currentRole(a)).toBe("idle");
  });
});

describe("setAction + tick", () => {
  test("primary-attack pisa loco y vuelve a walk al expirar", () => {
    const a = createCharacterAnimator();
    setLocomotion(a, { moving: true, sprinting: false });
    expect(currentRole(a)).toBe("walk");
    setAction(a, "primary-attack", 0.2);
    expect(currentRole(a)).toBe("primary-attack");
    tickCharacterAnimator(a, 0.1);
    expect(currentRole(a)).toBe("primary-attack");
    tickCharacterAnimator(a, 0.15);
    expect(currentRole(a)).toBe("walk");
    expect(a.actionRole).toBeNull();
  });

  test("hit usa DEFAULT_HIT_DURATION", () => {
    const a = createCharacterAnimator();
    setAction(a, "hit");
    expect(a.actionRemaining).toBeCloseTo(DEFAULT_HIT_DURATION, 5);
    expect(currentRole(a)).toBe("hit");
  });

  test("attack default duration", () => {
    const a = createCharacterAnimator();
    setAction(a, "primary-attack");
    expect(a.actionRemaining).toBeCloseTo(DEFAULT_ATTACK_DURATION, 5);
  });

  test("death es sticky (no expira por tick)", () => {
    const a = createCharacterAnimator();
    setLocomotion(a, { moving: true, sprinting: true });
    setAction(a, "death");
    expect(currentRole(a)).toBe("death");
    tickCharacterAnimator(a, 10);
    expect(currentRole(a)).toBe("death");
    setLocomotion(a, { moving: false, sprinting: false });
    expect(currentRole(a)).toBe("death");
  });

  test("setAction null limpia one-shot", () => {
    const a = createCharacterAnimator();
    setAction(a, "hit", 1);
    setAction(a, null);
    expect(a.actionRole).toBeNull();
    expect(currentRole(a)).toBe("idle");
  });

  test("setAction idle/walk/run limpia one-shot y setea loco", () => {
    const a = createCharacterAnimator();
    setAction(a, "hit", 1);
    setAction(a, "run");
    expect(a.actionRole).toBeNull();
    expect(currentRole(a)).toBe("run");
  });

  test("tick acumula time; dt<=0 no avanza remaining", () => {
    const a = createCharacterAnimator();
    setAction(a, "hit", 1);
    tickCharacterAnimator(a, 0);
    expect(a.actionRemaining).toBe(1);
    tickCharacterAnimator(a, -1);
    expect(a.actionRemaining).toBe(1);
    tickCharacterAnimator(a, 0.25);
    expect(a.time).toBeCloseTo(0.25, 5);
    expect(a.actionRemaining).toBeCloseTo(0.75, 5);
  });
});
