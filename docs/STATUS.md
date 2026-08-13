# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 — Q usa el slot hotbar seleccionado (consumible). Pistola/linterna no-op.
- **Qué quedó (esta corrida):**
  - Q: si outdoor + lluvia + empty_bottle → refill; si no, `tryConsumeAt(hotbarSelected)` (solo ese slot).
  - Food/drink/heal: consume 1, HUD comiste/bebiste/vendaje +HP + loot toast. Vacío / no consumible → `no se puede usar`. Sin fallback al primer food.
  - Default slot 0 = botella de agua → Q al spawn bebe. `hotbarSlotIsConsumable` true solo food|drink|heal.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar slot** (consumible seleccionado / lluvia outdoor) · **1-5 hotbar** (selección, highlight azul) · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion blocked or next polish
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
