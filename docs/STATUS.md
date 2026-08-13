# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 — nameplates de loot más grandes (×qty legible al spawn). Siguiente: siguiente slice UI/survival chico.
- **Qué quedó (esta corrida):**
  - **Nameplates más grandes** canvas 384×80, font 28px, escala 2.6×0.65, Y 1.55. Stroke oscuro + fill ámbar para que `×qty` se lea al spawn.
  - **Nameplate qty** 1 stack → `madera ×6` / `munición ×8`; qty 1 sin ×1. 2+ stacks → fallback ×total (`pila de madera ×12`).
  - **Refresh** drop merge y G/Shift+G actualizan el marcador existente (antes `addLootMarker` no-op si el id ya estaba).
  - **G loot** 1 del contenedor cercano (`lootOne` / `tryLoot`). **E/F** contextual sigue 1.
  - **Shift+G stack** toma el primer stack entero (`lootStack` / `transferStack`); toast/floater `+madera×6` / `+munición×8` si qty>1. Shift se captura en el keydown de G (no en el tick / `sprinting`).
  - **U tirar** 1 del slot hotbar al tile del player (WorldContainer). **Shift+U stack** tira el stack entero.
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Shift+G stack** · **Q usar slot** (consumible seleccionado / lluvia outdoor) · **U tirar** · **Shift+U stack** · **1-5 hotbar** (selección, highlight azul) · **rueda hotbar** (cicla slot, wrap) · **clic hotbar** · **arrastrar hotbar** · **doble clic usar** · **clic der. info** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** siguiente slice UI/survival chico
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
