import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VerificationError,
  CameraError,
  FaceDetectionError,
  QualityError,
  LivenessError,
  AgeEstimationError,
  VerificationCancelledError,
  UnsupportedBrowserError,
} from '../src/errors/index.js';

void describe('Errors', () => {
  void it('VerificationError has correct properties', () => {
    const err = new VerificationError('test error', 'TEST_CODE', { key: 'value' });
    assert.equal(err.message, 'test error');
    assert.equal(err.code, 'TEST_CODE');
    assert.deepEqual(err.details, { key: 'value' });
    assert.equal(err.name, 'VerificationError');
  });

  void it('CameraError extends VerificationError', () => {
    const err = new CameraError('camera not found');
    assert.equal(err.code, 'CAMERA_ERROR');
    assert.equal(err.name, 'CameraError');
    assert.ok(err instanceof VerificationError);
  });

  void it('FaceDetectionError extends VerificationError', () => {
    const err = new FaceDetectionError('no face');
    assert.equal(err.code, 'FACE_DETECTION_ERROR');
    assert.equal(err.name, 'FaceDetectionError');
  });

  void it('QualityError extends VerificationError', () => {
    const err = new QualityError('low quality');
    assert.equal(err.code, 'QUALITY_ERROR');
  });

  void it('LivenessError extends VerificationError', () => {
    const err = new LivenessError('spoof detected');
    assert.equal(err.code, 'LIVENESS_ERROR');
  });

  void it('AgeEstimationError extends VerificationError', () => {
    const err = new AgeEstimationError('cannot estimate');
    assert.equal(err.code, 'AGE_ESTIMATION_ERROR');
  });

  void it('VerificationCancelledError has default message', () => {
    const err = new VerificationCancelledError();
    assert.equal(err.message, 'Verification was cancelled');
    assert.equal(err.code, 'VERIFICATION_CANCELLED');
  });

  void it('UnsupportedBrowserError has default message', () => {
    const err = new UnsupportedBrowserError();
    assert.equal(err.message, 'Browser does not support required features');
    assert.equal(err.code, 'UNSUPPORTED_BROWSER');
  });

  void it('errors carry details', () => {
    const err = new CameraError('permission denied', { permissionState: 'denied' });
    assert.deepEqual(err.details, { permissionState: 'denied' });
  });
});
