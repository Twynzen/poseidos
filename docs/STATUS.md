# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 — bed markers rosa
- **Qué quedó (esta corrida):**
  - MarkerRole `bed`: anillo `0xe07090`, badge `0xffa0b8`, emissive `0x401018`, glifo ▭.
  - `bedFocus`: scale 1.35@0 → 1.12@reach 1.5 (1.0 fuera); pulse `1+0.08*sin(t*6)`; mul = scale*pulse in reach.
  - `worldView`: un grupo por tile cama en `(6,6)` y `(24,22)` (`x+0.5, 0, y+0.5`) con `attachRoleMarkers("bed")`; siempre visible (no FOV). `syncBedFocus` pulsa el más cercano en reach. Dispose de grupos.
  - `game`: sync cada frame (vivo + game-over) tras `syncDoorFocus`.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion / real samples
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
