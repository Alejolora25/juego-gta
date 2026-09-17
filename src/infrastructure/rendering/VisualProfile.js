export const VISUAL_PROFILES = Object.freeze({
  mobile: Object.freeze({ pixelRatio: 1.15, shadowMapSize: 1024, shadowRadius: 2, exposure: 1.06, fogDensity: 0.0036 }),
  balanced: Object.freeze({ pixelRatio: 1.4, shadowMapSize: 1536, shadowRadius: 2.5, exposure: 1.08, fogDensity: 0.0033 }),
  high: Object.freeze({ pixelRatio: 1.65, shadowMapSize: 2048, shadowRadius: 3, exposure: 1.1, fogDensity: 0.003 })
});

export function selectVisualProfile({ width = 1280, devicePixelRatio = 1, deviceMemory = 4 } = {}) {
  if (width <= 520 || deviceMemory <= 3) return VISUAL_PROFILES.mobile;
  if (width >= 1000 && devicePixelRatio <= 2 && deviceMemory >= 6) return VISUAL_PROFILES.high;
  return VISUAL_PROFILES.balanced;
}

export function getVisualCapabilities({ webgl2 = true, reducedMotion = false } = {}) {
  return Object.freeze({
    physicallyBasedMaterials: true,
    softShadows: true,
    proceduralTextures: true,
    postProcessing: webgl2 && !reducedMotion,
    animatedAtmosphere: !reducedMotion
  });
}
