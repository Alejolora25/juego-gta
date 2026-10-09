# Fases 8 y 9 — materiales y copias optimizadas de personajes

Fecha: 9 de octubre de 2026. Alcance: Alejandro explorador, Juan, Sara y
David aprobados. **Comprobación en Chromium realizada; Samsung y Vanguard
pendientes.** Se conserva PlayCanvas 2.23.0 y la ciudad aprobada.

## Materiales e iluminación

La auditoría encontró 15 materiales y siete texturas en Alejandro, y
13/14/16 materiales en Juan/Sara/David, sin texturas adicionales en los NPC.
Los mapas de color se interpretan como sRGB; normales y rugosidad son datos
lineales. Hay normales de superficie, materiales opacos y filtrado con
mipmaps. Piel y ropa son mates y no metálicas; gafas y accesorios metálicos
usan factores separados.

El piloto conserva luz principal, ambiente, relleno y sombras de contacto.
No se demostró un defecto que justificara modificar colores aprobados o
añadir luces globales. Las 58 primitivas tienen materiales de doble cara:
se mantienen así para no ocultar la bata o ropa abierta. Los metales no
disponen de un entorno de reflexión; esa posible mejora estética queda
separada de la corrección de importación.

Las capturas reales de la variante optimizada permiten revisar silueta,
ropa, rostro y apoyo en el entorno existente:

- [Alejandro caminando](evidence/optimized-pilot/alejandro-walk.png).
- [Juan](evidence/optimized-pilot/juan-in-city.png),
  [Sara](evidence/optimized-pilot/sara-in-city.png) y
  [David](evidence/optimized-pilot/david-in-city.png).

## Recursos derivados y conservación

Se crearon cuatro copias en `assets/characters/runtime-optimized/`.
Los GLB aprobados, archivos Blender, capturas de aprobación y originales
de Quaternius permanecen intactos: **56 archivos comprobados por SHA-256
antes y después**. No se cambian diseños, posiciones funcionales ni
programación de controles, cámara, misiones, diálogos o combate.

| Recurso | Original, bytes | Copia optimizada, bytes |
| --- | ---: | ---: |
| Alejandro | 3.796.564 | 1.737.824 |
| Juan | 974.808 | 299.104 |
| Sara | 991.236 | 315.844 |
| David | 1.175.924 | 298.516 |
| **Total** | **6.938.532** | **2.651.288** |

El ahorro es de **4.287.244 bytes, un 61,79 %**. Se conservan las 64.055
caras triangulares. Draco usa codificación secuencial, sin simplificación
ni eliminación de caras; la comparación decodificada verifica cada esquina
de cada cara, articulaciones y atributos visibles. El error máximo de
posición es inferior a 0,05 mm. Jerarquía, reposo, matrices del esqueleto,
canales y muestras de animación, factores de materiales y usos de texturas
se comparan con las fuentes.

Sólo Alejandro utiliza KTX2: normales RGB UASTC lineales y mapas de
color/datos ETC1S, con dimensiones y espacios de color conservados.
La codificación de texturas tiene pérdida; se revisó visualmente en el
renderizador real y se mantienen las fuentes para comparar.

Las copias de Alejandro y David omiten únicamente `COLOR_1`, que el
importador de PlayCanvas 2.23 ya ignora en los originales. Incluirlo dentro
de Draco provocaba una diferencia entre el stride decodificado y el formato
del motor, que rechazaba los buffers completos. La prueba real de Chromium
detectó la pérdida de altura del personaje. La corrección conserva
`COLOR_0`, todos los demás atributos visibles y el atributo descartado en
las fuentes originales. El informe registra sus metadatos y hashes.
El worker Draco, `VertexFormat` y `VertexBuffer` reales del motor aceptan
ahora **58 de 58 buffers**, con tamaños coincidentes.

## Comparación y pruebas

[comparison.json](evidence/character-quality/comparison.json) contiene
las mediciones antes/después: bytes descargados, memoria de texturas
estimada por el motor, llamadas de dibujo y tiempos locales. Los JSON
fuente y optimizado se conservan junto al informe.

| Medición en Chromium | Fuente | Optimizado |
| --- | ---: | ---: |
| Texturas de Alejandro, bytes GPU estimados | 10.573.132 | 1.846.064 |
| Texturas de toda la escena, bytes GPU estimados | 18.244.712 | 9.517.644 |
| Buffers y texturas de escena, bytes estimados por el motor | 25.132.680 | 15.531.292 |
| Inicialización local en una ejecución | 715,2 ms | 787,4 ms |

Las texturas de Alejandro ocupan **82,54 % menos** en el formato elegido
por este Chromium. La inicialización local no mejoró: incluye decodificación
y transcodificación adicionales. Las cuatro vistas mantienen 214/160/112/170
llamadas de dibujo. El contador de CPU de skinning del motor no se actualiza
en esta versión; sus ceros se excluyeron y no se presentan como mediciones.

Las mediciones usan Chromium a 360 × 640 con SwiftShader por software,
un mundo a la vez y cuatro vistas. Sus FPS y tiempos de carga locales
no equivalen al rendimiento de un Samsung ni a una red móvil. La
compresión reduce transferencia y memoria de texturas; no se afirma
una mejora de FPS o de inicialización en el teléfono. Se mantienen
geometría, materiales y las llamadas de dibujo de referencia.

La regresión existente y el test real del piloto comprueban geometría
deformada, altura humana, pies, orientación, transiciones Idle/Walk/Run,
esqueletos de NPC bajo LOD, siete texturas cargadas, colisiones, misiones,
diálogos, combate y reinicio. Los límites de altura no se relajaron para
aceptar la compresión. Las capturas usan el HUD y controles existentes;
las tres misiones alcanzan XP 300. Evidencias:

- [Regresión](evidence/character-quality/regression.log).
- [Chromium con la copia corregida](evidence/character-quality/chromium.log).
- [Capturas y estado](evidence/optimized-pilot/report.json).
- [Validación de buffers del motor](../../assets/characters/runtime-optimized/engine-buffer-validation.json).

## Uso, reproducción y pendientes

Modo con fuentes originales: `/?pilot=1&characters=approved`.
Modo optimizado explícito: `/?pilot=1&characters=approved&quality=optimized`.
La carga normal del juego público conserva su comportamiento anterior.
La variante optimizada sólo se selecciona con los tres parámetros.

Para reconstruir y comparar, con el repositorio servido en el puerto 4173:

```sh
node tools/build-character-runtime-assets.mjs
node tools/check-character-draco-compatibility.mjs --output /tmp/character-buffers.json
node tools/measure-approved-character-pilot.mjs source
node tools/measure-approved-character-pilot.mjs optimized
node tools/check-approved-character-pilot.mjs optimized
```

La construcción requiere `toktx 4.4.2`; se puede indicar su ejecutable con
`TOKTX_BIN`. Procedencia CC0, licencias y modificaciones se registran en
`assets/characters/runtime-optimized/CREDITS.md` y en la biblioteca original.

Falta el archivo oficial del Vanguard para su inspección y adaptación.
El robot anterior sólo permite probar las mecánicas existentes; no se
presenta como el villano elegido. Faltan recorrido, aprobación visual y
mediciones de carga, FPS y temperatura en Samsung. Las fases 8–10 no se
declaran cerradas para el conjunto de cinco personajes. No se promueve
`main` como parte de este trabajo.
