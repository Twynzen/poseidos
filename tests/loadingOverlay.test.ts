/**
 * @vitest-environment happy-dom
 */

import { describe, expect, test } from "vitest";
import { createLoadingOverlay } from "../src/ui/loadingOverlay";

describe("createLoadingOverlay dismiss", () => {
  test("mount visible; dismiss oculta (hidden + loading-dismissed)", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const overlay = createLoadingOverlay();
    overlay.mount(root);
    const el = document.getElementById("loading-overlay");
    expect(el).not.toBeNull();
    expect(overlay.isVisible).toBe(true);
    expect(el!.hidden).toBe(false);

    overlay.dismiss();
    expect(overlay.isVisible).toBe(false);
    expect(el!.hidden).toBe(true);
    expect(el!.classList.contains("loading-dismissed")).toBe(true);

    overlay.dispose();
    expect(document.getElementById("loading-overlay")).toBeNull();
    root.remove();
  });

  test("dismiss + dispose no deja el modal en el DOM", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const overlay = createLoadingOverlay();
    overlay.mount(root);
    overlay.dismiss();
    overlay.dispose();
    expect(overlay.isVisible).toBe(false);
    expect(root.querySelector("#loading-overlay")).toBeNull();
    root.remove();
  });
});
