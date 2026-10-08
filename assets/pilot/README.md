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

`npm run assets:pilot` (requires Blender and installed npm dependencies).

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
KTX2 GPU texture compression remains pending. Embedded
512px JPEG textures are not GPU-compressed textures.

Initial Samsung review approved the humanoid facing and Warden rig fixes.
The four-district rollout needs a new Samsung review. Automated Chromium
screenshots cannot certify mobile GPU performance.
`node tools/check-urban-districts.mjs` produces four district screenshots and
checks complete protected road sweeps in Rapier.
