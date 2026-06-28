import type { VerificationConfig } from './VerificationConfig.js';

export const defaultConfig: VerificationConfig = {
  camera: {
    preferredFacingMode: 'user',
    maxWidth: 1280,
    maxHeight: 720,
    format: 'jpeg',
    captureIntervalMs: 200,
    maxFrames: 10,
    timeoutMs: 30000,
  },
  faceDetection: {
    minConfidence: 0.7,
    inputSize: { width: 640, height: 480 },
  },
  quality: {
    minBrightness: 0.3,
    maxBrightness: 0.9,
    minContrast: 0.2,
    minSharpness: 0.3,
    maxOcclusion: 0.3,
    maxGlare: 0.4,
    maxBlur: 0.4,
    minimumOverall: 0.6,
    weights: {
      brightness: 0.15,
      contrast: 0.1,
      sharpness: 0.2,
      occlusion: 0.2,
      glare: 0.15,
      blur: 0.2,
    },
  },
  liveness: {
    requiredConfidence: 0.8,
    challengeType: 'passive',
    maxRetries: 2,
    timeoutMs: 15000,
  },
  ageEstimation: {
    minimumConfidence: 0.6,
    supportedAgeBands: ['AGE_13_15', 'AGE_16_17', 'AGE_18_20', 'AGE_21_PLUS'],
  },
  confidence: {
    minimumOverall: 0.7,
    weights: {
      qualityScore: 0.2,
      livenessScore: 0.3,
      faceDetectionConfidence: 0.15,
      ageEstimationConfidence: 0.2,
      frameConsistency: 0.1,
      temporalStability: 0.05,
    },
  },
  dte: {
    signalType: 'age_verification',
    source: 'age_verification_module',
    enabled: true,
  },
  pipeline: {
    steps: [
      'camera_capture',
      'face_detection',
      'quality_analysis',
      'liveness_check',
      'age_estimation',
      'confidence_calculation',
      'dte_submission',
    ],
    stopOnError: true,
    maxRetries: 1,
    timeoutMs: 60000,
  },
};
