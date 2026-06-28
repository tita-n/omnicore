import type { PipelineStep, PipelineContext } from '../../interfaces/PipelineStep.js';
import type { FaceDetectionProvider } from '../../interfaces/FaceDetectionProvider.js';
import { VerificationStatus } from '../../models/VerificationStatus.js';
import { MediaPipeFaceDetectionProvider } from '../face-detection/MediaPipeFaceDetectionProvider.js';
import { validateFaces, createDefaultValidationConfig } from '../face-validation/FaceValidator.js';

export class FaceDetectionStep implements PipelineStep {
  readonly name = 'face_detection';
  private provider: FaceDetectionProvider | null = null;

  canExecute(context: PipelineContext): boolean {
    return context.frames.length > 0 || context.currentStatus === VerificationStatus.CAPTURING;
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const config = context.config.faceDetection;

    this.provider = new MediaPipeFaceDetectionProvider(config, context.events, context.sessionId);
    await this.provider.initialize();

    const validationConfig = createDefaultValidationConfig();
    validationConfig.minFaceSize = config.minFaceSize;
    validationConfig.maxFaces = config.maxFaces;

    return await this.detectionLoop(context, validationConfig);
  }

  private async detectionLoop(
    context: PipelineContext,
    validationConfig: ReturnType<typeof createDefaultValidationConfig>
  ): Promise<PipelineContext> {
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.muted = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();

      await this.waitForVideoReady(video);
      const intervalMs = context.config.camera.detectionIntervalMs;

      while (context.currentStatus === VerificationStatus.CAPTURING) {
        await this.sleep(intervalMs);
        if (video.readyState < 2) continue;

        const result = await this.provider!.detect(video);
        const validation = validateFaces(
          result.detections,
          result.inputWidth,
          result.inputHeight,
          validationConfig
        );

        context.faceDetections = result.detections;

        if (validation.passed && result.detections.length > 0) {
          context.events.emit('face_detected', {
            sessionId: context.sessionId,
            faceCount: result.detections.length,
            detections: result.detections,
            timestamp: Date.now(),
          });
          context.events.emit('face_validated', {
            sessionId: context.sessionId,
            passed: true,
            errors: [],
            timestamp: Date.now(),
          });

          const faceDetection = result.detections[0]!;
          context.faceDetections = [faceDetection];
          context.currentStatus = VerificationStatus.COMPLETED;
          break;
        }

        if (result.detections.length === 0) {
          context.events.emit('face_lost', {
            sessionId: context.sessionId,
            timestamp: Date.now(),
          });
        } else if (result.detections.length > 1) {
          context.events.emit('multiple_faces_detected', {
            sessionId: context.sessionId,
            faceCount: result.detections.length,
            timestamp: Date.now(),
          });
        }
      }

      stream.getTracks().forEach(t => t.stop());
    } catch (err) {
      return {
        ...context,
        currentStatus: VerificationStatus.FAILED,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    } finally {
      video.srcObject = null;
      await this.provider?.dispose();
      this.provider = null;
    }

    return context;
  }

  private waitForVideoReady(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      if (video.readyState >= 2) {
        resolve();
      } else {
        video.onloadeddata = () => resolve();
      }
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  async onError(context: PipelineContext, error: Error): Promise<PipelineContext> {
    await this.provider?.dispose();
    this.provider = null;
    return {
      ...context,
      currentStatus: VerificationStatus.FAILED,
      error,
    };
  }
}
