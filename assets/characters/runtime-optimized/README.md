# Copias optimizadas de los cuatro humanos aprobados

Estos GLB se derivan de Alejandro explorador y los NPC Juan, Sara y David.
Los modelos aprobados, fuentes Blender, originales de Quaternius y licencias
se conservan en sus directorios. Warden no está incluido: sigue seleccionado
Vanguard-Class Mech Titan y falta su archivo oficial.

## Compresión

- Draco **SEQUENTIAL**, sin `weld()` ni simplificación. Conserva todas las caras.
- Cuantización: posición 16 bits, normal 14, UV 16 y atributos genéricos 16.
- Sólo Alejandro incorpora KTX2: mapas normales RGB UASTC lineales y mapas
  de color/datos ETC1S, respetando el espacio de color de cada uso.
- Se conservan dimensiones de las texturas y se generan mipmaps. No se
  invierten normales ni se utiliza el empaquetado GGGR.
- Los factores de materiales, rig, jerarquía, transformaciones de reposo,
  matrices inverse-bind y valores/canales de animación permanecen intactos.
- Las copias derivadas omiten únicamente `COLOR_1`, que PlayCanvas 2.23 ya
  ignora al cargar el modelo original. Dentro de Draco, conservar ese atributo
  hace que el stride del worker exceda el tamaño de `VertexFormat` y el motor
  rechace el buffer. `COLOR_0`, los atributos visibles y todos los pesos y
  articulaciones se conservan. Los originales mantienen ambos conjuntos.

`package-report.json` registra hashes, bytes, triángulos y validación tras
decodificar. La comparación usa cada esquina en el orden original de las
caras, porque Draco puede remapear identificadores de vértices duplicados.
También verifica antes/después los entregables aprobados y 26 originales.
Los hashes y metadatos del atributo fuente omitido se registran por primitiva;
la comparación geométrica verifica los demás atributos de todas las esquinas.

## Reconstrucción

Desde la raíz del repositorio, con las dependencias declaradas y Khronos
**toktx 4.4.2** instalado:

```sh
node tools/build-character-runtime-assets.mjs
# Si toktx no está en PATH:
TOKTX_BIN=/ruta/a/toktx node tools/build-character-runtime-assets.mjs
node tools/inspect-character-runtime-assets.mjs --runtime
node tools/check-character-draco-compatibility.mjs --output /tmp/character-draco-proof.json
```

La herramienta escribe únicamente estas copias y su informe; no reconstruye
los modelos aprobados. PlayCanvas requiere los decodificadores Draco y Basis
ya inicializados por `UrbanPilot.js`.

El ahorro de descarga no demuestra una mejora de FPS. Draco no reduce por sí
solo los triángulos o llamadas de dibujo. La memoria real de KTX2 depende del
formato transcodificado en cada dispositivo. La apariencia se revisa en
Chromium, y la prueba de rendimiento en Samsung sigue siendo independiente.

Procedencia y licencias: [CREDITS.md](CREDITS.md).
