import test from 'node:test';
import assert from 'node:assert/strict';
import { VISUAL_PROFILES, selectVisualProfile, getVisualCapabilities } from '../src/infrastructure/rendering/VisualProfile.js';

test('small mobile screens select conservative graphics', () => {
  assert.equal(selectVisualProfile({ width: 412, devicePixelRatio: 3, deviceMemory: 8 }), VISUAL_PROFILES.mobile);
  assert.equal(VISUAL_PROFILES.mobile.shadowMapSize, 1024);
});

test('desktop class devices can select high graphics', () => {
  assert.equal(selectVisualProfile({ width: 1440, devicePixelRatio: 2, deviceMemory: 8 }), VISUAL_PROFILES.high);
});

test('unknown mid-range devices stay balanced', () => {
  assert.equal(selectVisualProfile({ width: 800, devicePixelRatio: 2, deviceMemory: 4 }), VISUAL_PROFILES.balanced);
});

test('reduced motion disables optional animated visual effects', () => {
  const caps = getVisualCapabilities({ webgl2: true, reducedMotion: true });
  assert.equal(caps.postProcessing, false);
  assert.equal(caps.animatedAtmosphere, false);
  assert.equal(caps.physicallyBasedMaterials, true);
});
