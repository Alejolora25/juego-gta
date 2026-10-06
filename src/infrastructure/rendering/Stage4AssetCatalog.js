const cesiumMan={
 id:'cesium-man',
 url:'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb',
 license:'CC-BY-4.0',
 attribution:'Cesium / Khronos glTF Sample Assets',
 purpose:'rigged-humanoid-pipeline-validation'
};

export const STAGE4_ASSETS={
 player:{...cesiumMan,id:'stage4-player-rig',purpose:'temporary-player-rig-validation'},
 npc:{...cesiumMan,id:'stage4-npc-rig',purpose:'temporary-npc-rig-validation'},
 warden:{...cesiumMan,id:'stage4-warden-rig',purpose:'temporary-boss-rig-validation'},
 humanoid:cesiumMan
};

export function stage4AssetFor(role='npc'){
 if(role==='player')return STAGE4_ASSETS.player;
 if(role==='boss'||role==='warden')return STAGE4_ASSETS.warden;
 return STAGE4_ASSETS.npc;
}
