# CC0 urban references used in the game

Downloaded from https://github.com/petroulacl/fps-buildings-env-kit on 2026-10-08.
The mirror README attributes each pack; original publishers were checked:

- `kenney-house-a.glb`, `kenney-house-c.glb`, `Textures/colormap.png`:
  Kenney Modular Buildings 2.1, https://kenney.nl/assets/modular-buildings.
  Original included license: KENNEY-LICENSE.txt (CC0).
- `vegetation/`: Kenney City Kit Suburban, source tree and atlas; included
  LICENSE.txt. Converted into self-contained `district-tree.glb`.
- `street/`: Kenney City Kit Roads, curved street lamp and atlas; included
  LICENSE.txt. Converted into self-contained `district-lamp.glb`.
- `asphalt.jpg`: ambientCG Asphalt021, `brick.jpg`/`brick-normal.jpg`:
  Bricks066, `concrete.jpg`: Concrete012, `grass.jpg`: Grass004.
  Source asset pages: https://ambientcg.com/view?id=Asphalt021,
  https://ambientcg.com/view?id=Bricks066,
  https://ambientcg.com/view?id=Concrete012,
  https://ambientcg.com/view?id=Grass004.
  ambientCG's official site states all assets are CC0:
  https://ambientcg.com/index.php (license link: https://docs.ambientcg.com/license/).

Kenney meshes remain stylized, not photogrammetric buildings. Two original
facade modules are combined with two adapted external house models. Wall,
ground and pavement color maps use the actual ambientCG source images.
Runtime textures are resized/embedded and GPU-compressed with KTX2/Basis;
geometry is compressed with Draco. Original reference images remain editable.
Source files are not runtime downloads. No runtime asset depends on this mirror.

Poly Haven urban facade models were researched (CC0:
https://polyhaven.com/license and
https://polyhaven.com/a/modular_urban_apartments_facade) but not integrated.
Do not present them as downloaded or used in this build.
