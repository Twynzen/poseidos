# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 05:02 — refill lluvia in-place (vacía→agua mismo índice). Spawn empieza en drizzle para poder Q+Q. Siguiente: Mesh2Motion blocked o click-hotbar.
- **Qué quedó (esta corrida):**
  - `tryRefillFromRain`: última `empty_bottle` → `insertStackAt` `water_bottle` en el mismo índice. Lata/linterna no corren.
  - Stack leftover: `addItem(water_bottle)` + rollback `empty_bottle` si no cabe.
  - Spawn y restart: `WeatherSystem({ initial: "drizzle" })` para demo Q+Q.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar slot** (consumible seleccionado / lluvia outdoor) · **1-5 hotbar** (selección, highlight azul) · **rueda hotbar** (cicla slot, wrap) · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion blocked o click-hotbar
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
