# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 — impact spark al extremo del tracer (X hit/miss)
- **Qué quedó (esta corrida):**
  - `impactSpark.ts`: `IMPACT_SPARK_DURATION=0.22`; pico 1; envelope ease-out sine `cos(u · π/2)`. `createImpactSpark` / `triggerImpactSpark(state, x, y)` (re-triggerable) / `tickImpactSpark` → `{intensity, active, x, y}`. dt≤0 no avanza.
  - `worldView.ts`: esfera aditiva unlit 0.18 dia `0xffd080` + PointLight pico 1.4 distancia 1.8. Altura `TRACER_HEIGHT` 1.05. Hide si inactivo. `triggerImpactSpark(x, y)` público.
  - `game.ts`: `view.triggerImpactSpark(shot.toX, shot.toY)` en X ok (`shot.kind !== "fail"`). Hit y miss; fail no.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** dry-fire click
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
