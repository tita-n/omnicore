import { VerificationError } from './VerificationError.js';

export class FaceDetectionError extends VerificationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'FACE_DETECTION_ERROR', details);
    this.name = 'FaceDetectionError';
  }
}
