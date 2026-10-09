# Fases 6 y 7 — revisión urbana del piloto de personajes

Fecha: 9 de octubre de 2026. **Estado: comprobación satisfactoria para los
cuatro humanos aprobados; cierre integral pendiente de Vanguard y Samsung.**

Se revisó Alejandro explorador junto a Juan, Sara y David en la ciudad
existente de PlayCanvas 2.23.0, mediante `/?pilot=1&characters=approved`.
La revisión conserva los cuatro distritos y los 83 edificios aprobados.
Warden sigue siendo el robot del piloto anterior únicamente para comprobar
el acceso al encuentro; no representa el Vanguard elegido.

## Circulación y colisiones

Un único mundo real de Chromium recorrió cuatro rutas continuas, muestreando
el resolver existente de Rapier cada 0,25 m. El recorrido suma **1.455 m y
5.820 pasos**, sin entrar en edificios, pilares ni los límites visuales de los
18 árboles existentes.

| Ruta | Distancia | Pasos | Separación mínima de un obstáculo |
| --- | ---: | ---: | ---: |
| Centro → Juan | 278,5 m | 1.114 | 3 m |
| Industrial → Sara | 316 m | 1.264 | 2 m |
| Canales → David | 356 m | 1.424 | 2 m |
| Mirador → arena | 504,5 m | 2.018 | 1,9 m |

La separación indicada es la distancia desde el centro del jugador hasta
el rectángulo del obstáculo. Cada paso también comprobó el margen de 0,55 m
que utiliza el resolver del jugador. La ruta de Mirador pasa por X=±58 para
evitar sus jardines; la entrada a la arena utiliza X=4 para rodear el pilar
norte existente.

Se compararon los **107 colisionadores estáticos** con sus huellas aprobadas:
83 edificios y 24 pilares de arena. Posición y semiextensiones coinciden.
Las **428 aproximaciones**, una desde cada lado de cada obstáculo, quedaron
bloqueadas correctamente. Los árboles cumplen las reglas actuales de despeje
de vías, puntos de misión y edificios; continúan siendo decorativos, sin
incorporar nuevos colisionadores.

## Accesos e interacciones

Juan, Sara y David permanecen fuera de las huellas de colisión y en `Idle`,
con sus posiciones originales intactas. Las rutas llegaron a **1,5 m** de
cada personaje, dentro del rango existente de interacción de 4 m.

Los callbacks actuales completaron las tres misiones en orden, invocaron los
tres diálogos y llevaron el estado a etapa 3 y XP 300. Al terminar en
`(4, 0, -132)`, el encuentro existente de arena se activó y quedó fijado al
enemigo. No se modificaron posiciones de misión, objetivos ni reglas de
combate.

## Altura y encaje de los personajes

La raíz de juego de Alejandro y las tres raíces de NPC se mantienen en
**Y=0**. En los 5.820 pasos se verificó que el desplazamiento del modelo
visual coincidiera con la superficie plana existente bajo su raíz. Los
límites deformados del humano se comprobaron además en los puntos de giro,
con altura coherente y sin penetraciones mayores de 5 cm según esa medición.

Los puntos registrados incluyen calzadas de 5 y 6 cm, pavimento de distrito
a −2 cm, anteplazas de misión a 5,5 cm, terreno a −8 cm y arena a 14 cm.
Son alturas de soporte visual; el suelo físico, los cuerpos de Rapier y
la lógica de desplazamiento conservan su configuración existente. Los
adornos elevados de la arena quedan fuera del cálculo de soporte.

## Evidencia y límites

El resultado completo está en
[report.json](evidence/urban-routes/report.json). La comprobación registró
cero errores de página, huellas de colisión sin cambios y posiciones de NPC
sin cambios. SHA-256 de las huellas revisadas:

`dd5af8b8808536326d61c701fff322a50e0edb78624d3a242671c2fa31d1eb6f`.

Para reproducirla con esta rama servida en `127.0.0.1:4173`, ejecutar
`node tools/check-approved-urban-routes.mjs`. El script utiliza Chromium de
`/usr/bin/chromium`; el informe registra cuándo se realizó la comprobación.

Este trabajo añade un script y su evidencia. No modifica la ciudad, los
modelos originales, la programación del juego ni su navegación. La prueba
evalúa el resolver de movimiento y el encaje geométrico; no acredita un
recorrido manual con controles táctiles, comodidad de cámara ni rendimiento
en teléfono. Los límites visuales se muestrean sin renderizar una nueva
captura en cada paso.

Siguen pendientes el archivo oficial y la adaptación del Vanguard, revisar
estos recorridos con los cinco personajes definitivos y validar el piloto
en Samsung. Esta comprobación no declara cerradas globalmente las fases 6
y 7 ni autoriza la publicación en main.
