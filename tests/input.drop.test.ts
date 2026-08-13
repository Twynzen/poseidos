/**
 * @vitest-environment happy-dom
 */

import { afterEach, describe, expect, test } from "vitest";
import { Input } from "../src/core/input";

function keydown(code: string, shiftKey = false): void {
  window.dispatchEvent(
    new KeyboardEvent("keydown", { code, shiftKey, bubbles: true }),
  );
}

function keyup(code: string): void {
  window.dispatchEvent(new KeyboardEvent("keyup", { code, bubbles: true }));
}

describe("consumeDrop", () => {
  let input: Input;

  afterEach(() => {
    input?.dispose();
  });

  test("KeyU without shift → { whole: false }", () => {
    input = new Input();
    keydown("KeyU");
    expect(input.consumeDrop()).toEqual({ whole: false });
  });

  test("KeyU with shiftKey true (no ShiftLeft in keys) → { whole: true }", () => {
    input = new Input();
    keydown("KeyU", true);
    expect(input.consumeDrop()).toEqual({ whole: true });
  });

  test("ShiftLeft held then KeyU (shiftKey false) → { whole: true }", () => {
    input = new Input();
    keydown("ShiftLeft");
    keydown("KeyU", false);
    expect(input.consumeDrop()).toEqual({ whole: true });
  });

  test("consumeDrop() twice: second is null", () => {
    input = new Input();
    keydown("KeyU");
    expect(input.consumeDrop()).toEqual({ whole: false });
    expect(input.consumeDrop()).toBeNull();
  });

  test("After consume, a later KeyU without shift is { whole: false }", () => {
    input = new Input();
    keydown("KeyU", true);
    expect(input.consumeDrop()).toEqual({ whole: true });
    keyup("KeyU");
    keydown("KeyU", false);
    expect(input.consumeDrop()).toEqual({ whole: false });
  });
});
