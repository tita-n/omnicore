import { VerificationError } from './VerificationError.js';

export class CameraError extends VerificationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CAMERA_ERROR', details);
    this.name = 'CameraError';
  }
}
