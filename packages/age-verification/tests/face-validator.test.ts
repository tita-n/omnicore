import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateFaces, createDefaultValidationConfig } from '../src/services/face-validation/FaceValidator.js';
import type { FaceDetection } from '../src/interfaces/FaceDetector.js';

function makeFaceDetection(overrides: Partial<FaceDetection> = {}): FaceDetection {
  return {
    boundingBox: { x: 100, y: 100, width: 200, height: 250 },
    landmarks: [],
    confidence: 0.95,
    ...overrides,
  };
}

void describe('FaceValidator', () => {
  const config = createDefaultValidationConfig();
  const videoWidth = 640;
  const videoHeight = 480;

  void it('passes with a single valid face', () => {
    const result = validateFaces([makeFaceDetection()], videoWidth, videoHeight, config);
    assert.equal(result.passed, true);
    assert.equal(result.errors.length, 0);
    assert.ok(result.validatedDetection !== null);
  });

  void it('rejects when no face detected', () => {
    const result = validateFaces([], videoWidth, videoHeight, config);
    assert.equal(result.passed, false);
    assert.equal(result.errors[0]?.code, 'NO_FACE');
    assert.equal(result.validatedDetection, null);
  });

  void it('rejects when multiple faces detected', () => {
    const result = validateFaces(
      [makeFaceDetection(), makeFaceDetection({ boundingBox: { x: 400, y: 100, width: 150, height: 200 } })],
      videoWidth,
      videoHeight,
      { ...config, maxFaces: 1 }
    );
    assert.equal(result.passed, false);
    assert.equal(result.errors[0]?.code, 'MULTIPLE_FACES');
  });

  void it('rejects face that is too small', () => {
    const result = validateFaces(
      [makeFaceDetection({ boundingBox: { x: 100, y: 100, width: 30, height: 40 } })],
      videoWidth,
      videoHeight,
      { ...config, minFaceSize: 100 }
    );
    assert.equal(result.passed, false);
    assert.equal(result.errors[0]?.code, 'FACE_TOO_SMALL');
  });

  void it('rejects face outside frame (too close to left edge)', () => {
    const result = validateFaces(
      [makeFaceDetection({ boundingBox: { x: 2, y: 100, width: 200, height: 250 } })],
      videoWidth,
      videoHeight,
      { ...config, marginRatio: 0.05 }
    );
    assert.equal(result.passed, false);
    assert.equal(result.errors[0]?.code, 'FACE_OUTSIDE_FRAME');
  });

  void it('allows multiple faces when maxFaces > 1', () => {
    const config2 = { ...config, maxFaces: 2 };
    const result = validateFaces(
      [makeFaceDetection(), makeFaceDetection({ boundingBox: { x: 400, y: 100, width: 150, height: 200 } })],
      videoWidth,
      videoHeight,
      config2
    );
    assert.equal(result.passed, true);
    assert.equal(result.errors.length, 0);
  });

  void it('createDefaultValidationConfig returns sensible defaults', () => {
    const cfg = createDefaultValidationConfig();
    assert.equal(cfg.minFaceSize, 100);
    assert.equal(cfg.maxFaces, 1);
    assert.equal(cfg.marginRatio, 0.05);
  });
});
