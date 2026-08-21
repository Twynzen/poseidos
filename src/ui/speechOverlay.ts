/**
 * Bubbles HTML sobre poseídos (proyección cámara → pantalla).
 * La simulación de habla vive en possession/speech (headless).
 */

import * as THREE from "three";
import type { PossessionTone } from "../possession";

export interface SpeechBubbleView {
  id: string;
  /** Mundo X/Z (tile). */
  x: number;
  y: number;
  line: string | null;
  tone: PossessionTone | null;
  /** Solo si el mesh del poseído está en FOV. */
  visible: boolean;
}

/**
 * HAS MUERTO / F9 load-muerto: no pintar utterance encima.
 * Vivo (incl. F9 load-vivo): FOV + línea activa, igual que hoy.
 * Ya vacío (sin activa) = hidden; gameOver no inventa burbuja.
 */
export function speechBubbleVisible(
  gameOver: boolean,
  inFov: boolean,
  hasActive: boolean,
): boolean {
  if (gameOver) return false;
  return inFov && hasActive;
}

const TONE_CLASS: Record<PossessionTone, string> = {
  lucidez: "tone-lucidez",
  demonio: "tone-demonio",
  ruega: "tone-ruega",
};

export interface SpeechOverlay {
  sync(
    bubbles: ReadonlyArray<SpeechBubbleView>,
    camera: THREE.Camera,
    canvas: HTMLElement,
  ): void;
  dispose(): void;
}

export function createSpeechOverlay(layer: HTMLElement): SpeechOverlay {
  const nodes = new Map<string, HTMLDivElement>();
  const tmp = new THREE.Vector3();

  function ensure(id: string): HTMLDivElement {
    let el = nodes.get(id);
    if (el) return el;
    el = document.createElement("div");
    el.className = "speech-bubble";
    el.dataset.id = id;
    layer.appendChild(el);
    nodes.set(id, el);
    return el;
  }

  return {
    sync(bubbles, camera, canvas) {
      const seen = new Set<string>();
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      for (const b of bubbles) {
        seen.add(b.id);
        const el = ensure(b.id);
        const show = b.visible && !!b.line;
        if (!show) {
          el.style.display = "none";
          continue;
        }
        // Encima de la cabeza (~1.9m)
        tmp.set(b.x, 1.95, b.y);
        tmp.project(camera);
        if (tmp.z > 1) {
          el.style.display = "none";
          continue;
        }
        const left = (tmp.x * 0.5 + 0.5) * w;
        const top = (-tmp.y * 0.5 + 0.5) * h;
        el.style.display = "block";
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.textContent = b.line;
        el.className = `speech-bubble ${b.tone ? TONE_CLASS[b.tone] : ""}`;
      }
      for (const [id, el] of nodes) {
        if (!seen.has(id)) {
          el.remove();
          nodes.delete(id);
        }
      }
    },
    dispose() {
      for (const el of nodes.values()) el.remove();
      nodes.clear();
    },
  };
}
