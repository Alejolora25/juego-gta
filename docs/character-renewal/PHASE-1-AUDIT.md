# Fase 1 — auditoría y respaldo de la base aprobada

Fecha: 9 de octubre de 2026. **Estado: completada.**

## Versión protegida

- Repositorio: `Alejolora25/juego-gta`.
- Commit: `3e0ec79613a548fc0013ef60663dd22cd3cfdce5`.
- Motor activo: **PlayCanvas 2.23.0**, fijado en `package.json` y en el import map.
  Three.js 0.180.0 sigue disponible para infraestructura histórica; no es el
  motor del bootstrap público `Stage4Bootstrap.js`.
- [CI #303: satisfactorio](https://github.com/Alejolora25/juego-gta/actions/runs/37860712711).
- [GitHub Pages #73: satisfactorio](https://github.com/Alejolora25/juego-gta/actions/runs/37860710818).
- Samsung: el usuario aprobó la ciudad y las últimas texturas; la pequeña
  latencia al aparecer edificios no bloquea el trabajo de personajes.
- Tag de respaldo publicado:
  [`backup-city-ktx-samsung-approved-20261009`](https://github.com/Alejolora25/juego-gta/tree/backup-city-ktx-samsung-approved-20261009).
  Es un tag de Git; no se creó una nueva publicación de Pages.

## Inventario funcional de referencia

| Área | Estado que se conserva |
| --- | --- |
| Arranque | Bootstrap PlayCanvas; ciudad renovada mediante `?pilot=1`. La entrada sin parámetro mantiene Stage 6. |
| Ciudad aprobada | Cuatro distritos, 83 edificios, 18 árboles y 24 farolas. Manzana original de seis edificios reutilizada como patrón. |
| Recursos editables | 13 archivos `.blend`, GLB exportados, originales anteriores, texturas, créditos y licencias dentro del respaldo. |
| Personajes actuales | Alejandro humanoide; Juan, Sara y David como variantes del humano anterior; Warden basado en RobotExpressive. Son prototipos funcionales. |
| Entrada | Joystick relativo a la cámara; correr; cámara táctil; acción; fijar objetivo; disparar. |
| Movimiento | Velocidades 7/13, posición resuelta con Rapier y orientación visual humana corregida. No usar desplazamiento de animación para mover la raíz de juego. |
| Misiones | Juan → Sara → David → encuentro con Warden; interacción a menos de cuatro unidades. |
| Posiciones | Juan `(-28, 0, 74)`, Sara `(98, 0, -12)`, David `(-108, 0, 54)`. Se conservan los puntos de interacción. |
| Estado | Tres corazones, jefe con 100 HP, 100 XP por objetivo, 500 XP por victoria, derrota/victoria y reinicio. |
| Combate | Bloqueo de cámara, persecución, proyectiles, impactos barridos y enfriamientos existentes. |
| Colisión | Huellas de edificios y vías protegidas derivadas de la lista urbana compartida; física separada de LOD visual. No hay nueva navegación que preservar. |
| Iluminación | Ambiente urbano aprobado, atlas de iluminación estática y sombras de contacto. |
| Optimización | LOD/culling de edificios y mobiliario; Draco y KTX2 con decodificadores locales. |
| Dependencias | `package.json` y `package-lock.json` íntegros. Blender/KTX-Software se requieren para reconstrucción artística, no para jugar. |

El inventario no implica diseños definitivos ni mediciones completas en Samsung.
La memoria de texturas observada en Chromium es de 7.665.436 bytes; no equivale
a memoria total ni rendimiento del teléfono.

## Respaldo y restauración comprobada

Directorio local: `/workspace/backups/lora25-3e0ec79-20261009/`.

- `project.bundle`: historial completo y referencias disponibles al congelar
  la base; `git bundle verify` satisfactorio.
- `project-approved.tar.gz`: los 142 archivos versionados de la versión
  aprobada, incluidos recursos, fuentes Blender, licencias y dependencias
  declaradas. 58.646.939 bytes antes de compresión.
- `SHA256SUMS`: integridad del respaldo y evidencias.
- `reference/`: registros de regresión y Chromium, informe urbano, cuatro
  capturas de referencia y SHA-256 de cada archivo versionado.
- `RESTORE.md`: instrucciones de recuperación y límites del respaldo.

Se clonó **el bundle**, en `/tmp/lora25-restore-check-20261009`, y se restauró
el commit aprobado. Los 142 archivos recuperados son idénticos byte por byte.
El servidor de pruebas sirvió esa copia, no el directorio de desarrollo.

Las dependencias instaladas de `node_modules` se reutilizaron mediante un enlace
local; no se afirma haber probado una instalación limpia sin red. El respaldo
incluye el lockfile para recuperarlas con `npm ci`. El arranque también necesita
acceso a los CDN declarados para motor/física. No incluye secretos, cachés ni
herramientas del sistema.

## Resultados

- `npm test`: **8 grupos de archivos satisfactorios**, cero fallos.
- Suite Chromium: **5 pruebas satisfactorias**, 1,4 minutos. Arranque público,
  personajes, misiones/combate/reinicio, contrato Rapier y piloto urbano.
- Recorrido de los cuatro distritos: 83 edificios y cero errores del navegador.
  Los siete barridos completos de vías protegidas llegaron a su destino sin
  quedar bloqueados por edificios.
- El juego no cambió durante esta fase. La rama de trabajo nueva es
  `stage8-character-audit`; `main` conserva el commit aprobado.

La fase 2 puede continuar sobre esta referencia. El diseño y la integración de
personajes tienen sus propias puertas de aprobación en el plan maestro.
