import type { FaceDetectionProvider, FaceDetectionResult } from '../../interfaces/FaceDetectionProvider.js';
import type { FaceDetectionConfig } from '../../config/VerificationConfig.js';
import type { EventEmitter } from '../../events/EventEmitter.js';
import { MediaPipeInitError } from '../../errors/MediaPipeInitError.js';
import { mpDetectionToFaceDetection } from './MediaPipeTypes.js';

interface MediaPipeFaceDetector {
  detectForVideo(video: HTMLVideoElement, timestamp: number): {
    detections: Array<{
      boundingBox?: { originX: number; originY: number; width: number; height: number };
      keypoints?: Array<{ x: number; y: number; z?: number }>;
      categories?: Array<{ score: number; index?: number; categoryName?: string }>;
    }>;
  };
  close(): void;
}

interface FilesetResolver {
  forVisionTasks(wasmPath: string): Promise<unknown>;
}

export class MediaPipeFaceDetectionProvider implements FaceDetectionProvider {
  private detector: MediaPipeFaceDetector | null = null;
  private config: FaceDetectionConfig;
  private events?: EventEmitter;
  private sessionId?: string;
  private initialized: boolean = false;

  constructor(config: FaceDetectionConfig, events?: EventEmitter, sessionId?: string) {
    this.config = config;
    this.events = events;
    this.sessionId = sessionId;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const { FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(this.config.wasmPath);

      const { FaceDetector } = await import('@mediapipe/tasks-vision');
      this.detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: this.config.modelUrl,
        },
        runningMode: 'VIDEO',
        minDetectionConfidence: this.config.minConfidence,
        minSuppressionThreshold: this.config.minSuppressionThreshold,
      }) as unknown as MediaPipeFaceDetector;

      this.initialized = true;
    } catch (err) {
      throw new MediaPipeInitError('Failed to initialize MediaPipe face detector', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async detect(video: HTMLVideoElement): Promise<FaceDetectionResult> {
    if (!this.detector) {
      throw new MediaPipeInitError('Face detector not initialized. Call initialize() first.');
    }

    const timestamp = performance.now();
    const result = this.detector.detectForVideo(video, timestamp);

    const detections = (result.detections ?? []).map(
      d => mpDetectionToFaceDetection(d, video.videoWidth, video.videoHeight)
    );

    return {
      detections,
      timestamp,
      inputWidth: video.videoWidth,
      inputHeight: video.videoHeight,
    };
  }

  async dispose(): Promise<void> {
    if (this.detector) {
      this.detector.close();
      this.detector = null;
    }
    this.initialized = false;
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}
