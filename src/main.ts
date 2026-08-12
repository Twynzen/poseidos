import { Game } from "./core/game";
import {
  createLoadingOverlay,
  createLoadingProgress,
} from "./ui";

const root = document.querySelector("#app");
if (!(root instanceof HTMLElement)) {
  throw new Error("#app no encontrado");
}

const game = new Game(root);

/** Loading diegético: overlay encima; el juego arranca en paralelo. */
const progress = createLoadingProgress();
const overlay = createLoadingOverlay();
overlay.mount(root);
overlay.setProgress(progress.label(), 0);

const LOAD_MS_MIN = 1200;
const LOAD_MS_MAX = 2500;
const loadDurationMs =
  LOAD_MS_MIN + Math.random() * (LOAD_MS_MAX - LOAD_MS_MIN);
const startedAt = performance.now();
let finished = false;

function syncOverlay(): void {
  const frac =
    progress.total <= 0 ? 1 : Math.min(1, progress.step / progress.total);
  overlay.setProgress(progress.label(), frac);
}

function finishLoading(): void {
  if (finished) return;
  finished = true;
  window.removeEventListener("keydown", onKeySkip);
  overlayEl?.removeEventListener("click", onClickSkip);
  overlay.dismiss();
  overlay.dispose();
}

function onKeySkip(e: KeyboardEvent): void {
  if (finished) return;
  if (e.code === "Space" || e.code === "Enter" || e.code === "Escape") {
    e.preventDefault();
    progress.skip();
    syncOverlay();
    finishLoading();
  }
}

function onClickSkip(): void {
  if (finished) return;
  progress.skip();
  syncOverlay();
  finishLoading();
}

const overlayEl = document.getElementById("loading-overlay");
overlayEl?.addEventListener("click", onClickSkip);
window.addEventListener("keydown", onKeySkip);

game.start();

function tickLoad(now: number): void {
  if (finished) return;
  const elapsed = now - startedAt;
  const targetStep = Math.min(
    progress.total,
    Math.floor((elapsed / loadDurationMs) * progress.total) + 1,
  );
  while (progress.step < targetStep && !progress.isDone) {
    progress.advance(now);
  }
  syncOverlay();
  if (progress.isDone || elapsed >= loadDurationMs) {
    if (!progress.isDone) progress.skip();
    syncOverlay();
    finishLoading();
    return;
  }
  requestAnimationFrame(tickLoad);
}

requestAnimationFrame(tickLoad);

window.addEventListener("beforeunload", () => game.dispose());
