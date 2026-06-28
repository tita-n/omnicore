import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultConfig, validateConfig, isConfigValid } from '../src/config/index.js';

void describe('Config', () => {
  void it('defaultConfig has valid structure', () => {
    assert.ok(defaultConfig.camera.maxWidth > 0);
    assert.ok(defaultConfig.camera.captureIntervalMs >= 50);
    assert.ok(defaultConfig.faceDetection.minConfidence > 0);
    assert.ok(defaultConfig.quality.minimumOverall > 0);
    assert.ok(defaultConfig.confidence.minimumOverall > 0);
    assert.ok(Array.isArray(defaultConfig.pipeline.steps));
    assert.ok(defaultConfig.pipeline.steps.length > 0);
  });

  void it('isConfigValid returns true for default config', () => {
    assert.equal(isConfigValid(defaultConfig), true);
  });

  void it('validateConfig catches invalid camera width', () => {
    const invalid = { ...defaultConfig, camera: { ...defaultConfig.camera, maxWidth: 0 } };
    const errors = validateConfig(invalid);
    assert.ok(errors.length > 0);
    assert.ok(errors.some(e => e.includes('maxWidth')));
  });

  void it('validateConfig catches invalid pipeline steps', () => {
    const invalid = { ...defaultConfig, pipeline: { ...defaultConfig.pipeline, steps: [] } };
    const errors = validateConfig(invalid);
    assert.ok(errors.some(e => e.includes('steps')));
  });

  void it('validateConfig catches invalid confidence', () => {
    const invalid = { ...defaultConfig, confidence: { ...defaultConfig.confidence, minimumOverall: 1.5 } };
    const errors = validateConfig(invalid);
    assert.ok(errors.some(e => e.includes('confidence.minimumOverall')));
  });
});
