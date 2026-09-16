# Urban Legacy — Clean Architecture para navegador

La V7 inicia la migración desde un HTML monolítico hacia una arquitectura modular sin perder compatibilidad con GitHub Pages ni navegadores móviles.

## Capas objetivo

```text
src/
  domain/
    entities/        Player, Vehicle, NPC, Mission
    value-objects/   Position, Velocity, Health
    services/        TrafficRules, CollisionRules
  application/
    use-cases/       MovePlayer, UpdateTraffic, Interact, AdvanceMission
  infrastructure/
    rendering/       Three.js renderer, materials, lighting
    input/           Touch joystick, camera gestures
    world/           City generation, road graph, traffic spawning
  presentation/
    hud/             Mission HUD, objective guide, controls
```

## Reglas

- `domain` no debe depender de Three.js ni del DOM.
- `application` coordina casos de uso y depende del dominio.
- `infrastructure` adapta Three.js, WebGL, input táctil y generación del mundo.
- `presentation` administra HUD y elementos HTML.
- `index.html` será únicamente el punto de entrada.
- Los controles móviles aprobados son contrato de UX y no se modifican sin una tarea explícita.
- El juego debe continuar funcionando como sitio estático en GitHub Pages.

## Estrategia de migración

V7 se publica primero como `v7-preview.html` para proteger `index.html`, que permanece como baseline estable. Tras validación visual y funcional en Android, los sistemas se extraerán gradualmente a módulos ES bajo `src/` y finalmente V7 reemplazará el entrypoint estable.

## Sistemas V7

- ACES Filmic Tone Mapping.
- Materiales PBR/Physical para vehículos y superficies.
- Sombras PCF suaves y luz direccional cálida + relleno frío.
- Edificios con fachadas, ventanas, azoteas y equipos técnicos.
- Árboles con copas compuestas y mayor volumen.
- Avatar con animación interpolada de marcha/carrera y giro suave.
- Grafo vial inicial para tráfico con giros en intersecciones.
- Detección de proximidad del jugador y estado de persecución experimental.
