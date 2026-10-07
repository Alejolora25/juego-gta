# Stage 4 character assets

Canonical location for production character art.

Each character owns a folder:
- `alejandro/` — approved protagonist concept; future rigged GLB, textures and animation clips.
- `juan/`, `sara/`, `david/` — mission NPCs.
- `warden/` — final boss.

Runtime JavaScript stays under `src/infrastructure/rendering/`; binary art belongs here. Do not commit temporary CesiumMan copies as final character art.

Expected production names per character:
- `model.glb`
- `textures/`
- `animations/` when clips are external

Alejandro visual contract: black tech jacket with blue accents, dark shirt, beige cargo pants, sneakers, gloves, smartwatch and compact backpack. Idle/walk/run must preserve a natural upright humanoid silhouette.
