import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test, afterEach, vi } from "vitest";
import { Group } from "three";
import {
  GLB_MAGIC,
  canLoadGltfInThisEnv,
  hasGlbMagic,
  isUsableGlbResponse,
  loadCharacterGltf,
  maybeAttachCharacterGltf,
} from "../src/render/characterGltf";

const parseAsync = vi.fn(async () => {
  throw new Error("GLTFLoader.parseAsync must not run on a rejected body");
});

vi.mock("three/addons/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    parseAsync(...args: unknown[]) {
      return parseAsync(...args);
    }
  },
}));
import {
  DEFAULT_PLACEHOLDER_MANIFEST,
  PLAYER_SOLDIER_MANIFEST,
  PLAYER_SURVIVOR_MANIFEST,
  playerManifestCandidates,
} from "../src/render/characterManifest";

function glbBytes(): Uint8Array {
  return new Uint8Array([
    GLB_MAGIC[0],
    GLB_MAGIC[1],
    GLB_MAGIC[2],
    GLB_MAGIC[3],
    2,
    0,
    0,
    0,
  ]);
}

function htmlBytes(): Uint8Array {
  return new TextEncoder().encode(
    "<!DOCTYPE html><html><head></head><body>vite spa</body></html>",
  );
}

function res(
  contentType: string | null,
  ok = true,
): { ok: boolean; headers: Headers } {
  const headers = new Headers();
  if (contentType !== null) headers.set("content-type", contentType);
  return { ok, headers };
}

describe("GLB_MAGIC / hasGlbMagic", () => {
  test("magic is ASCII glTF", () => {
    expect(GLB_MAGIC).toEqual([0x67, 0x6c, 0x54, 0x46]);
    expect(String.fromCharCode(...GLB_MAGIC)).toBe("glTF");
  });

  test("true only when first 4 bytes are glTF", () => {
    expect(hasGlbMagic(glbBytes())).toBe(true);
    expect(hasGlbMagic(htmlBytes())).toBe(false);
    expect(hasGlbMagic(new Uint8Array([0x67, 0x6c, 0x54]))).toBe(false);
    expect(hasGlbMagic(new ArrayBuffer(0))).toBe(false);
  });
});

describe("isUsableGlbResponse", () => {
  test("rejects text/html (Vite SPA index.html fallback)", () => {
    expect(isUsableGlbResponse(res("text/html"), htmlBytes())).toBe(false);
    expect(
      isUsableGlbResponse(res("text/html; charset=utf-8"), htmlBytes()),
    ).toBe(false);
    expect(isUsableGlbResponse(res("text/html"), glbBytes())).toBe(false);
  });

  test("rejects any text/* even with glTF magic", () => {
    expect(isUsableGlbResponse(res("text/plain"), glbBytes())).toBe(false);
    expect(isUsableGlbResponse(res("text/css"), glbBytes())).toBe(false);
  });

  test("model/gltf-binary and octet-stream accept only with magic", () => {
    expect(isUsableGlbResponse(res("model/gltf-binary"), glbBytes())).toBe(
      true,
    );
    expect(
      isUsableGlbResponse(res("application/octet-stream"), glbBytes()),
    ).toBe(true);
    expect(isUsableGlbResponse(res("model/gltf-binary"), htmlBytes())).toBe(
      false,
    );
    expect(
      isUsableGlbResponse(res("application/octet-stream"), htmlBytes()),
    ).toBe(false);
  });

  test("expected types never override missing magic", () => {
    const empty = new Uint8Array(0);
    expect(isUsableGlbResponse(res("model/gltf-binary"), empty)).toBe(false);
    expect(isUsableGlbResponse(res("application/octet-stream"), empty)).toBe(
      false,
    );
  });

  test("missing content-type still requires magic", () => {
    expect(isUsableGlbResponse(res(null), glbBytes())).toBe(true);
    expect(isUsableGlbResponse(res(null), htmlBytes())).toBe(false);
  });

  test("!ok is never usable", () => {
    expect(isUsableGlbResponse(res("model/gltf-binary", false), glbBytes())).toBe(
      false,
    );
  });
});

describe("Soldier.glb on disk", () => {
  test("working player mesh starts with glTF magic", () => {
    const buf = readFileSync(resolve("public/models/Soldier.glb"));
    expect(hasGlbMagic(buf)).toBe(true);
    expect(
      isUsableGlbResponse(res("model/gltf-binary"), buf),
    ).toBe(true);
  });
});

describe("canLoadGltfInThisEnv / loadCharacterGltf", () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
    parseAsync.mockClear();
  });

  test("headless node: no window => cannot load", () => {
    expect(canLoadGltfInThisEnv()).toBe(false);
  });

  test("empty url => null", async () => {
    expect(await loadCharacterGltf("")).toBeNull();
    expect(await loadCharacterGltf("   ")).toBeNull();
  });

  test("headless: Survivor url returns null (no parse)", async () => {
    expect(await loadCharacterGltf(PLAYER_SURVIVOR_MANIFEST.url)).toBeNull();
  });

  test("200 text/html Survivor.glb is not parsed; returns null", async () => {
    (globalThis as { window?: unknown }).window = {};
    const prevFetch = globalThis.fetch;
    let fetched = false;
    globalThis.fetch = (async () => {
      fetched = true;
      return new Response(htmlBytes(), {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    }) as typeof fetch;
    try {
      expect(canLoadGltfInThisEnv()).toBe(true);
      const loaded = await loadCharacterGltf(PLAYER_SURVIVOR_MANIFEST.url);
      expect(fetched).toBe(true);
      expect(parseAsync).not.toHaveBeenCalled();
      expect(loaded).toBeNull();
    } finally {
      globalThis.fetch = prevFetch;
    }
  });

  test("missing Survivor (HTML) => null so candidate loop reaches Soldier", async () => {
    (globalThis as { window?: unknown }).window = {};
    const prevFetch = globalThis.fetch;
    const seen: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      seen.push(url);
      if (url.includes("Survivor.glb")) {
        return new Response(htmlBytes(), {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      return new Response("not found", {
        status: 404,
        headers: { "content-type": "text/plain" },
      });
    }) as typeof fetch;
    try {
      const candidates = playerManifestCandidates();
      expect(candidates[0]).toBe(PLAYER_SURVIVOR_MANIFEST);
      expect(candidates[1]).toBe(PLAYER_SOLDIER_MANIFEST);
      const first = await loadCharacterGltf(candidates[0]!.url);
      expect(first).toBeNull();
      const second = await loadCharacterGltf(candidates[1]!.url);
      expect(second).toBeNull();
      expect(seen[0]).toContain("Survivor.glb");
      expect(seen[1]).toContain("Soldier.glb");
      expect(parseAsync).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = prevFetch;
    }
  });

  test("usable GLB (magic + gltf-binary) reaches parseAsync", async () => {
    (globalThis as { window?: unknown }).window = {};
    const prevFetch = globalThis.fetch;
    const scene = new Group();
    parseAsync.mockResolvedValueOnce({ scene, animations: [] });
    globalThis.fetch = (async () =>
      new Response(glbBytes(), {
        status: 200,
        headers: { "content-type": "model/gltf-binary" },
      })) as typeof fetch;
    try {
      const loaded = await loadCharacterGltf(PLAYER_SOLDIER_MANIFEST.url);
      expect(parseAsync).toHaveBeenCalledTimes(1);
      expect(loaded).not.toBeNull();
      expect(loaded!.scene).toBe(scene);
      expect(loaded!.clipNames).toEqual([]);
    } finally {
      globalThis.fetch = prevFetch;
    }
  });
});

describe("maybeAttachCharacterGltf", () => {
  test("placeholder manifest => null (no fetch)", async () => {
    const parent = new Group();
    const loaded = await maybeAttachCharacterGltf(DEFAULT_PLACEHOLDER_MANIFEST, {
      parent,
    });
    expect(loaded).toBeNull();
    expect(parent.children.length).toBe(0);
  });
});
