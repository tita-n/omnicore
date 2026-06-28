export { AgeVerificationSDK } from './core/SDK.js';
export type { DTEOptions } from './core/types.js';

export { EventEmitter } from './events/EventEmitter.js';
export type {
  VerificationEventType,
  VerificationEventPayloads,
  SessionCreated,
  CaptureStarted,
  CaptureFinished,
  VerificationStarted,
  VerificationCompleted,
  VerificationFailed,
  SignalEmitted,
} from './events/EventTypes.js';

export { VerificationPipeline } from './pipeline/VerificationPipeline.js';

export {
  AgeBand,
  ageBandFromNumber,
  ageBandToRange,
  isAgeBand,
  VerificationStatus,
  isVerificationStatus,
  isTerminalStatus,
  canTransition,
  createVerificationSession,
  updateSessionStatus,
  createEmptyResult,
  isResultValid,
} from './models/index.js';
export type {
  VerificationSession,
  VerificationMetadata,
  VerificationResult,
  VerificationEvidence,
} from './models/index.js';

export {
  VerificationError,
  CameraError,
  FaceDetectionError,
  QualityError,
  LivenessError,
  AgeEstimationError,
  VerificationCancelledError,
  UnsupportedBrowserError,
} from './errors/index.js';

export { defaultConfig, validateConfig, isConfigValid } from './config/index.js';
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
} from './config/index.js';

export type {
  CameraProvider,
  CaptureFrame,
  CameraCapabilities,
  FaceDetector,
  FaceDetection,
  QualityAnalyzer,
  QualityMetrics,
  LivenessEngine,
  LivenessResult,
  AgeEstimator,
  AgeEstimation,
  ConfidenceCalculator,
  ConfidenceFactors,
  DTEConnector,
  DTEConnectorConfig,
  PipelineStep,
  PipelineContext,
} from './interfaces/index.js';
