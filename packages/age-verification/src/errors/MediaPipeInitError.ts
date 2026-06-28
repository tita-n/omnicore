import { VerificationError } from './VerificationError.js';

export class MediaPipeInitError extends VerificationError {
  constructor(message: string = 'Failed to initialize MediaPipe face detector', details?: Record<string, unknown>) {
    super(message, 'MEDIAPIPE_INIT_ERROR', details);
    this.name = 'MediaPipeInitError';
  }
}
