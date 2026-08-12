# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-12 — iso camera zoom runtime (+/- frustum 6–16)
- **Qué quedó (esta corrida):**
  - `cameraConfig`: `ISO_FRUSTUM` 10 + `MIN/MAX` 6/16 + `clampIsoFrustum` / `zoomInFrustum` / `zoomOutFrustum` (step 1).
  - `input`: `consumeZoomIn` (= / NumpadAdd) · `consumeZoomOut` (- / NumpadSubtract).
  - `game`: `isoFrustum` privado; tick aplica zoom; `resize()` usa `this.isoFrustum`.
  - F1 / `CONTROLS_HELP`: `+/- zoom`.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; WebAudio player real; footsteps SFX; look survival propio
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** footsteps SFX stub o Mesh2Motion survival GLB (reemplazar Soldier)
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
