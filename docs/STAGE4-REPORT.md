# Lora25: Urban Legacy — Informe Stage 4

## Auditoría comparativa

Corte de auditoría inicial: 6 de octubre de 2026. Actualización de validación: 7 de octubre de 2026. Baseline estable: Stage 3 en `main`. Desarrollo Stage 4: `stage4-playcanvas-spike`.

| Área | Auditoría anterior | Actual | Estado |
|---|---:|---:|---|
| PlayCanvas Engine 2.23 | 100% | 100% | Inicialización real en Chromium |
| WebGPU / WebGL2 fallback | 90% | 95% | Pipeline preparado con fallback |
| Arquitectura Stage 4 | 90% | 97% | Modular y aislada de main |
| GLB/glTF | 90% | 95% | Carga, caché, instanciación y deduplicación |
| Personajes rigged/skinned | 85% | 92% | Skinning real y slots por rol |
| Animación esquelética | 80% | 88% | Huesos y estados semánticos comprobados |
| Player Controller | 75% | 96% | Movimiento relativo a cámara; velocidades 7/13 |
| Cámara tercera persona | 85% | 96% | Cámara aprobada y lock de boss migrados |
| Controles táctiles | 65% | 92% | TouchControls conectado al runtime |
| Mapa Stage 2 → PlayCanvas | 75% | 90% | Mapa, carreteras, sectores, arena y obstáculos |
| NPC Juan/Sara/David | 65% | 90% | GLB, coordenadas y flujo de misiones |
| Warden | 65% | 95% | IA, Rapier, combate, lock y visibilidad |
| Iluminación/PBR/cielo | 70% | 83% | ACES, luces, sombras y materiales PBR |
| Vegetación/edificios | 45% | 65% | Mundo funcional; detalle visual aún pendiente |
| LOD | 80% | 90% | Adaptativo y compatible con estado del boss |
| Presupuesto móvil | 70% | 78% | Calidad/LOD adaptativos; falta profundizar |
| Rapier | 35% | 92% | Player, Warden, obstáculos y proyectiles |
| GPS/misiones | 20% | 92% | Cadena completa y GPS cámara-relativo |
| Combate completo | 20% | 94% | Proyectiles, HP, IA, victoria/derrota/reset |
| HUD/diálogos | 15% | 87% | HUD, objetivos, diálogos y sesión conectados |
| Identidad visual personajes | — | 65% | Alejandro/Warden diferenciados; humano final pendiente |
| Juego completo sobre PlayCanvas | ≈62% | ≈91% técnico | Loop jugable prácticamente migrado |

## Lectura del avance

El ≈91% corresponde a **migración técnica**, no a calidad gráfica final. El acabado visual global está aproximadamente en **60–65% del objetivo Stage 4**. El cuello de botella dejó de ser gameplay: Rapier, GPS/misiones, combate y HUD pasaron de estados parciales a estar cerca del cierre técnico.

El trabajo pendiente se concentra en modelos/personajes definitivos, materiales y texturas PBR de mayor calidad, edificios, vegetación, ambiente/efectos, optimización móvil y pruebas físicas. El bootstrap final ya está conectado al `index.html` experimental; los porcentajes de la tabla son estimaciones históricas, no métricas automáticas actualizadas.

## Regla de promoción

`main` permanece en Stage 3 aprobado. Stage 4 no se promueve hasta superar validación física en Samsung y recibir aprobación explícita. CI de navegador y entrypoint único `index.html` ya se completaron en la rama experimental. No se crearán HTML de preview versionados; el historial de Git y las ramas son el mecanismo de aislamiento y rollback.

## Última validación

CI #254: éxito, commit `f623677b3`. La suite de regresión y Chromium pasaron con el entrypoint experimental `index.html` apuntando a `Stage4Bootstrap.js`. CI #212 también había verificado identidades distintas de Alejandro y Warden sobre rigs GLB animados. La capa de identidad actual es una transición visual original; CesiumMan continúa temporalmente como rig humano base y no se considera el modelo humano definitivo.
