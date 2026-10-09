# Vanguard integrado en el piloto de Stage12

9 de octubre de 2026. Se utiliza el **Vanguard-Class Mech Titan (Game Ready)**
de ThankSang0301 elegido por el usuario, obtenido mediante la descarga
oficial de Sketchfab. El usuario autorizó expresamente adaptación, optimización
e integración en Stage12. La publicación en main y la validación en Samsung
siguen pendientes.

## Fuente y adaptación

El GLB original de 22.368.716 bytes se trasladó desde la raíz a
`assets/characters/warden-vanguard/original/vanguard.glb`, sin modificarlo.
SHA-256: `fbfd269f5d7f859f0ae7049e55488689c27fc755a4a5e328974eba7f9f01cb68`.
Licencia **CC BY 4.0** confirmada en la descarga y por el usuario; créditos,
enlaces y modificaciones se registran en el paquete y en `credits.html`,
accesible desde el inicio del juego.

El original tiene 499 mallas, ocho materiales y 42.294 triángulos, pero no
skin ni animaciones. Se conserva su silueta, geometría, colores y texturas.
En Blender se agrupan las piezas en chasis, dos brazos y dos piernas,
creando cinco articulaciones rígidas con pesos de 1.0. Es un rig mecánico
nuevo, no un rig suministrado por el autor, ni una adaptación humanoide
con rodillas y dedos articulados independientemente.

Altura: 2,65 m. Se crearon Idle, Walk, Run, Combat, Hit y Defeated. Las
animaciones de desplazamiento no trasladan la raíz: la posición sigue
controlada por el juego. La marcha tiene un ciclo de 0,8 s y la carrera de
0,6 s; el apoyo de cada pierna se ajusta en los fotogramas autorados.
`motion-validation.json` comprueba las seis acciones, incluyendo medios
fotogramas, para detectar penetración y pérdida del pie de apoyo.

## Optimización

La adaptación exporta **ocho primitivas** frente a las 499 originales y
conserva **42.294 triángulos**. Se aplican Draco secuencial y KTX2: normales
RGB UASTC lineales, otras texturas ETC1S según su espacio de color, con
mipmaps. Se deduplican texturas redundantes; quedan 28 recursos de textura.
La copia de navegador pesa aproximadamente **8,9 MB, un 60,2 % menos**
que la descarga original. El informe de compresión contiene tamaño y hash
exactos, verifica triángulos, articulaciones, pesos y muestras de animación,
y limita el error de posición a menos de 0,1 mm.

No se afirma una mejora de FPS en Samsung: la reducción comprobada es de
transferencia y superficies de dibujo del personaje. Draco mantiene la
geometría decodificada, y el coste de memoria de KTX2 depende del dispositivo.
El archivo Blender editable y el original permanecen recuperables; el GLB
intermedio y la copia temporal `.blend1` se eliminan tras la construcción.

La comparación real de contenedores en Chromium registra 167.772.120 bytes
de texturas estimados por el motor para la descarga oficial y 25.166.304
para la copia optimizada: **aproximadamente un 85 % menos**. Se comparan
recursos de textura únicos, incluidos mipmaps, dentro del mismo mundo WebGL.
Son estimaciones del motor; no representan memoria total del proceso ni una
medición de Samsung. Evidencia: `evidence/vanguard/texture-comparison.json`.

## Integración y validación

Vanguard sustituye al robot anterior exclusivamente en el piloto aprobado:
`?pilot=1&characters=approved`, incluyendo `&quality=optimized`. Los cuatro
humanos conservan sus diseños y recursos. Se ajusta el modelo 180 grados
para coincidir con la dirección -Z del controlador de persecución existente;
la etiqueta visible del enemigo es Firewall Warden.

`VanguardPresentation` observa desplazamiento, salud y cooldown existentes
para seleccionar clips: caminar cuando realmente se desplaza, reposo al
pararse, disparo, impacto y derrota. No modifica esos valores, la IA, física,
colisiones, proyectiles, misiones, diálogos ni condiciones de victoria. Sus
listeners se eliminan al destruir la escena. Las posiciones físicas se
mantienen; el adaptador de suelo sólo eleva la malla visual a la arena.

El test real de Chromium verifica que se carga este GLB, cinco huesos ligados,
ocho primitivas, clips, cambio real de pose durante la persecución, altura,
pies y orientación hacia el jugador. Conserva las comprobaciones de misiones,
colisiones, disparos, daño, victoria y reinicio, junto a los cuatro humanos.
Las capturas y registros están en `evidence/vanguard/`.

El modo normal, motor PlayCanvas 2.23.0, distribución de los distritos y
reglas del juego permanecen existentes. Falta probar y aprobar visualmente
el piloto de los cinco personajes en Samsung antes de consolidar la versión
pública; no se declaran cerradas las fases 10 y 12.
