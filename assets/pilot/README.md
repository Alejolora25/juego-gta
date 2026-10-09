# Urban pilot — review before map rollout

Use `?pilot=1` on the game URL. The normal entrypoint continues to use Stage 6.
The approved street prototype now extends to four modular districts. This is
still stylized prototype art, not a photorealistic or final city.

## Assets and licenses

- `source/human.glb`: Quaternius rigged human, CC0, obtained from
  https://github.com/UMRAM-Bilkent/supine-human-model/blob/main/assets/human.glb.
  The upstream README and LICENSE identify the model as CC0:
  https://github.com/UMRAM-Bilkent/supine-human-model.
- `source/robot.glb`: RobotExpressive by Tomás Laulhé / Quaternius, CC0 1.0;
  modifications by Don McCurdy. Source and licensing statement:
  https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive.
- Two original facade meshes, two adapted Kenney CC0 house models, Kenney trees
  and street lamps. Material textures are ambientCG CC0 scans. Exact sources
  and original licenses: `source/references/README.md`.

Alejandro, Juan, Sara and David are clothed/color-separated variants of one
base human. Sara has adjusted torso proportions. These are prototype variants,
not four independently modeled final characters. Warden is an armored robot
prototype, not a final bespoke villain.

## Rebuild

`npm run assets:pilot` requires Blender, installed npm dependencies and
Khronos KTX-Software 4.4.2 (`toktx` on PATH, or `TOKTX_BIN` pointing to the
executable). Official releases: https://github.com/KhronosGroup/KTX-Software/releases.
This is an offline art build; normal game startup and CI consume committed
assets and do not need Blender or KTX-Software.

The `.blend` files preserve editable source scenes. GLB files are self-contained;
the game does not contact an external model host. Animation clip names and source
bind transforms are preserved. Gameplay roots stay at ground level.

The 78 × 52 metre pilot contains six 6 × 8 metre buildings, a 14 metre road,
separate sidewalks and lamp posts. Collision footprints come from the same
placement list and do not overlap the central road or mission characters.
`UrbanDistrictLayout.js` extends those six prototypes to 83 buildings, with
four districts, protected road corridors and mission approaches. Only the
approved arena colliders are retained from the old visual city.

## Validation and remaining work

`node tools/check-urban-pilot.mjs` requires a local HTTP server on port 4173 and
Chromium at `/usr/bin/chromium`. It checks animation semantics and rendered bounds
and produces screenshots under `/tmp`.

Static lighting is baked in Blender into a shared 1024px UV1 atlas. Character
contact shadows remain dynamic. Each building has high/low geometry, switching
at 35 metres and culling at 180 metres without changing collision footprints.
Trees and lamp meshes cull at 110 metres; roads and collision data never cull.
Runtime GLBs use Draco geometry compression with a locally hosted decoder
(Google Draco, Apache 2.0; see assets/vendor/draco/LICENSE).
Large runtime color maps and the linear irradiance atlas use ETC1S KTX2;
RGB normal maps use UASTC/Zstd KTX2. All contain offline mip chains. Tiny
character/prop atlases and the UV1 carrier keep their original format.
The local Basis transcoder chooses a supported GPU format and falls back to
uncompressed pixels when the device lacks compression support. This makes
texture VRAM savings device-dependent. Decoder sources/license:
`assets/vendor/basis/README.md`.

Matched four-district Chromium tours measured 35,102,828 texture VRAM bytes
before and 7,665,436 after compression, approximately 78% less estimated
allocated texture memory. This does not measure Samsung VRAM or frame rate.
The 13 textured runtime GLBs grow from 1.19 MB to 2.06 MB to preserve normals
and supply complete mipmaps; the decoder adds 0.58 MB, and the irradiance atlas
is 44 KB. GPU memory and network download size are separate budgets. Each
building chunk still stays below 350 KB.

Initial Samsung review approved the humanoid facing and Warden rig fixes.
Samsung also approved the four-district layout and new facade textures.
Samsung approved the compressed-texture update at `3e0ec79`; small building
appearance latency remains nonblocking. Automated Chromium screenshots cannot
certify mobile GPU performance. Character renewal status and source validation
are recorded under `docs/character-renewal/`.
`node tools/check-urban-districts.mjs` produces four district screenshots and
checks complete protected road sweeps in Rapier.
