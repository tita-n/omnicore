import type { PipelineStep, PipelineContext } from '../../interfaces/PipelineStep.js';
import { VerificationStatus } from '../../models/VerificationStatus.js';
import { CameraManager } from '../camera/CameraManager.js';

export class CameraCaptureStep implements PipelineStep {
  readonly name = 'camera_capture';

  canExecute(context: PipelineContext): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const cameraManager = new CameraManager(
      context.config.camera,
      context.events,
      context.sessionId
    );

    await cameraManager.startCamera();

    const provider = cameraManager.getProvider();
    const frames: typeof context.frames = [];

    if (provider) {
      for await (const frame of provider.captureFrames()) {
        frames.push(frame);
      }
    }

    context.currentStatus = VerificationStatus.CAPTURING;

    return {
      ...context,
      currentStatus: VerificationStatus.CAPTURING,
      frames,
    };
  }

  async onError(context: PipelineContext, error: Error): Promise<PipelineContext> {
    return {
      ...context,
      currentStatus: VerificationStatus.FAILED,
      error,
    };
  }
}
