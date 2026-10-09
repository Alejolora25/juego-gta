// Partial phase 5 review: four approved humans, on the existing urban pilot.
// Vanguard remains the selected Warden; its source file is still pending.
// No boss entry may replace the current robot through this human catalogue.
export const APPROVED_HUMAN_ASSETS=Object.freeze({
 alejandro:Object.freeze({id:'approved-alejandro',url:'./assets/characters/alejandro-explorer/alejandro.glb'}),
 juan:Object.freeze({id:'approved-juan',url:'./assets/characters/npc-phase4/juan/juan.glb'}),
 sara:Object.freeze({id:'approved-sara',url:'./assets/characters/npc-phase4/sara/sara.glb'}),
 david:Object.freeze({id:'approved-david',url:'./assets/characters/npc-phase4/david/david.glb'})
});

// Phase 9 derivatives preserve the approved designs, rigs and clips. Keep the
// original files and source mode available for review and recovery.
export const OPTIMIZED_HUMAN_ASSETS=Object.freeze(Object.fromEntries(
 Object.keys(APPROVED_HUMAN_ASSETS).map(key=>[key,Object.freeze({
  id:'optimized-'+key,url:`./assets/characters/runtime-optimized/${key}.glb`
 })])
));
