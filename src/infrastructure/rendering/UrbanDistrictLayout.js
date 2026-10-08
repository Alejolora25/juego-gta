// Visual placement only. These are the existing road and mission coordinates,
// not a replacement for controls, mission logic or physics movement semantics.
export const URBAN_ROADS={vertical:[-86,0,86],horizontal:[-138,-70,0,70,138],halfWidth:7};
export const URBAN_MISSION_POINTS=[{x:0,z:108},{x:-28,z:74},{x:98,z:-12},{x:-108,z:54}];
export const URBAN_DISTRICTS=[
 {id:'pasto',name:'Centro',xs:[-49,-37,-25,25,37,49],zs:[90,108,124]},
 {id:'canales',name:'Canales',xs:[-142,-130,-118,-106],zs:[-50,-34,-18,16,32,48]},
 {id:'industrial',name:'Distrito Industrial',xs:[106,118,130,142],zs:[-50,-34,-18,16,32,48]},
 {id:'mirador',name:'Mirador',xs:[-42,-30,-18,18,30,42],zs:[-110,-92,-50]}
];
export const overlaps=(a,b,padding=0)=>Math.abs(a.x-b.x)<(a.width+b.width)/2+padding&&Math.abs(a.z-b.z)<(a.depth+b.depth)/2+padding;
export function clearUrbanPlacement(b){
 const hw=b.width/2,hd=b.depth/2;
 if(URBAN_ROADS.vertical.some(x=>Math.abs(b.x-x)<hw+8))return false;
 if(URBAN_ROADS.horizontal.some(z=>Math.abs(b.z-z)<hd+8))return false;
 if(URBAN_MISSION_POINTS.some(p=>Math.abs(b.x-p.x)<hw+5&&Math.abs(b.z-p.z)<hd+5))return false;
 return Math.hypot(b.x,b.z+150)>46+Math.hypot(hw,hd);
}
export function createUrbanDistrictLayout(seed){
 const buildings=seed.map((b,i)=>({...b,id:'pilot-'+i,district:'pasto',archetype:i}));
 for(const d of URBAN_DISTRICTS)for(const x of d.xs)for(const z of d.zs){
  const b={id:`${d.id}-${x}-${z}`,district:d.id,x,z,width:6,depth:8,archetype:buildings.length%6};
  if(clearUrbanPlacement(b)&&!buildings.some(p=>overlaps(p,b,2)))buildings.push(b);
 }
 validateUrbanDistrictLayout(buildings);return {buildings,roads:URBAN_ROADS,districts:URBAN_DISTRICTS};
}
export function validateUrbanDistrictLayout(buildings){
 for(let i=0;i<buildings.length;i++){
  const b=buildings[i];
  if(!clearUrbanPlacement(b))throw new Error('Building blocks protected corridor: '+b.id);
  for(let j=i+1;j<buildings.length;j++)if(overlaps(b,buildings[j]))throw new Error('Overlapping urban buildings');
 }
 return true;
}
