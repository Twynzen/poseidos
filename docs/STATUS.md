# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 — sticky slot: beber deja vacía en el mismo índice.
- **Qué quedó (esta corrida):**
  - Q/`tryConsumeAt` última `water_bottle`: `removeFromSlot` + `insertStackAt` `empty_bottle` en el mismo índice. Lata/linterna/pistola/ammo no corren a la izquierda.
  - `insertStackAt(inv, slotIndex, stack)`: sin merge ni peso; índice < 0 → 0; > length → push. `removeFromSlot` global sigue compactando (loot/transfer).
  - Stack con leftover: `addItem(empty_bottle)` como antes. Sin agujeros sparse en el array.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar slot** (consumible seleccionado / lluvia outdoor) · **1-5 hotbar** (selección, highlight azul) · **rueda hotbar** (cicla slot, wrap) · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** Mesh2Motion blocked o refill-in-place.
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
