import type { VerificationConfig } from './VerificationConfig.js';

export function validateConfig(config: VerificationConfig): string[] {
  const errors: string[] = [];

  if (config.camera.maxWidth <= 0) errors.push('camera.maxWidth must be positive');
  if (config.camera.maxHeight <= 0) errors.push('camera.maxHeight must be positive');
  if (config.camera.captureIntervalMs < 50) errors.push('camera.captureIntervalMs must be at least 50ms');
  if (config.camera.maxFrames < 1) errors.push('camera.maxFrames must be at least 1');
  if (config.camera.timeoutMs < 1000) errors.push('camera.timeoutMs must be at least 1000ms');

  if (config.faceDetection.minConfidence < 0 || config.faceDetection.minConfidence > 1) {
    errors.push('faceDetection.minConfidence must be between 0 and 1');
  }

  if (config.quality.minimumOverall < 0 || config.quality.minimumOverall > 1) {
    errors.push('quality.minimumOverall must be between 0 and 1');
  }

  if (config.liveness.requiredConfidence < 0 || config.liveness.requiredConfidence > 1) {
    errors.push('liveness.requiredConfidence must be between 0 and 1');
  }

  if (config.ageEstimation.minimumConfidence < 0 || config.ageEstimation.minimumConfidence > 1) {
    errors.push('ageEstimation.minimumConfidence must be between 0 and 1');
  }

  if (config.confidence.minimumOverall < 0 || config.confidence.minimumOverall > 1) {
    errors.push('confidence.minimumOverall must be between 0 and 1');
  }

  if (!Array.isArray(config.pipeline.steps) || config.pipeline.steps.length === 0) {
    errors.push('pipeline.steps must be a non-empty array');
  }

  return errors;
}

export function isConfigValid(config: VerificationConfig): boolean {
  return validateConfig(config).length === 0;
}
