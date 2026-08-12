/**
 * Overlay fullscreen de loading diegético (glass-dark, tipografía mono HUD).
 * Solo DOM; el progreso viene de loadingScreen.
 */

export interface LoadingOverlay {
  mount(parent: HTMLElement): void;
  setProgress(label: string, fraction: number): void;
  dismiss(): void;
  readonly isVisible: boolean;
  dispose(): void;
}

/**
 * Crea el overlay `#loading-overlay` (título Poseídos + línea + hint skip).
 */
export function createLoadingOverlay(): LoadingOverlay {
  const el = document.createElement("div");
  el.id = "loading-overlay";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.setAttribute("aria-label", "Cargando Poseídos");

  const card = document.createElement("div");
  card.className = "loading-card";

  const title = document.createElement("div");
  title.className = "loading-title";
  title.textContent = "Poseídos";

  const lineEl = document.createElement("div");
  lineEl.className = "loading-line";
  lineEl.textContent = "Preparando el barrio…";

  const barTrack = document.createElement("div");
  barTrack.className = "loading-bar-track";
  const barFill = document.createElement("div");
  barFill.className = "loading-bar-fill";
  barFill.style.width = "0%";
  barTrack.appendChild(barFill);

  const hint = document.createElement("div");
  hint.className = "loading-hint";
  hint.textContent = "clic o Espacio para saltar";

  card.append(title, lineEl, barTrack, hint);
  el.appendChild(card);

  let visible = false;
  let mounted = false;

  return {
    mount(parent) {
      if (mounted) return;
      parent.appendChild(el);
      mounted = true;
      visible = true;
      el.hidden = false;
    },
    setProgress(label, fraction) {
      lineEl.textContent = label;
      const pct = Math.max(0, Math.min(1, fraction)) * 100;
      barFill.style.width = `${pct.toFixed(1)}%`;
    },
    dismiss() {
      visible = false;
      el.hidden = true;
      el.classList.add("loading-dismissed");
    },
    get isVisible() {
      return visible;
    },
    dispose() {
      visible = false;
      el.remove();
      mounted = false;
    },
  };
}
