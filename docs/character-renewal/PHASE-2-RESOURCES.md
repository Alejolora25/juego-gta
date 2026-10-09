# Fase 2 — recursos y validación técnica

Fecha: 9 de octubre de 2026. **Estado: parcial; pendiente el archivo de Warden.**

Se conservaron 26 archivos fuente seleccionados, 38.794.598 bytes, en
`assets/character-library/originals/`. No se descargaron los packs completos:
se eligieron bases, variantes, texturas, licencias y animaciones necesarias.
No están conectados al juego público. Los originales no se han modificado.

## Procedencia y licencia de la versión adquirida

Autor de los cuatro packs adquiridos: **Quaternius / Tomás Laulhé**. Los
archivos de licencia incluidos declaran **CC0 1.0 Universal** y las fichas
específicas consultadas también anuncian CC0. Se conservaron los textos.

| Pack | Ficha oficial | Espejo y revisión fija |
| --- | --- | --- |
| Universal Base Characters Standard | https://quaternius.com/packs/universalbasecharacters.html | `NafisRayan/Animate-Rigged-Humanoid-No-Blender` @ `5821923af517ac5fdc82505faa92a0d575fc1b1a` |
| Universal Animation Library Standard | https://quaternius.com/packs/universalanimationlibrary.html | Mismo espejo y revisión anterior |
| Ultimate Modular Men | https://quaternius.com/packs/ultimatemodularcharacters.html | `agentkaerf/FreeModels` @ `db3df04d1e4714298a09510b26fb6de6645138a2` |
| Ultimate Modular Women | https://quaternius.com/packs/ultimatemodularwomen.html | Mismo espejo y revisión anterior |

La red del entorno no permite descargar directamente desde Quaternius/itch.io.
Se obtuvieron copias redistribuidas con licencia CC0 en los espejos indicados.
`download-manifest.json` registra URL oficial, URL exacta de descarga, revisión,
autor, licencia, tamaño y hash Git. `checksums.json` añade SHA-256.
Los 26 tamaños y hashes Git se comprobaron contra los árboles de esos espejos.
Esto verifica la identidad de esas copias; no es una firma del autor ni una
comparación con un archivo descargado directamente del editor.

La página general de licencia de Quaternius presenta también **QAL v1.0**,
actualizada el 28/08/2026, con condiciones distintas de redistribución. No se
asume que todo recurso nuevo de Quaternius sea CC0: este registro se limita a
los archivos adquiridos que incluyen expresamente CC0 y a sus fichas específicas.
Revisar la licencia de cualquier descarga diferente antes de incorporarla.
El encabezado del `License.txt` de Women menciona Males; su texto CC0 coincide
con la licencia publicada específicamente para Women.

## Resultado técnico

| Recurso fuente | Triángulos | Huesos | Clips | Altura en reposo aproximada |
| --- | ---: | ---: | ---: | ---: |
| Superhero Male FullBody, base propuesta de Alejandro | 14.318 | 65 | 0 | 1,82 m |
| Universal Animation Library, sin root motion | 13.744 en el maniquí auxiliar | 65 | 43 | 1,83 m |
| Men: Casual Hoodie | 6.206 | 62 | 24 | 1,87 m |
| Men: Worker | 5.240 | 62 | 24 | 1,87 m |
| Men: Suit | 7.674 | 62 | 24 | 1,86 m |
| Women: Casual | 6.424 | 62 | 24 | 1,85 m |
| Women: Formal | 6.108 | 62 | 24 | 1,84 m |

También se conservaron pelo Buzzed, Simple Parted y cejas: 830, 1.301 y 984
triángulos respectivamente. Son accesorios sin esqueleto independiente.
Las alturas son de la malla en reposo, no una certificación de todas las poses.

### Alejandro

La copia Standard gratuita obtenida ofrece la base **Superhero Male**, no el
Regular Male mostrado entre las seis proporciones del kit completo. No trae
ropa de ingeniero ni animaciones propias. La fase 3 debe adaptar proporciones,
vestimenta y accesorios; el diseño definitivo todavía no existe.

La biblioteca conservada ofrece 43 clips reales, no los 120+ de la publicidad
del kit completo. Los 65 nombres de huesos coinciden con la base. PlayCanvas
pudo animarla en la escena de inspección con `Idle_Loop` y `Walk_Loop`.
La traslación del hueso `root` es constante `(0,0,0)` en reposo, caminar,
trotar y sprint: la variante descargada no debe conducir el movimiento del juego.
La retargetización definitiva y todas las acciones se comprobarán en fase 3.

Dos referencias PNG del glTF original tienen nombres erróneos:
`T_Hair_1_Normal_png.png` y `T_Eye_Normal_png.png`. Sus imágenes existen con el
nombre sin `_png`. La herramienta de inspección resolvió esos alias solamente
al generar GLB temporales; los originales permanecen intactos. Los accesorios
de pelo comparten imágenes almacenadas en la carpeta del cuerpo.

Texturas de pelo/cuerpo: 2048 × 2048; ojos: 256 × 256. Los materiales son PBR.
No cargar todos estos originales directamente en Samsung: producir recursos
adaptados y medirlos en las fases correspondientes.

**Hallazgo que evita otra regresión:** el selector actual busca nombres por
patrón y elegiría `Crouch_Idle_Loop` antes que `Idle_Loop`, y `Walk_Formal_Loop`
antes que `Walk_Loop`, si se entregara el paquete completo. La inspección usó
clips seleccionados explícitamente. La exportación de fase 3 debe suministrar
los clips/nombres correctos al contrato existente, sin reescribir el movimiento.

### NPC

Los cinco candidatos importaron y reprodujeron Idle en PlayCanvas. Incluyen
interacción y otros 23 clips, aunque los NPC estacionarios utilizarán reposo.
Usan materiales de color sin texturas externas; son bases estilizadas que aún
necesitan identidad visual. La selección de Juan/David/Sara no es definitiva.

En la inspección produjeron entre 9 y 13 instancias de malla por personaje.
La consolidación de materiales/meshes se evaluará con mediciones; no se afirma
haber optimizado ni aprobado estos modelos para Samsung.

## Warden: requisito pendiente

- Candidato: [Vanguard-Class Mech Titan (Game Ready)](https://sketchfab.com/3d-models/vanguard-class-mech-titan-game-ready-84f5e9a69d734bbd97b10634e379b235).
- Autor publicado: **ThankSang0301**, usuario `@ThanhSang0301`.
- Ficha indexada: descarga gratuita, CC Attribution, 42,3k triángulos y 23,3k
  vértices; materiales PBR, incluido emissive.
- **No se obtuvo el archivo.** Sketchfab devuelve acceso denegado desde este
  entorno. No se han verificado huesos, clips, texturas, escala, coste real ni
  la versión exacta de CC BY. La descripción de topología preparada para rigging
  no prueba que incluya rig o animaciones.
- Para cerrar la fase hace falta descargar el archivo desde la ficha oficial
  y aportar el ZIP con texturas y licencia/constancia de descarga.
- Se identificó [Quaternius Animated Mech Pack](https://quaternius.com/packs/animatedmech.html)
  como posible alternativa CC0. No fue descargado ni elegido en sustitución
  del Vanguard; cualquier cambio requiere aprobación.

## Comprobaciones y archivos

- Diez recursos importados correctamente en **Blender 4.3.2**.
- Siete modelos completos cargados en **PlayCanvas 2.23.0 / Chromium**, con
  mallas, skinning y animaciones; cero errores en la prueba aislada final.
- Alejandro base aceptó los clips externos de reposo y caminar. La raíz de
  entidad permaneció fija al caminar en la escena de inspección.
- Informes: `inspection.json`, `blender-inspection.json`,
  `playcanvas-inspection.json` en la biblioteca.
- Vista de los originales: `/workspace/artifacts/lora25-phase2/quaternius-source-validation.png`.
  Es una prueba de importación, no una propuesta visual terminada ni aprobación.
- Herramientas reproducibles: `tools/acquire-character-library.py`,
  `tools/inspect-character-library.mjs`, `tools/inspect-character-library-blender.py`
  y `tools/check-character-library.mjs`.

No se modifica lógica, motor, ciudad, controles ni personajes publicados.
La fase 2 **no está cerrada** por Warden. Las fases 3 y 4 quedan pendientes de
autorización y sus diseños deben aprobarse antes de la integración de fase 5.
