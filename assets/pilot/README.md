# Urban pilot — review before map rollout

Use `?pilot=1` on the game URL. The normal entrypoint continues to use Stage 6.
This is a deliberately limited street prototype, not the completed city.

## Assets and licenses

- `source/human.glb`: Quaternius rigged human, CC0, obtained from
  https://github.com/UMRAM-Bilkent/supine-human-model/blob/main/assets/human.glb.
  The upstream README and LICENSE identify the model as CC0:
  https://github.com/UMRAM-Bilkent/supine-human-model.
- `source/robot.glb`: RobotExpressive by Tomás Laulhé / Quaternius, CC0 1.0;
  modifications by Don McCurdy. Source and licensing statement:
  https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive.
- Buildings, embedded facade/ground textures and street layout: original assets
  created in this repository using `tools/build-urban-pilot.py`.

Alejandro, Juan, Sara and David are clothed/color-separated variants of one
base human. Sara has adjusted torso proportions. These are prototype variants,
not four independently modeled final characters. Warden is an armored robot
prototype, not a final bespoke villain.

## Rebuild

`blender --background --factory-startup --python tools/build-urban-pilot.py`

The `.blend` files preserve editable source scenes. GLB files are self-contained;
the game does not contact an external model host. Animation clip names and source
bind transforms are preserved. Gameplay roots stay at ground level.

The 78 × 52 metre pilot contains six 6 × 8 metre buildings, a 14 metre road,
separate sidewalks and lamp posts. Collision footprints come from the same
placement list and do not overlap the central road or mission characters.

## Validation and remaining work

`node tools/check-urban-pilot.mjs` requires a local HTTP server on port 4173 and
Chromium at `/usr/bin/chromium`. It checks animation semantics and rendered bounds
and produces screenshots under `/tmp`.

Current lighting uses the existing renderer plus soft character contact shadows.
Offline static lightmaps, district rollout, building LOD meshes and KTX2/mesh
compression remain pending. Embedded 512px JPEG textures and shared static
materials are implemented; do not describe these as completed GPU compression.

Samsung acceptance must happen on the actual device before replacing the rest
of the city. Automated Chromium screenshots cannot certify mobile GPU performance.
