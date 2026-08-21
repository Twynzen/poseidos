/**
 * @vitest-environment happy-dom
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { afterEach, describe, expect, test } from "vitest";
import { loadAliveRuntime, SPAWN_GRACE_SECONDS } from "../src/ai";
import { SpeechDirector } from "../src/possession";
import {
  createSpeechOverlay,
  speechBubbleVisible,
} from "../src/ui/speechOverlay";

describe("speech bubble CSS", () => {
  test(".speech-bubble max-width 280px and font 14px", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toMatch(/\.speech-bubble\s*\{[^}]*max-width:\s*280px/s);
    expect(html).toMatch(/\.speech-bubble\s*\{[^}]*font:\s*14px\/1\.4/s);
  });
});

describe("speechBubbleVisible (HAS MUERTO / F9 load-muerto)", () => {
  test("muerte con burbuja activa: overlay hidden; ya vacío no-op; load-muerto hidden; vivo/load-vivo pinta", () => {
    const speech = new SpeechDirector({}, () => 0.2);
    speech.forceSpeak("poss-a", "lucidez", "ayuda");
    expect(speech.getActive("poss-a")?.line).toBe("ayuda");

    const deadOpen = speechBubbleVisible(
      true,
      true,
      !!speech.getActive("poss-a"),
    );
    expect(deadOpen).toBe(false);

    const alreadyEmpty = speechBubbleVisible(true, true, false);
    expect(alreadyEmpty).toBe(false);
    expect(speechBubbleVisible(true, false, false)).toBe(false);

    const deadRt = loadAliveRuntime(false);
    expect(deadRt.gameOver).toBe(true);
    expect(deadRt.deathClip).toBe(true);
    expect(deadRt.spawnGrace).toBe(0);
    const loadDead = speechBubbleVisible(
      deadRt.gameOver,
      true,
      !!speech.getActive("poss-a"),
    );
    expect(loadDead).toBe(false);
    expect(
      speechBubbleVisible(deadRt.gameOver, true, false),
    ).toBe(false);

    const liveRt = loadAliveRuntime(true);
    expect(liveRt.gameOver).toBe(false);
    expect(liveRt.deathClip).toBe(false);
    expect(liveRt.spawnGrace).toBe(SPAWN_GRACE_SECONDS);
    const loadAlive = speechBubbleVisible(
      liveRt.gameOver,
      true,
      !!speech.getActive("poss-a"),
    );
    expect(loadAlive).toBe(true);

    expect(speechBubbleVisible(false, true, true)).toBe(true);
    expect(speechBubbleVisible(false, false, true)).toBe(false);
    expect(speechBubbleVisible(false, true, false)).toBe(false);
  });

  test("Game syncSpeechOverlay usa speechBubbleVisible(gameOver); freeze y F9 load-muerto siguen sync", () => {
    const src = readFileSync(resolve(process.cwd(), "src/core/game.ts"), "utf8");
    expect(src).toContain("speechBubbleVisible(");
    expect(src).toMatch(
      /syncSpeechOverlay\(\): void \{[\s\S]{0,500}speechBubbleVisible\(\s*this\.gameOver/,
    );
    expect(src).not.toMatch(
      /syncSpeechOverlay\(\): void \{[\s\S]{0,500}visible:\s*inFov\s*&&\s*!!active/,
    );
    expect(src).toMatch(
      /refreshViewAfterLoad\(\): void \{[\s\S]{0,400}this\.syncSpeechOverlay\(\)/,
    );
    expect(src).toMatch(
      /this\.syncSpeechOverlay\(\);\s*this\.syncDialoguePanel\(\);[\s\S]{0,80}this\.hudAcc \+= dt/,
    );
    expect(src).toMatch(
      /if \(!this\.player\.alive\) \{[\s\S]{0,200}enterGameOver\(\)[\s\S]{0,280}this\.syncSpeechOverlay\(\)/,
    );
    expect(src).toMatch(
      /doLoad\(\): boolean \{[\s\S]{0,900}loadAliveRuntime[\s\S]{0,400}if \(loaded\.gameOver\) \{[\s\S]{0,80}this\.closeDialogueOnGameOver\(\)[\s\S]{0,200}refreshViewAfterLoad/,
    );
  });
});

describe("speech overlay hide (muerte / F9 load-muerto)", () => {
  let layer: HTMLElement;

  afterEach(() => {
    layer?.remove();
  });

  test("sync visible false oculta burbuja activa; ya oculto sigue oculto", () => {
    layer = document.createElement("div");
    document.body.appendChild(layer);
    const overlay = createSpeechOverlay(layer);
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
    const canvas = document.createElement("div");
    Object.defineProperties(canvas, {
      clientWidth: { value: 800 },
      clientHeight: { value: 600 },
    });

    overlay.sync(
      [
        {
          id: "poss-a",
          x: 0,
          y: 0,
          line: "ayuda",
          tone: "lucidez",
          visible: false,
        },
      ],
      camera,
      canvas,
    );
    const el = layer.querySelector<HTMLElement>(".speech-bubble");
    expect(el).toBeTruthy();
    expect(el!.style.display).toBe("none");
    expect(el!.textContent).not.toBe("ayuda");

    overlay.sync(
      [
        {
          id: "poss-a",
          x: 0,
          y: 0,
          line: "ayuda",
          tone: "lucidez",
          visible: false,
        },
      ],
      camera,
      canvas,
    );
    expect(el!.style.display).toBe("none");
    overlay.dispose();
  });
});
