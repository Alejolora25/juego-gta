# Juan, Sara y David — propuestas de fase 4

**Pendientes de aprobación visual.** Diseño independiente de la ciudad
publicada, preparado sobre las fuentes humanas ya validadas en fase 2.
Warden conserva Vanguard-Class Mech Titan por decisión del usuario. Falta
su archivo oficial; no forma parte de estos GLB ni se prepara otro robot.

- Juan: sudadera burdeos, gafas, ropa casual y mochila de portátil, DevOps.
- Sara: cabello castaño, ropa técnica verde petróleo, bolso y reloj, Backend.
- David: cabello gris, gafas, bata clara y tableta de diagnóstico, LAB.

Originales: Quaternius / Tomás Laulhé, Ultimate Modular Men y Women, CC0 1.0
Universal de las copias adquiridas. Enlaces oficiales, revisiones fijas de
espejos, licencias incluidas y hashes en `../../character-library/`.

Cada subcarpeta contiene una fuente Blender editable y su GLB autónomo. Se
añaden ojos con iris/pupilas, boca, detalles de ropa, gafas, bolsos y elementos
profesionales. Se conservan los cuerpos y rigs originales de 62 huesos. Las
normales se suavizan sin soldar vértices ni cambiar pesos; los detalles siguen
los huesos. Los originales descargados y Alejandro aprobado quedan intactos.

Solo se exportan `Idle`, `Interact` y `Wave`; no hay caminar/correr. El reposo
usa `Idle_Neutral`, con pies estacionarios. La animación del recurso ajusta
contacto con el suelo mediante el hueso común `Root`, que incluye ambas piernas,
sin desplazar la raíz de entidad controlada por el juego.
El frente GLB -Z corresponde al adaptador visual existente de 180°.

## Reconstruir y revisar

```sh
# Generar GLB temporales de inspección si no existen:
node tools/inspect-character-library.mjs /workspace/artifacts/lora25-phase2
blender --background --python tools/build-npc-phase4.py
node tools/package-npc-phase4.mjs
blender --background --python tools/validate-npc-phase4.py
blender --background --python tools/render-npc-phase4.py
# Servir la raíz en 127.0.0.1:4173 antes de ejecutar:
node tools/check-npc-phase4.mjs
python3 tools/finalize-npc-review.py
```

El último script graba una sesión real de Chromium; Playwright necesita su
FFmpeg instalado para esa grabación. El visor está en `review/index.html`.
Se puede cambiar personaje, vista y gesto; nunca inicia la ciudad.

`build-report.json` identifica fuentes y diseños; `package-report.json`
registra geometría/tamaño; `geometry-validation.json` comprueba 279 poses;
`chromium-report.json` registra carga y reproducción de los nueve clips.
`verification-report.json` verifica los originales, el respaldo restaurado
y los entregables aprobados de Alejandro. El vídeo elimina solo la espera
inicial de carga y registra su procedencia en `review/recording-timeline.json`.
`deliverable-checksums.json` identifica los entregables presentados.

La iluminación de estudio no representa una prueba en Samsung. La integración
en la ciudad y los puntos de misión requiere la autorización de fase 5 después
de aprobar estos diseños. El juego público conserva los personajes existentes.
