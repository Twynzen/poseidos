# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-12 — footsteps WebAudio + thirst 360s
- **Qué quedó (esta corrida):**
  - `footstepPlayer.ts`: `shouldEmitFootstep` (floor cross headless) + `createFootstepPlayer` / `syncFootstepPlayer` (oscilador ~180Hz walk / ~240Hz sprint; no-op sin window; respeta mute).
  - Cableado en `game.syncFootsteps` tras `tickFootsteps`; export barrel audio.
  - `footstepsStub` ya expone `phase` / `level` / `muted` + `footstepsLevel` (compatible con el player).
  - `NEEDS_FULL_SEC.thirst`: 280 → **360** (+ tests).
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; ambient WebAudio layers; samples de pisadas (sigue beep); look survival propio
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion survival GLB (reemplazar Soldier)
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
