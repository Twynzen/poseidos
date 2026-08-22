/**
 * @vitest-environment happy-dom
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { meleeInputApplies } from "../src/combat";
import {
  bootSkipSpaceRestarts,
  createLoadingOverlay,
  dismissBootSplash,
  loadingOverlayVisibleAfterRestart,
} from "../src/ui/loadingOverlay";

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

describe("dismissBootSplash + loadingOverlayVisibleAfterRestart (R / softReset)", () => {
  test("dismissBootSplash = dismiss+dispose; leftover visible no filtra", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const overlay = createLoadingOverlay();
    overlay.mount(root);
    expect(overlay.isVisible).toBe(true);
    expect(document.getElementById("loading-overlay")).not.toBeNull();

    dismissBootSplash(overlay);
    expect(overlay.isVisible).toBe(false);
    expect(overlay.isVisible).toBe(loadingOverlayVisibleAfterRestart());
    expect(root.querySelector("#loading-overlay")).toBeNull();
    expect(document.getElementById("loading-overlay")).toBeNull();
    root.remove();
  });

  test("R / leftover visible → helper false; no remount", () => {
    expect(loadingOverlayVisibleAfterRestart()).toBe(false);

    let visible = true;
    expect(visible).not.toBe(false);
    visible = loadingOverlayVisibleAfterRestart();
    expect(visible).toBe(false);
    expect(visible).not.toBe(true);

    const leftover = createLoadingOverlay();
    const root = document.createElement("div");
    document.body.appendChild(root);
    leftover.mount(root);
    expect(leftover.isVisible).not.toBe(loadingOverlayVisibleAfterRestart());
    leftover.dismiss();
    leftover.dispose();
    expect(leftover.isVisible).toBe(loadingOverlayVisibleAfterRestart());
    expect(root.querySelector("#loading-overlay")).toBeNull();
    root.remove();
  });

  test("skip Space no es restart; freeze Space no es melee", () => {
    expect(bootSkipSpaceRestarts()).toBe(false);
    expect(meleeInputApplies(true)).toBe(false);
    expect(meleeInputApplies(false)).toBe(true);

    let restarts = true;
    restarts = bootSkipSpaceRestarts();
    expect(restarts).toBe(false);
    expect(restarts).not.toBe(true);
  });

  test("main.ts dismiss+start; Game.start endFrame; softReset no remount; freeze drena Space", () => {
    const mainSrc = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
    expect(mainSrc).toContain("dismissBootSplash(");
    expect(mainSrc).toMatch(
      /dismissBootSplash\(overlay\);[\s\S]{0,200}game\.start\(\)/,
    );
    expect(mainSrc).toMatch(
      /e\.code === "Space"[\s\S]{0,200}finishLoading\(\)/,
    );
    expect(mainSrc).not.toMatch(/softReset/);
    expect(mainSrc).not.toMatch(/consumeRestOrRestart/);
    expect(mainSrc).not.toMatch(/consumeAttack/);
    expect(mainSrc).not.toMatch(/createLoadingOverlay\(\)[\s\S]*createLoadingOverlay\(\)/);

    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).toMatch(
      /start\(\): void \{[\s\S]{0,200}this\.input\.endFrame\(\)/,
    );
    expect(gameSrc).not.toMatch(
      /start\(\): void \{[\s\S]{0,200}softReset/,
    );
    expect(gameSrc).not.toMatch(
      /start\(\): void \{[\s\S]{0,200}createLoadingOverlay/,
    );
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}createLoadingOverlay/,
    );
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}createLoadingProgress/,
    );
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}dismissBootSplash/,
    );
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}loading-overlay/,
    );
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}Despertando/,
    );
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}overlay\.mount/,
    );
    expect(gameSrc).not.toContain("createLoadingOverlay(");
    expect(gameSrc).not.toContain("createLoadingProgress(");
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2600}consumeAttack\(\)/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,2600}tryMelee/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeRestOrRestart\(\)/,
    );
    expect(gameSrc).toMatch(
      /consumeRestOrRestart\(\)\) \{\s*this\.softReset\(\);/,
    );
    expect(gameSrc).not.toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute[\s\S]{0,80}showHelp\s*=/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3600}consumeMute\(\)[\s\S]{0,200}toggleAmbientMute/,
    );
    expect(gameSrc).toMatch(
      /if \(this\.gameOver \|\| !this\.player\.alive\) \{[\s\S]{0,3200}consumeLoad\(\)/,
    );
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}this\.showHelp\s*=/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}createLoadingOverlay/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}createLoadingOverlay/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}createLoadingOverlay/,
    );
  });
});
