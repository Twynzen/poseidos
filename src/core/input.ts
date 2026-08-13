/**
 * Teclado WASD → ejes · Shift correr.
 * E/F interactuar (puerta; si no, loot contextual).
 * G loot explícito · I panel inventario · Q consumir · 1–5 hotbar (selección) · rueda hotbar · R descanso / reinicio game-over.
 * Z dormir (safehouse) · B barricada · C vendaje (craft) · H cocinar · T diálogo poseído · Espacio/V melee · X disparar · L linterna · M mute ambient · +/- zoom iso · F1 ayuda · F5 guardar · F9 cargar.
 */
export class Input {
  private readonly keys = new Set<string>();
  private readonly pressed = new Set<string>();
  private wheel: -1 | 1 | null = null;
  private readonly onDown: (e: KeyboardEvent) => void;
  private readonly onUp: (e: KeyboardEvent) => void;
  private readonly onWheel: (e: WheelEvent) => void;

  constructor() {
    this.onDown = (e) => {
      // Evitar refresh del browser en F5; F9 no suele chocar.
      if (e.code === "F5" || e.code === "F9") e.preventDefault();
      // F1: no abrir ayuda del browser
      if (e.code === "F1") e.preventDefault();
      // Espacio: no scrollear
      if (e.code === "Space") e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    };
    this.onUp = (e) => {
      this.keys.delete(e.code);
    };
    this.onWheel = (e) => {
      if (!hotbarWheelTarget(e.target)) return;
      e.preventDefault();
      if (e.deltaY > 0) this.wheel = 1;
      else if (e.deltaY < 0) this.wheel = -1;
    };
    window.addEventListener("keydown", this.onDown);
    window.addEventListener("keyup", this.onUp);
    window.addEventListener("wheel", this.onWheel, { passive: false });
  }

  get axes(): { x: number; z: number } {
    let x = 0;
    let z = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) z -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) z += 1;
    const len = Math.hypot(x, z);
    if (len > 0) {
      x /= len;
      z /= len;
    }
    return { x, z };
  }

  /** Shift: correr (más ruido). */
  get sprinting(): boolean {
    return this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
  }

  /** True una sola vez por keydown (edge). */
  consumeJustPressed(code: string): boolean {
    if (!this.pressed.has(code)) return false;
    this.pressed.delete(code);
    return true;
  }

  /** E o F para interactuar (puertas; fallback loot). */
  consumeInteract(): boolean {
    return (
      this.consumeJustPressed("KeyE") || this.consumeJustPressed("KeyF")
    );
  }

  /** G: loot / tomar 1 del contenedor cercano. */
  consumeLoot(): boolean {
    return this.consumeJustPressed("KeyG");
  }

  /** I: toggle detalle de inventario en HUD. */
  consumeInventoryToggle(): boolean {
    return this.consumeJustPressed("KeyI");
  }

  /** Q: refill botella bajo lluvia outdoor, o usar el slot hotbar seleccionado. */
  consumeUse(): boolean {
    return this.consumeJustPressed("KeyQ");
  }

  /**
   * 1–5 (Digit luego Numpad): índice hotbar 0–4, o null.
   * Si Digit y Numpad en el mismo frame, Digit gana.
   * Display-only: no consume el ítem.
   */
  consumeHotbar(): number | null {
    for (let i = 1; i <= 5; i++) {
      if (this.consumeJustPressed(`Digit${i}`)) return i - 1;
    }
    for (let i = 1; i <= 5; i++) {
      if (this.consumeJustPressed(`Numpad${i}`)) return i - 1;
    }
    return null;
  }

  /**
   * Rueda hotbar: deltaY>0 → +1 (siguiente), deltaY<0 → -1 (anterior).
   * Una vez por frame; null si no hubo rueda capturada.
   */
  consumeHotbarWheel(): -1 | 1 | null {
    const d = this.wheel;
    this.wheel = null;
    return d;
  }

  /**
   * R: descanso corto si vivo; en game-over Game lo interpreta como reinicio.
   */
  consumeRestOrRestart(): boolean {
    return this.consumeJustPressed("KeyR");
  }

  /** @deprecated usar consumeRestOrRestart */
  consumeRest(): boolean {
    return this.consumeRestOrRestart();
  }

  /** Z: dormir en safehouse (indoor, sin hostiles). */
  consumeSleep(): boolean {
    return this.consumeJustPressed("KeyZ");
  }

  /** Espacio o V: ataque melee. */
  consumeAttack(): boolean {
    return (
      this.consumeJustPressed("Space") || this.consumeJustPressed("KeyV")
    );
  }

  /** X: disparo ranged (F está en interact). */
  consumeShoot(): boolean {
    return this.consumeJustPressed("KeyX");
  }

  /** B: colocar barricada (madera → tile adyacente). */
  consumeBuild(): boolean {
    return this.consumeJustPressed("KeyB");
  }

  /** C: craft vendaje (tela + chatarra). */
  consumeCraft(): boolean {
    return this.consumeJustPressed("KeyC");
  }

  /** H: cocinar (canned_food → hot_meal; indoor/furniture). */
  consumeCook(): boolean {
    return this.consumeJustPressed("KeyH");
  }

  /** T: abrir/cerrar diálogo con poseído cercano. */
  consumeTalk(): boolean {
    return this.consumeJustPressed("KeyT");
  }

  /** Escape: cerrar paneles (diálogo). */
  consumeCancel(): boolean {
    return this.consumeJustPressed("Escape");
  }

  /** F5: guardar partida. */
  consumeSave(): boolean {
    return this.consumeJustPressed("F5");
  }

  /** F9: cargar partida. */
  consumeLoad(): boolean {
    return this.consumeJustPressed("F9");
  }

  /** F1: toggle ayuda de controles en HUD. */
  consumeHelp(): boolean {
    return this.consumeJustPressed("F1");
  }

  /** M: mute / unmute ambient stub. */
  consumeMute(): boolean {
    return this.consumeJustPressed("KeyM");
  }

  /** L: toggle linterna (requiere item flashlight en inventario). */
  consumeFlashlightToggle(): boolean {
    return this.consumeJustPressed("KeyL");
  }

  /** = / Numpad+: zoom in (frustum menor). */
  consumeZoomIn(): boolean {
    return (
      this.consumeJustPressed("Equal") ||
      this.consumeJustPressed("NumpadAdd")
    );
  }

  /** - / Numpad-: zoom out (frustum mayor). */
  consumeZoomOut(): boolean {
    return (
      this.consumeJustPressed("Minus") ||
      this.consumeJustPressed("NumpadSubtract")
    );
  }

  /** Llamar al final del tick para no acumular edges viejos. */
  endFrame(): void {
    this.pressed.clear();
    this.wheel = null;
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onDown);
    window.removeEventListener("keyup", this.onUp);
    window.removeEventListener("wheel", this.onWheel);
  }
}

/** preventDefault / ciclo solo si el target es body o está dentro de `#app`. */
function hotbarWheelTarget(target: EventTarget | null): boolean {
  if (target === document.body) return true;
  if (!(target instanceof Node)) return false;
  const app = document.getElementById("app");
  return app !== null && app.contains(target);
}
