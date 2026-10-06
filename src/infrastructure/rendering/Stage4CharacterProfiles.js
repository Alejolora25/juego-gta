export const STAGE4_CHARACTER_PROFILES={
 player:{role:'player',scale:[1,1,1],tint:[.22,.48,.82],metalness:.05,gloss:.45},
 juan:{role:'npc',scale:[.94,.94,.94],tint:[.18,.62,.42],metalness:.02,gloss:.35},
 sara:{role:'npc',scale:[.92,.92,.92],tint:[.72,.28,.52],metalness:.02,gloss:.40},
 david:{role:'npc',scale:[.98,.98,.98],tint:[.78,.52,.18],metalness:.03,gloss:.32},
 warden:{role:'boss',scale:[1.18,1.18,1.18],tint:[.12,.16,.22],metalness:.72,gloss:.82,emissive:[.75,.06,.04]}
};

export function applyCharacterProfile(entity,profile){
 if(!entity||!profile)return entity;
 entity.setLocalScale(...profile.scale);
 const renders=entity.findComponents?.('render')??[];
 for(const render of renders)for(const meshInstance of render.meshInstances??[]){
  const source=meshInstance.material;
  const material=source?.clone?.()??source;
  if(!material)continue;
  if(material.diffuse&&profile.tint)material.diffuse.set(...profile.tint);
  if('metalness' in material)material.metalness=profile.metalness??material.metalness;
  if('gloss' in material)material.gloss=profile.gloss??material.gloss;
  if(material.emissive&&profile.emissive){material.emissive.set(...profile.emissive);material.emissiveIntensity=1.4;}
  material.update?.();meshInstance.material=material;
 }
 return entity;
}
