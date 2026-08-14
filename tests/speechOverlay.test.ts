import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

describe("speech bubble CSS", () => {
  test(".speech-bubble max-width 280px and font 14px", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toMatch(/\.speech-bubble\s*\{[^}]*max-width:\s*280px/s);
    expect(html).toMatch(/\.speech-bubble\s*\{[^}]*font:\s*14px\/1\.4/s);
  });
});
