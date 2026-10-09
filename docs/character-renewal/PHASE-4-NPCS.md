# Fase 4 — diseño de personajes secundarios

Fecha: 9 de octubre de 2026. **Estado: parcial. Tres NPC preparados para
aprobación visual; Warden pendiente del recurso seleccionado.**

El usuario autorizó revisar las fases anteriores y avanzar en fase 4. Se
comprobó de nuevo la integridad del respaldo, de la copia restaurada, de los
originales humanos y del Alejandro explorador aprobado. La fase 2 sigue
parcial por Warden; este pendiente no impide diseñar los NPC sobre sus
fuentes ya validadas.

## Estado comprobado de las fases anteriores

- Fase 1 cerrada: doce entradas de SHA256SUMS satisfactorias y 142 archivos
  de la copia restaurada idénticos a la base `3e0ec79`. Los resultados de
  regresión/Chromium de esa restauración se conservan como referencia.
- Fase 2 parcial: 26 originales humanos con licencia CC0 y SHA-256 intactos.
  El archivo del Vanguard no está disponible para comprobar rig, materiales,
  animaciones y versión exacta de licencia.
- Fase 3 cerrada: Alejandro explorador aprobado por el usuario. Se verificaron
  los cinco hashes registrados en su aprobación sin modificar los entregables.

## Propuestas de los NPC

| Personaje | Base CC0 adquirida | Identidad propuesta |
| --- | --- | --- |
| Juan / DevOps | Ultimate Modular Men: Casual Hoodie | Sudadera burdeos, ropa casual, gafas, mochila de portátil, identificación y emblema de nube original. |
| Sara / Backend | Ultimate Modular Women: Casual | Pelo castaño, camiseta técnica verde petróleo, pantalón oscuro, bolso de portátil, reloj e identificación. |
| David / LAB | Ultimate Modular Men: Suit | Pelo gris, gafas, bata clara, ropa azul oscura, identificación ámbar, bolígrafos y tableta de diagnóstico. |

Se conservan cabezas y anatomía humanas de los modelos originales. Se añaden
ojos curvos con iris/pupilas, un trazo de boca, accesorios ligados al rig y
normales suavizadas sin soldar vértices ni cambiar sus pesos de animación.
Son humanos estilizados; la revisión no afirma un resultado fotorealista.

Cada NPC conserva 62 huesos y exporta solo `Idle`, `Interact` y `Wave`.
`Idle` deriva del reposo neutral original; los NPC siguen estacionarios.
La corrección del contacto pertenece a los clips del recurso. No se modifica
movimiento, control, misión, conversación, combate, colisión ni navegación.
La raíz visual exporta frente -Z para el adaptador de 180° ya existente.

Fuentes `.blend`, GLB, informes y visor independiente en
`assets/characters/npc-phase4/`. Las imágenes de estudio y de Chromium
muestran el mesh real, y el vídeo procede de su reproducción en PlayCanvas.
El visor no inicia el mundo del juego ni reemplaza sus actores.

Las pruebas geométricas evalúan 31 tiempos por clip y el desplazamiento
horizontal de los pies durante reposo. Chromium comprueba carga de los tres
modelos y clips, finitud de límites y estabilidad de sus raíces de entidad.
Estas comprobaciones aisladas no sustituyen la validación de juego completo
ni las mediciones Samsung posteriores a una integración autorizada.

## Resultado de la revisión

- 279 poses deformadas comprobadas en Blender: superficies inferiores a
  4 mm del suelo y cero desplazamiento horizontal de los pies durante reposo.
  El ajuste vertical usa el hueso común `Root`, sin mover la raíz de entidad.
- Chromium / PlayCanvas 2.23.0: tres modelos, nueve clips reproducidos,
  raíces de entidad estables y cero errores registrados. Se compara la posición
  real de las muñecas para comprobar que conversación y saludo cambian la pose.
- Regresión existente: ocho grupos de archivos satisfactorios, cero fallos.
- Juan: 9.326 triángulos, GLB de 974.808 bytes; Sara: 8.480 triángulos,
  991.236 bytes; David: 9.128 triángulos, 1.175.924 bytes. Todos conservan
  62 huesos; estos tamaños no certifican rendimiento en Samsung.
- Fuentes originales: 26 hashes intactos; Alejandro aprobado: cinco
  entregables intactos; restauración protegida: 142 archivos idénticos.
  Los 140 archivos de ejecución/recursos de la base siguen idénticos en la
  rama; las dos diferencias restantes son documentación urbana actualizada
  en fases anteriores, antes de este trabajo.

Se presentan la vista conjunta, la espalda, tres retratos, capturas del visor
y la grabación real de Chromium. Sus hashes se guardan en
`assets/characters/npc-phase4/deliverable-checksums.json`.
La bata de David abre y ensancha su borde inferior para evitar que el cierre
del traje original atraviese el pantalón al alargarlo.

## Pendiente de Warden y de cierre

El Vanguard elegido devuelve 403 al volver a consultar su ficha desde este
entorno; no se recibió el ZIP oficial. El usuario decidió expresamente:
**«Mantener Vanguard; avanzar con los NPC»**. Se conserva como recurso elegido.
Se presentó [Animated Mech Pack de Quaternius](https://quaternius.com/packs/animatedmech.html)
como alternativa, pero no se eligió ni descargó en sustitución del Vanguard.

La fase 4 se cerrará cuando Warden sea técnicamente utilizable y el usuario
apruebe los diseños. La integración pertenece a fase 5; no se promovió a main.
