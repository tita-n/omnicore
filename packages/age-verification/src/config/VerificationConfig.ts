export interface CameraConfig {
  preferredFacingMode: 'user' | 'environment';
  maxWidth: number;
  maxHeight: number;
  format: 'jpeg' | 'png';
  captureIntervalMs: number;
  maxFrames: number;
  timeoutMs: number;
  minFaceSize: number;
  detectionIntervalMs: number;
  maxFaces: number;
}

export interface FaceDetectionConfig {
  minConfidence: number;
  modelPath?: string;
  inputSize: { width: number; height: number };
  minFaceSize: number;
  maxFaces: number;
  modelUrl: string;
  wasmPath: string;
  minSuppressionThreshold: number;
}

export interface QualityConfig {
  minBrightness: number;
  maxBrightness: number;
  minContrast: number;
  minSharpness: number;
  maxOcclusion: number;
  maxGlare: number;
  maxBlur: number;
  minimumOverall: number;
  weights: Record<string, number>;
}

export interface LivenessConfig {
  requiredConfidence: number;
  challengeType: 'passive' | 'active' | 'hybrid';
  maxRetries: number;
  timeoutMs: number;
}

export interface AgeEstimationConfig {
  minimumConfidence: number;
  modelPath?: string;
  supportedAgeBands: string[];
}

export interface ConfidenceConfig {
  minimumOverall: number;
  weights: Record<string, number>;
}

export interface DTEConfig {
  endpoint?: string;
  signalType: string;
  source: string;
  enabled: boolean;
}

export interface PipelineConfig {
  steps: string[];
  stopOnError: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export interface VerificationConfig {
  camera: CameraConfig;
  faceDetection: FaceDetectionConfig;
  quality: QualityConfig;
  liveness: LivenessConfig;
  ageEstimation: AgeEstimationConfig;
  confidence: ConfidenceConfig;
  dte: DTEConfig;
  pipeline: PipelineConfig;
}
