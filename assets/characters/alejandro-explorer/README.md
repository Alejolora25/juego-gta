# Alejandro — variante explorador tecnológico

Revisión de la fase 3 solicitada por el usuario el 9 de octubre de 2026 a partir
de su referencia visual. **Pendiente de nueva aprobación visual.** Se conservan
el modelo anterior y su aprobación en `../alejandro-phase3/approval.json`.

## Diseño

Gafas azules de montura fina, barba texturizada, chaqueta técnica azul oscura,
camiseta oscura con emblema original, pantalón cargo beige, bolsillos laterales,
guantes sin dedos, mochila con bolsillos y correas, reloj y calzado de montaña.
La apariencia adapta ropa y accesorios de la referencia al humano estilizado
existente. No certifica un parecido facial exacto ni un resultado fotorealista.

La escena editable `alejandro.blend` y el GLB se derivan del modelo aprobado,
con el mismo esqueleto de 65 huesos y los diez clips. Se mantiene orientación
GLB -Z y el adaptador existente de 180°. La animación de derrota ajusta su
contacto al volumen nuevo de la mochila; los otros nueve clips se conservan.
Las prendas y accesorios siguen los huesos del personaje.

El visor `review/index.html` presenta solo el personaje. No inicia la ciudad.
Las imágenes proceden del mesh real renderizado en Blender y Chromium, y el
vídeo graba la reproducción real de PlayCanvas. La iluminación de estudio no
representa una prueba integrada en Samsung.

## Procedencia y licencia

Base humana, pelo y animaciones: Quaternius / Tomás Laulhé, ediciones Standard
CC0 1.0 Universal ya verificadas en fase 2. Enlaces, copias de licencia,
originales y hashes en `../../character-library/` y en el README anterior.
Accesorios geométricos, tintes de materiales y pintura de barba: adaptación
original para Lora25. La imagen aportada por el usuario se utiliza como guía
visual; no se incorpora como textura ni como asset del juego.

## Reconstrucción y validación

Desde la raíz del repositorio:

```sh
blender --background --python tools/revise-alejandro-explorer.py
LORA25_ALEJANDRO_VARIANT=alejandro-explorer node tools/package-alejandro-phase3.mjs
LORA25_ALEJANDRO_VARIANT=alejandro-explorer blender --background --python tools/validate-alejandro-phase3.py
LORA25_ALEJANDRO_VARIANT=alejandro-explorer blender --background --python tools/render-alejandro-phase3.py
# Servir previamente la raíz en 127.0.0.1:4173:
LORA25_ALEJANDRO_VARIANT=alejandro-explorer node tools/check-alejandro-phase3.mjs
LORA25_ALEJANDRO_VARIANT=alejandro-explorer node tools/record-alejandro-phase3.mjs
```

Informes: `build-report.json`, `package-report.json`, `geometry-validation.json`
y `chromium-report.json`. El manifiesto `deliverable-checksums.json` identifica
el resultado presentado. La integración en la ciudad pertenece a la fase 5 y
requiere la aprobación visual de esta variante.
