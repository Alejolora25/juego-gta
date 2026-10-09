# Alejandro — diseño aprobado de fase 3

Estado: **aprobado visualmente por el usuario el 9 de octubre de 2026**.
Fase 3 cerrada; decisión y hashes de los entregables en `approval.json`. Esta carpeta conserva
un personaje y una escena de revisión independientes. No sustituye al Alejandro
publicado ni modifica el controlador, la ciudad o las misiones.

## Diseño y procedencia

Humano adulto con cabello castaño peinado de lado, rostro afeitado, chaqueta
técnica azul oscura con ribetes discretos, camiseta marfil, pantalón grafito,
zapatillas, identificación, reloj y mochila compacta para portátil. Es una
propuesta humana estilizada, no un modelo fotorealista ni una copia de CJ.

- Base: **Quaternius / Tomás Laulhé, Universal Base Characters Standard**,
  Superhero Male. [Ficha](https://quaternius.com/packs/universalbasecharacters.html).
- Pelo: Simple Parted del mismo kit. Huesos, ojos, rostro y manos auténticos
  del recurso, conservados en la adaptación.
- Animaciones: **Quaternius Universal Animation Library Standard**, versión
  sin root motion. [Ficha](https://quaternius.com/packs/universalanimationlibrary.html).
- Licencia de las copias utilizadas: **CC0 1.0 Universal**. Textos originales,
  procedencia fija y SHA-256 en `assets/character-library/`.
- Modificaciones del proyecto: prendas y accesorios modelados, cortes precisos
  de superficies con UV/pesos interpolados, colores, ajuste de cejas, asignación
  de materiales, retargetización, transiciones de giro y corrección de contacto.
  Los originales descargados permanecen sin modificaciones.

Se conserva el esqueleto de 65 huesos y las longitudes del cuerpo destino.
Los detalles de ropa y los accesorios siguen ese esqueleto. El GLB exporta
frente hacia **-Z**: corresponde al adaptador visual de 180° que ya utiliza el
piloto, sin cambiar el cálculo de rumbo del jugador.

## Entregables

- `alejandro.blend`: escena editable con imágenes empaquetadas y diez acciones
  en pistas NLA independientes. No requiere acceder al espejo para abrirla.
- `alejandro.glb`: exportación autónoma compatible con PlayCanvas, con piel,
  ropa, pelo, ojos, rig y los diez clips.
- `review/`: visor aislado, vídeo MP4, vistas de estudio del modelo real y capturas de
  Chromium. Las imágenes no son conceptos generados aparte del activo 3D.
- `build-report.json`, `package-report.json`, `geometry-validation.json` y
  `chromium-report.json`: construcción y comprobaciones.

Clips: Idle, Walk, Run, Interact, Combat, Shoot, Hit, Defeated, TurnLeft y
TurnRight. Los nombres se seleccionaron para el contrato actual; no se entrega
el conjunto completo que escogería Crouch Idle por coincidencia de nombres.
Los giros superiores no cambian el rumbo de la raíz del jugador. Las acciones
de combate utilizan las poses de la biblioteca como propuesta revisable;
no se añadieron armas ni reglas nuevas al juego.

## Reconstruir y comprobar

```sh
node tools/inspect-character-library.mjs /workspace/artifacts/lora25-phase2
blender --background --factory-startup --python tools/build-alejandro-phase3.py
node tools/package-alejandro-phase3.mjs
blender --background --factory-startup --python tools/validate-alejandro-phase3.py
blender --background --factory-startup --python tools/render-alejandro-phase3.py
```

Para Chromium, servir la raíz del repositorio en `127.0.0.1:4173` y ejecutar
`node tools/check-alejandro-phase3.mjs`. El inspector usa PlayCanvas 2.23.0
instalado mediante npm en lugar del CDN. La escena nunca inicia el juego.
El visor habitual está en `/assets/characters/alejandro-phase3/review/`.

La validación geométrica evalúa las superficies deformadas en 31 tiempos por
clip. El empaquetado deduplica muestras, conserva animaciones en formato glTF
normal y adapta texturas; no introduce dependencia de Draco o Basis en este
visor. El `.blend` conserva las imágenes de autoría.

Pendiente: integración autorizada de fase 5,
ritmo de animación respecto a las velocidades existentes, revisión en la ciudad
y mediciones/validación Samsung de las fases posteriores. Las vistas de estudio
usan iluminación de revisión; no certifican el aspecto de la ciudad en Samsung.

Resultado técnico: GLB de 3.384.876 bytes, 30.967 triángulos y 11 materiales.
Las 310 poses muestreadas mantienen toda la geometría sobre el suelo; en los
clips de pie, el punto más bajo de las suelas permanece entre 2,6 y 19,1 mm.
Chromium cargó los diez clips sin errores y la raíz de entidad permaneció fija.
No se han medido todavía FPS o memoria en Samsung.
