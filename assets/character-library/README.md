# Biblioteca de fuentes para renovación de personajes

Recursos de fase 2; **no forman parte del arranque del juego**. Las URL del
runtime y los modelos actuales no se modificaron.

- `originals/`: 26 archivos seleccionados, sin modificaciones, de las copias
  CC0 indicadas en el manifiesto. Incluye las licencias de cada pack.
- `download-manifest.json`: procedencia, revisión y hashes de origen.
- `checksums.json`: SHA-256 y comprobación de identidad de las descargas.
- `inspection.json`: geometría, esqueleto, clips, materiales y limitaciones.
- `blender-inspection.json` y `playcanvas-inspection.json`: importaciones reales.

Registro completo de licencia y restricciones técnicas:
[`PHASE-2-RESOURCES.md`](../../docs/character-renewal/PHASE-2-RESOURCES.md).
No confundir los recursos Standard gratuitos con los kits completos/Source.
Warden sigue pendiente de adquisición y validación.

## Repetir adquisición e inspección

Desde la raíz del repositorio, con dependencias npm instaladas:

```sh
python3 tools/acquire-character-library.py
node tools/inspect-character-library.mjs /workspace/artifacts/lora25-phase2
blender --background --factory-startup --python tools/inspect-character-library-blender.py
```

La adquisición necesita red para los espejos GitHub; si ya existen los archivos,
los comprueba localmente. La inspección no modifica los originales. Genera GLB
temporales autocontenidos y resuelve los alias de imágenes documentados.

Para la inspección Chromium, servir `/workspace` en `127.0.0.1:4174` y ejecutar:

```sh
node tools/check-character-library.mjs
```

Se bloquea deliberadamente el bootstrap del juego y se crea una escena de
validación independiente. Requiere Chromium en `/usr/bin/chromium` y acceso al
CDN del motor. No sustituye regresión, revisión artística ni pruebas en Samsung.
