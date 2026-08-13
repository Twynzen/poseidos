# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 — door markers teal
- **Qué quedó (esta corrida):**
  - MarkerRole `door`: anillo `0x2ec8b4`, badge `0x7eefe4`, emissive `0x104038`, glifo ⊓.
  - `doorFocus`: scale 1.35@0 → 1.12@reach 1.6 (1.0 fuera); pulse `1+0.08*sin(t*6)`; mul = scale*pulse in reach.
  - `worldView`: un grupo por tile door en `(x+0.5, 0, y+0.5)` con `attachRoleMarkers("door")`; siempre visible (no FOV). `syncDoorFocus` pulsa el más cercano en reach. Dispose de grupos.
  - `game`: sync cada frame (vivo + game-over) tras `syncLootFocus`.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion / real samples
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
