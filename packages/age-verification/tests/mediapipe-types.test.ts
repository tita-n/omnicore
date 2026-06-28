import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mpDetectionToFaceDetection } from '../src/services/face-detection/MediaPipeTypes.js';

void describe('MediaPipeTypes', () => {
  void it('maps a MediaPipe detection to FaceDetection', () => {
    const mpDetection = {
      boundingBox: { originX: 50, originY: 60, width: 200, height: 250 },
      keypoints: [
        { x: 100, y: 120 },
        { x: 180, y: 120 },
        { x: 140, y: 160 },
        { x: 140, y: 200 },
        { x: 70, y: 150 },
        { x: 210, y: 150 },
      ],
      categories: [{ score: 0.95 }],
    };

    const result = mpDetectionToFaceDetection(mpDetection, 640, 480);

    assert.equal(result.boundingBox.x, 50);
    assert.equal(result.boundingBox.y, 60);
    assert.equal(result.boundingBox.width, 200);
    assert.equal(result.boundingBox.height, 250);
    assert.equal(result.confidence, 0.95);
    assert.equal(result.landmarks.length, 6);
    assert.equal(result.landmarks[0]?.type, 'left_eye');
    assert.equal(result.landmarks[5]?.type, 'right_ear');
  });

  void it('handles empty keypoints and categories', () => {
    const mpDetection = {
      boundingBox: { originX: 0, originY: 0, width: 100, height: 100 },
      keypoints: [],
      categories: [],
    };

    const result = mpDetectionToFaceDetection(mpDetection, 200, 200);
    assert.equal(result.confidence, 0);
    assert.equal(result.landmarks.length, 0);
  });

  void it('handles missing bounding box', () => {
    const mpDetection = {
      boundingBox: undefined,
      keypoints: undefined,
      categories: undefined,
    };

    const result = mpDetectionToFaceDetection(mpDetection, 100, 100);
    assert.equal(result.boundingBox.width, 0);
    assert.equal(result.boundingBox.height, 0);
    assert.equal(result.confidence, 0);
    assert.equal(result.landmarks.length, 0);
  });
});
