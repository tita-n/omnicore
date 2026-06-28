export type {
  VerificationConfig,
  CameraConfig,
  FaceDetectionConfig,
  QualityConfig,
  LivenessConfig,
  AgeEstimationConfig,
  ConfidenceConfig,
  DTEConfig,
  PipelineConfig,
} from './VerificationConfig.js';

export { defaultConfig } from './defaultConfig.js';
export { validateConfig, isConfigValid } from './configSchema.js';
