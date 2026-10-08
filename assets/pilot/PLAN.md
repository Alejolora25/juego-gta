# Visual rebuild progress

1. Backup: local branch `backup-stage6-before-assets-20261008` preserves
   `8f81c40`. Default Stage 6 entrypoint remains unchanged. Gameplay rules,
   mission progression and controls are not being redesigned.
2. Blender pilot: six measured buildings, street and separate sidewalks done.
3. Alejandro: rigged humanoid GLB and idle/walk/run integrated. Prototype art;
   final character appearance still requires visual approval.
4. NPCs/Warden: three human outfit variants and animated robot integrated.
   Not four bespoke finished characters; mobile visual approval pending.
5. District rollout: deferred until the pilot passes Samsung review.
6. Separation: pilot visuals and building collision footprints separated;
   central movement corridor checked in Chromium. Full-map navigation review
   remains pending; no new navigation system is claimed.
7. Lighting/optimization: shared baked UV1 lightmap, character contact shadows,
   building high/low LOD and Draco implemented. KTX2 texture compression pending.
8. Validation: local Chromium checks and screenshots done. Initial Samsung
   review confirmed improvement but reported reversed human facing and Warden
   appearance issues. Human visual heading corrected without changing controls;
   Warden export animation tracks isolated. Further visual review is required.

The pilot is opt-in with `?pilot=1`; initial pilot commit `89193c4` was promoted
to main after CI #294 passed. Later fixes must pass CI before promotion.
