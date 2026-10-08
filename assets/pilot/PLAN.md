# Visual rebuild progress

1. Backup: local branch `backup-stage6-before-assets-20261008` preserves
   `8f81c40`. Default Stage 6 entrypoint remains unchanged. Gameplay rules,
   mission progression and controls are not being redesigned.
2. Blender pilot: six measured buildings, street and separate sidewalks done.
3. Alejandro: rigged humanoid GLB and idle/walk/run integrated. Prototype art;
   final character appearance still requires visual approval.
4. NPCs/Warden: three human outfit variants and animated robot integrated.
   Not four bespoke finished characters; mobile visual approval pending.
5. District rollout: initial Samsung review approved character movement/rig.
   Four districts (83 buildings), two adapted CC0 external house models plus
   original facade modules, real surface textures, trees and lamps implemented.
   This version needs its own visual/mobile acceptance; art is still stylized.
6. Separation: all four visual districts use the same validated placement list
   for solid building footprints. Road corridors, mission approach clearances
   and arena exclusions are validated before spawning meshes/physics objects.
   Complete road sweeps checked in Chromium/Rapier; no new navigation AI claimed.
7. Lighting/optimization: shared baked UV1 lightmap, character contact shadows,
   building high/low LOD and Draco implemented city-wide. Atlas UV target,
   geometry triangulation and diffuse sky floor corrected; surfaces use shared
   scanned materials. KTX2 texture compression pending.
8. Validation: local Chromium checks and screenshots done. Initial Samsung
   review confirmed improvement but reported reversed human facing and Warden
   appearance issues. Human visual heading corrected without changing controls;
   Warden original rig retained. Samsung approved these fixes; the subsequent
   district rollout requires another device review.

The pilot is opt-in with `?pilot=1`; initial pilot commit `89193c4` was promoted
to main after CI #294 passed. Later fixes must pass CI before promotion.
