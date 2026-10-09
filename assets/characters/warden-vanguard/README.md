# Warden — Vanguard elegido

Original oficial conservado en `original/vanguard.glb`. Licencia y cambios:
[CREDITS.md](CREDITS.md). Modelo editable: `warden.blend`; copia de navegador:
`warden.glb`. Informes de adaptación y compresión incluyen hashes y métricas.

El original tiene 499 mallas, ocho materiales, 42.294 triángulos y ninguna
animación o skin. La adaptación reúne piezas sin simplificar su geometría,
crea cinco articulaciones rígidas para chasis, brazos y piernas, y seis
animaciones mecánicas sin movimiento de la raíz de juego. No se presenta
como un rig o animaciones suministrados por el autor original.

Reproducir desde la raíz del repositorio:

```sh
blender --background --factory-startup --python tools/build-warden-vanguard.py
TOKTX_BIN=/ruta/a/toktx node tools/compress-warden-vanguard.mjs
node tools/check-character-draco-compatibility.mjs --vanguard --output /tmp/vanguard-buffers.json
blender --background --factory-startup --python tools/validate-warden-motion.py
```

Requiere Blender 4.3.2, dependencias npm declaradas y toktx 4.4.2. El GLB
intermedio `warden-source.glb` puede eliminarse después de comprimir; siempre
se puede reconstruir desde el original. Los clips se exportan con el rig;
las mecánicas de persecución, disparo, daño y victoria permanecen existentes.

Integrado exclusivamente en `?pilot=1&characters=approved`, incluyendo su
variante `&quality=optimized`. El modo normal y main no se publican con esta
adaptación hasta autorización. Falta revisión del resultado en Samsung.
