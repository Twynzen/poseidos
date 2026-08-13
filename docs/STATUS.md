# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 07:21 — Shift+U tira el stack entero; U sigue 1. Siguiente: throw direction o Mesh2Motion blocked.
- **Qué quedó (esta corrida):**
  - **U tirar** 1 del slot hotbar al tile del player (WorldContainer; G/E loot; toast gold `tiraste <name>`).
  - **Shift+U stack** tira el stack entero; toast `tiraste munición ×8` si qty>1.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Q usar slot** (consumible seleccionado / lluvia outdoor) · **U tirar** · **Shift+U stack** · **1-5 hotbar** (selección, highlight azul) · **rueda hotbar** (cicla slot, wrap) · **clic hotbar** · **arrastrar hotbar** · **doble clic usar** · **clic der. info** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** throw direction / Mesh2Motion blocked
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
