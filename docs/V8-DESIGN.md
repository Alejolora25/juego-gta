# Urban Legacy V8 — Gameplay / Architecture

## Gameplay loop

V8 cambia el prototipo desde tráfico hostil hacia una estructura de acción-aventura por capítulos:

1. Explorar el distrito.
2. Encontrar NPC de misión.
3. Completar una cadena de tres objetivos.
4. Desbloquear zona de jefe.
5. Entrar en combate.
6. Derrotar al jefe para completar el capítulo.

Los vehículos perseguidores de V7 dejan de formar parte del loop de enemigos. Los vehículos podrán regresar posteriormente como tráfico ambiental o conducción.

## Capítulo 1

NPCs: Juan (DevOps), Sara (Backend), David (Lab).

Boss: Firewall Warden.

Al completar los tres encuentros se habilita la misión del jefe. Al aproximarse a la arena se inicia el combate, aparece el botón DISPARAR y la barra de vida del jefe. El jefe persigue al jugador a corta distancia y dispara proyectiles. El jugador dispone de movimiento, sprint, cámara independiente y disparo.

## Clean Architecture objetivo

La preview continúa siendo un HTML autocontenido para reducir riesgo durante la validación móvil, pero los límites de dominio quedan definidos para la migración modular.

```text
src/
  domain/
    entities/
      Player.js
      Enemy.js
      Boss.js
      Projectile.js
      Mission.js
    services/
      CombatRules.js
  application/
    usecases/
      AdvanceMission.js
      StartBossFight.js
      ShootProjectile.js
      ApplyDamage.js
      CompleteChapter.js
  infrastructure/
    rendering/
      ThreeRenderer.js
      WorldBuilder.js
    input/
      TouchControls.js
    persistence/
      LocalSaveRepository.js
  presentation/
    hud/
      HudController.js
    GameBootstrap.js
```

Regla: `domain` no conoce Three.js ni el DOM. `application` orquesta reglas de dominio. `infrastructure` implementa render/input/persistencia. `presentation` conecta HUD y bootstrap.

## Controles congelados

El joystick izquierdo controla únicamente movimiento. El área derecha controla la cámara. CORRER mantiene sprint. Estos controles no se cambian sin una solicitud explícita.

DISPARAR es contextual: permanece oculto fuera de una pelea de jefe.

## Próximas iteraciones

- Coberturas y obstáculos de arena.
- Mejor apuntado y feedback de impacto.
- Animaciones de ataque/daño/muerte.
- Misiones que impliquen acciones, no solamente hablar.
- División física del monolito V8 en módulos ES conservando GitHub Pages.
- Guardado local de capítulo y progreso.
- Optimización mediante instancing y pooling de proyectiles.