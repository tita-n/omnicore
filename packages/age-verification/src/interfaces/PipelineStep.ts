import { VerificationStatus } from '../models/VerificationStatus.js';
import { VerificationResult } from '../models/VerificationResult.js';
import type { EventEmitter } from '../events/EventEmitter.js';

export interface PipelineContext {
  sessionId: string;
  userId: string;
  config: import('../config/VerificationConfig.js').VerificationConfig;
  events: EventEmitter;
  currentStatus: VerificationStatus;
  frames: import('../interfaces/CameraProvider.js').CaptureFrame[];
  faceDetections: import('../interfaces/FaceDetector.js').FaceDetection[];
  qualityMetrics: import('../interfaces/QualityAnalyzer.js').QualityMetrics | null;
  livenessResult: import('../interfaces/LivenessEngine.js').LivenessResult | null;
  ageEstimation: import('../interfaces/AgeEstimator.js').AgeEstimation | null;
  confidenceFactors: import('../interfaces/ConfidenceCalculator.js').ConfidenceFactors | null;
  finalResult: VerificationResult | null;
  error: Error | null;
}

export interface PipelineStep {
  name: string;
  execute(context: PipelineContext): Promise<PipelineContext>;
  canExecute(context: PipelineContext): boolean;
  onError(context: PipelineContext, error: Error): Promise<PipelineContext>;
}

export interface PipelineConfig {
  steps: string[];
  stopOnError: boolean;
  maxRetries: number;
  timeoutMs: number;
}