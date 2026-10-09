# Fase 3 — diseño de Alejandro

La ejecución de esta fase fue autorizada expresamente el 9 de octubre de 2026.
Se trabaja sobre `stage9-alejandro-design`; la base pública continúa en
`3e0ec79613a548fc0013ef60663dd22cd3cfdce5`.

## Diseño aprobado

La base Quaternius Standard validada en fase 2 se adaptó como ingeniero urbano:
peinado castaño, rostro afeitado con ojos modelados, chaqueta técnica oscura,
camiseta clara, pantalón grafito, zapatillas, reloj, identificación y mochila
de portátil. La ropa tiene superficies y detalles ligados al rig original.
No se reutilizó la representación procedural del protagonista.

El esqueleto mantiene 65 huesos. Se prepararon diez clips, con nombres exactos
para el contrato de animación existente. Se retargetizaron deltas de pose local
manteniendo las longitudes y el bind del cuerpo destino. Se corrigió contacto
en la geometría final, incluida la interpolación entre fotogramas. El rumbo y
desplazamiento siguen reservados a la programación existente.

El visor independiente aplica el mismo adaptador visual de 180° del piloto.
Se proporciona frente, perfil y espalda, y reproducción de los clips. No crea
la ciudad ni cambia sus personajes actuales.

## Evidencia y alcance

- Fuente editable, GLB, créditos, informes y vistas en
  `assets/characters/alejandro-phase3/`.
- `geometry-validation.json`: deformación real del mesh en 31 tiempos por clip,
  contacto de suelas y posición mínima del cuerpo en derrota.
- `chromium-report.json`: carga PlayCanvas, diez clips, límites finitos y raíz
  de entidad fija durante la reproducción.
- `package-report.json`: tamaño, geometría, materiales, huesos y texturas reales.
- Herramientas de construcción, empaquetado, render y validación versionadas.
- Los archivos fuente originales de fase 2 mantienen sus hashes.

La biblioteca de Warden sigue pendiente en fase 2 y no afecta a las fuentes ya
validadas de Alejandro. No se trabajó en fase 4 ni se integró el nuevo personaje
en fase 5. No se modificó motor, programación, mapa ni recursos publicados.

**Fase 3 cerrada: aprobación visual recibida el 9 de octubre de 2026**
con el mensaje «Si la apruebo». La decisión corresponde al rostro, ropa,
accesorios y animaciones mostradas del commit `a8194d6`. El registro
`assets/characters/alejandro-phase3/approval.json` identifica los entregables
por SHA-256; el modelo y las imágenes aprobados se conservan sin cambios. Las pruebas de Samsung y de juego
completo se realizarán tras una integración autorizada; la prueba aislada no
las sustituye.

Resultado: 310 poses muestreadas sin penetración del suelo; suelas de los
clips de pie entre 2,6 y 19,1 mm. GLB de 3,38 MB, 30.967 triángulos y 11
materiales. Diez clips cargados en Chromium sin errores; raíz de entidad fija.
Vídeo de revisión en `review/alejandro-motion.mp4`. No son mediciones Samsung.
