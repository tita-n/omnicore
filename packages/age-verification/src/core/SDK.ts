import type { AvmOptions } from './types.js';
import type { VerificationConfig } from '../config/VerificationConfig.js';
import type { VerificationSession as VerificationSessionModel } from '../models/VerificationSession.js';
import type { VerificationResult } from '../models/VerificationResult.js';
import { VerificationStatus } from '../models/VerificationStatus.js';
import { createVerificationSession, updateSessionStatus } from '../models/VerificationSession.js';
import { createEmptyResult } from '../models/VerificationResult.js';
import { defaultConfig } from '../config/defaultConfig.js';
import { isConfigValid } from '../config/configSchema.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { VerificationPipeline } from '../pipeline/VerificationPipeline.js';
import { CameraCaptureStep } from '../services/pipeline-steps/CameraCaptureStep.js';
import { FaceDetectionStep } from '../services/pipeline-steps/FaceDetectionStep.js';

export class AgeVerificationSDK {
  private config: VerificationConfig;
  private events: EventEmitter = new EventEmitter();
  private pipeline: VerificationPipeline;
  private sessions: Map<string, VerificationSessionModel> = new Map();
  private results: Map<string, VerificationResult> = new Map();

  constructor(options?: AvmOptions) {
    this.config = {
      ...defaultConfig,
      camera: options?.camera ? { ...defaultConfig.camera, ...options.camera } : defaultConfig.camera,
      faceDetection: options?.faceDetection
        ? { ...defaultConfig.faceDetection, ...options.faceDetection }
        : defaultConfig.faceDetection,
      dte: options?.dteEndpoint
        ? { ...defaultConfig.dte, endpoint: options.dteEndpoint }
        : defaultConfig.dte,
    };

    if (!isConfigValid(this.config)) {
      console.warn('Configuration is invalid');
    }

    this.pipeline = new VerificationPipeline(this.config, this.events);

    this.pipeline.registerStep(new CameraCaptureStep());
    this.pipeline.registerStep(new FaceDetectionStep());
  }

  get events$(): EventEmitter {
    return this.events;
  }

  createSession(userId: string, metadata?: Record<string, unknown>): VerificationSessionModel {
    const sessionId = this.generateId();
    const session = createVerificationSession(sessionId, userId, metadata as Record<string, string>);
    this.sessions.set(sessionId, session);

    this.events.emit('session_created', { session });
    return session;
  }

  async startVerification(sessionId: string, userId: string): Promise<VerificationResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const updated = updateSessionStatus(session, VerificationStatus.PROCESSING);
    this.sessions.set(sessionId, updated);

    const initialResult = createEmptyResult(sessionId, userId);
    const context = {
      sessionId,
      userId,
      config: this.config,
      currentStatus: VerificationStatus.PROCESSING,
      events: this.events,
      frames: [],
      faceDetections: [],
      qualityMetrics: null,
      livenessResult: null,
      ageEstimation: null,
      confidenceFactors: null,
      finalResult: initialResult,
      error: null,
    };

    const finalContext = await this.pipeline.execute(context);

    const result: VerificationResult = {
      verificationId: `ver_${sessionId}`,
      sessionId,
      userId,
      ageBand: initialResult.ageBand,
      confidence: finalContext.faceDetections.length > 0 ? finalContext.faceDetections[0]!.confidence : 0,
      qualityScore: 0,
      livenessScore: 0,
      verificationStatus: finalContext.currentStatus,
      timestamp: Date.now(),
      evidence: {
        faceDetected: finalContext.faceDetections.length > 0,
        qualityScore: 0,
        livenessScore: 0,
        faceBoundingBox: finalContext.faceDetections[0]?.boundingBox,
        landmarks: finalContext.faceDetections[0]?.landmarks,
        framesAnalyzed: finalContext.frames.length,
        captureDurationMs: 0,
      },
      error: finalContext.error?.message,
    };

    this.results.set(sessionId, result);

    return result;
  }

  cancelVerification(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.pipeline.cancel();
    const updated = updateSessionStatus(session, VerificationStatus.CANCELLED);
    this.sessions.set(sessionId, updated);
  }

  getVerificationResult(sessionId: string): VerificationResult | undefined {
    return this.results.get(sessionId);
  }

  getVerificationStatus(sessionId: string): VerificationStatus | undefined {
    return this.sessions.get(sessionId)?.status;
  }

  private generateId(): string {
    return `avm_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
}
