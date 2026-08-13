# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 — bind 1–5 selecciona slot (highlight azul). Default slot 1.
- **Qué quedó (esta corrida):**
  - Digit1–5 / Numpad1–5 seleccionan índice 0–4 (`consumeHotbar`); Digit gana si ambos en el mismo frame.
  - Default `hotbarSelected = 0` (slot 1, botella de agua). Clase CSS `hotbar-selected` (borde azul).
  - Display-only: no consume el ítem; el índice se mantiene si cambia inventario/loot; vacíos pueden quedar selected.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar / rellenar botella (lluvia outdoor)** · **1-5 hotbar** (selección, highlight azul) · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** usar slot con Q, o Mesh2Motion blocked
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
