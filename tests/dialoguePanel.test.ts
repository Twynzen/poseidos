import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

describe("dialogue panel CSS", () => {
  test("#dialogue-panel font 13.5px", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toMatch(/#dialogue-panel\s*\{[^}]*font:\s*13\.5px\/1\.5/s);
  });
});
