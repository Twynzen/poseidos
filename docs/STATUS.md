# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-12 — hostile facing yaw (`hostileYaw` + FOV sync)
- **Qué quedó (esta corrida):**
  - `hostileFigure.hostileYaw(faceX, faceZ)`: `atan2` si finitos y no ~0; si no null. Escala sigue en 1.5.
  - `worldView.syncHostiles`: `faceX`/`faceZ` opcionales; si yaw válido → `mesh.rotation.y`, si no mantiene rotación previa.
  - `game.syncHostileView`: en FOV pasa `faceX = player.x - h.x`, `faceZ = player.y - h.y`.
  - Tests de `hostileYaw` (finitos, ~0, no finitos).
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; WebAudio player real; footsteps SFX; look survival propio
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion survival GLB (reemplazar Soldier)
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
