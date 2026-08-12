# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-12 — hit flash on damage
- **Qué quedó (esta corrida):**
  - `src/ui/hitFlash.ts`: `HIT_FLASH_PEAK=0.65`, `HIT_FLASH_DECAY_PER_SEC=2.5`; `createHitFlash` / `triggerHitFlash` / `tickHitFlash`.
  - Overlay `#hit-flash` vignette radial rojo fullscreen (`pointer-events: none`); opacity = intensity × peak cada frame.
  - `game.ts`: toque hostil strength 1; DPS needs `min(1, amount*5)`.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; ambient WebAudio layers; samples de pisadas (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** attack clip / export Mesh2Motion real a `Survivor.glb`
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
