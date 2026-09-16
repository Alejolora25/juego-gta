# Lora25: Urban Legacy

Juego urbano 3D para navegador móvil construido con HTML, CSS, JavaScript, Three.js y WebGL.

## Línea base

La línea base aprobada para continuar el desarrollo es **V6.3.2 Runtime Fix**. Esta versión conserva:

- Joystick izquierdo dedicado exclusivamente al movimiento del personaje.
- Arrastre fuera del joystick para controlar la cámara.
- Botones ACCIÓN y CORRER.
- Mapa urbano 3D ampliado.
- Personaje articulado.
- Tráfico, edificios, cielo y texturas procedurales.
- Sistema de misiones con NPCs.
- Flecha, distancia y marcador 3D para guiar al objetivo.
- Corrección del bloqueo del game loop provocado por el HUD de navegación.

## Regla de desarrollo

A partir de esta línea base, los cambios deben hacerse de forma incremental sobre el código existente. No se deben reescribir ni modificar controles, cámara o sistemas ya aprobados salvo que la tarea lo solicite expresamente.

## Runtime

El juego se ejecuta directamente en un navegador moderno. Three.js se carga como módulo ES desde CDN, por lo que la versión actual requiere conexión a Internet al iniciar.
