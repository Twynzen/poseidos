import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
  LOADING_LINES,
  createLoadingProgress,
  loadingLineAfterRestart,
} from "../src/ui/loadingScreen";

describe("loading overlay CSS", () => {
  test(".loading-title font-size 22px", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toMatch(/\.loading-title\s*\{[^}]*font-size:\s*22px/s);
  });
});

describe("LOADING_LINES", () => {
  test("banco no vacío, strings no vacíos (6–8+)", () => {
    expect(LOADING_LINES.length).toBeGreaterThanOrEqual(6);
    for (const line of LOADING_LINES) {
      expect(typeof line).toBe("string");
      expect(line.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("createLoadingProgress", () => {
  test("advance llega a done en total pasos", () => {
    const p = createLoadingProgress(4);
    expect(p.isDone).toBe(false);
    expect(p.step).toBe(0);
    expect(p.total).toBe(4);
    for (let i = 0; i < 4; i++) p.advance();
    expect(p.step).toBe(4);
    expect(p.isDone).toBe(true);
  });

  test("skip marca done inmediato", () => {
    const p = createLoadingProgress(8);
    p.skip();
    expect(p.isDone).toBe(true);
    expect(p.step).toBe(8);
  });

  test("label incluye índice o total", () => {
    const p = createLoadingProgress(6);
    p.advance();
    const lbl = p.label();
    expect(lbl).toMatch(/1\/6/);
    expect(lbl.includes(p.line)).toBe(true);
    expect(lbl.length).toBeGreaterThan(p.line.length);
  });

  test("advance no rompe tras done", () => {
    const p = createLoadingProgress(2);
    p.advance();
    p.advance();
    expect(p.isDone).toBe(true);
    const step = p.step;
    const line = p.line;
    p.advance();
    p.advance();
    expect(p.isDone).toBe(true);
    expect(p.step).toBe(step);
    expect(p.line).toBe(line);
  });

  test("default total = LOADING_LINES.length", () => {
    const p = createLoadingProgress();
    expect(p.total).toBe(LOADING_LINES.length);
  });
});

describe("loadingLineAfterRestart (R / softReset)", () => {
  test("reinicio → null; leftover Despertando… no filtra", () => {
    expect(loadingLineAfterRestart()).toBeNull();
    expect(LOADING_LINES).toContain("Despertando sombras en los callejones…");
    expect(loadingLineAfterRestart()).not.toBe(
      "Despertando sombras en los callejones…",
    );

    let current: string | null = "Despertando sombras en los callejones…";
    expect(current).not.toBeNull();
    current = loadingLineAfterRestart();
    expect(current).toBeNull();
    expect(current).not.toBe("Despertando sombras en los callejones…");

    const splash = createLoadingProgress();
    splash.skip();
    expect(splash.line).not.toBe(loadingLineAfterRestart());
    expect(splash.label()).not.toBe(loadingLineAfterRestart());
  });

  test("Game softReset no pinta línea de splash; F9/enterGameOver tampoco", () => {
    const gameSrc = readFileSync(
      resolve(process.cwd(), "src/core/game.ts"),
      "utf8",
    );
    expect(gameSrc).not.toContain("loadingLineAfterRestart(");
    expect(gameSrc).not.toContain("createLoadingProgress(");
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}Despertando/,
    );
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}LOADING_LINES/,
    );
    expect(gameSrc).not.toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,2800}Despertando/,
    );
    expect(gameSrc).not.toMatch(
      /enterGameOver\(\): void \{[\s\S]{0,2400}Despertando/,
    );
    expect(gameSrc).not.toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,2400}Despertando/,
    );
    expect(gameSrc).not.toMatch(
      /softReset\(\): void \{[\s\S]{0,4200}this\.showHelp\s*=/,
    );
  });
});
