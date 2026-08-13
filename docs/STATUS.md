# Status — Poseídos

- **Fase actual:** 5/6 — gates diálogo→comportamiento (F5) + LLM stub; prep F7 MP stub
- **Última rutina:** 2026-08-13 — doble clic en fila I usa el stack (mismo path que clic; debounce anti doble-consumo).
- **Qué quedó (esta corrida):**
  - **consumeDblClick + useInventorySlot**; doble clic en fila del panel I usa el stack (food/drink/heal / recarga lluvia / "no se puede usar"). Clic simple sigue usando. Debounce ~0.35s de `clock.elapsed` en el mismo índice evita comer dos veces (click+click+dblclick).
  - **consumeDrag + swapInventoryStacks**; mismo patrón que hotbar; sin toast. Arrastrar una fila ocupada sobre otra intercambia `{id, qty}`. Clic-usar / Shift+partir / Ctrl+juntar / clic der. inspect no cambian; un drag no usa el ítem.
  - **Hotbar Shift+clic** = splitStack; **Ctrl/Cmd+clic** = mergeStack; mismos toasts que el panel I (`partiste … ×N` / `juntaste … ×N` / no se puede partir/juntar). No abre I ni selecciona el slot. Arrastrar entre slots no parte.
  - **Ctrl/Cmd+clic I** fusiona en el otro stack del mismo id con hueco; toast `juntaste … ×N`; si no hay par → "no se puede juntar".
  - **Shift+clic I** parte qty/2 al slot siguiente; toast `partiste … ×N`; qty 1 o inventario lleno → "no se puede partir".
  - **Clic der. I** muestra nombre · verbo (no consume); toast gold también en "no se puede usar".
  - **Arrastrar inv** fila→fila en el panel I (`consumeDrag` + `swapInventoryStacks`); silent como la hotbar. Índices `Math.trunc`, sin clamp 0–4.
  - **Clic inv usar** clic en ítem del panel I come/bebe/cura (o recarga botella con lluvia); toast igual que Q. Índice original (no clamp 0–4); qty=0 no compacta el index. **Doble clic inv** el mismo path; debounce cubre el leftover del clic.

  - **Loot facing** `ContainerRegistry.nearest(wx, wy, reach?, prefer?)`: si `prefer` `{tx,ty}` tiene loot y dist al centro ≤ reach, ese contenedor; si no, nearest por distancia (empate conserva el primero).
  - **G / Shift+G / E-fallback** `tryLoot` / `tryLootStack` pasan `dropTargetTile(x, y, facingX, facingY)` (sin walkable) a `lootOne` / `lootStack`. Spawn 24.5,15.5 facing +Y: drop U en (24,16) empataba ~1.0 con madera (25,15) → ahora G toma el drop.
  - **HUD `cerca:`** y refresh del nameplate usan el mismo `prefer`. Sin prefer / prefer vacío / prefer fuera de reach = comportamiento viejo.
  - **U tirar facing** 1 del slot hotbar al tile de frente (`player.facingX/Y`); si no es walkable o facing (0,0), tile del player. Spawn 24.5,15.5 facing +Y → (24,16).
  - **Shift+U stack** tira el stack entero al mismo tile destino.
  - **Nameplates más grandes** canvas 384×80, font 28px, escala 2.6×0.65, Y 1.55. Stroke oscuro + fill ámbar para que `×qty` se lea al spawn.
  - **Nameplate qty** 1 stack → `madera ×6` / `munición ×8`; qty 1 sin ×1. 2+ stacks → fallback ×total (`pila de madera ×12`).
  - **Refresh** drop merge y G/Shift+G actualizan el marcador existente (antes `addLootMarker` no-op si el id ya estaba).
  - **G loot** 1 del contenedor cercano (`lootOne` / `tryLoot`). **E/F** contextual sigue 1.
  - **Shift+G stack** toma el primer stack entero (`lootStack` / `transferStack`); toast/floater `+madera×6` / `+munición×8` si qty>1. Shift se captura en el keydown de G (no en el tick / `sprinting`).
- **Controles:** WASD mover · **Shift correr** · **Espacio/V melee** · **X disparar** · E puerta/loot · G loot · **Shift+G stack** · **Q usar slot** (consumible seleccionado / lluvia outdoor) · **U tirar** · **Shift+U stack** · **1-5 hotbar** (selección, highlight azul) · **rueda hotbar** (cicla slot, wrap) · **clic hotbar** · **arrastrar hotbar** · **doble clic usar** · **clic der. info** · **Shift+clic hotbar partir** · **Ctrl+clic hotbar juntar** · **clic inv usar** · **doble clic inv** · **arrastrar inv** · **clic der. inv** · **Shift+clic inv partir** · **Ctrl+clic inv juntar** · **I inventorio (panel; al empezar muestra kit inicial)** · B barricada · **C vendaje** · **H cocinar** · **T diálogo** (calmar / preguntar / amenazar / ofrecer comida / Distraer) · **L linterna** · **M mute ambient** · **+/- zoom** · R descanso/reinicio · **Z dormir** (cama o suelo indoor) · **F1 ayuda** · F5 guardar · F9 cargar · (boot) clic/Espacio saltar loading
- **Fuera de este slice:** autogenerar modelos en Mesh2Motion (herramienta externa); WebSocket real; lobby UI browser; API LLM real; GTAO; samples de pisadas (sigue beep); samples ambient reales; samples combat reales (sigue beep); samples interact reales (sigue beep); samples speech reales (sigue beep); samples heartbeat reales (sigue beep)
- **Dirección:** sandbox largo en Three.js (sim primero; render es vista); LLM solo stub/fallback; MP solo stub headless por ahora
- **Siguiente subtarea concreta:** U con el panel I abierto tira el stack de la última fila clicada (no el hotbar).
- **Bloqueos:** ninguno
- **Entorno:** Bun; scripts `dev`, `build`, `test`
