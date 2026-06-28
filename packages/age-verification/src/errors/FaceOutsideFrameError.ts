import { VerificationError } from './VerificationError.js';

export class FaceOutsideFrameError extends VerificationError {
  constructor(message: string = 'Face is partially outside the camera frame', details?: Record<string, unknown>) {
    super(message, 'FACE_OUTSIDE_FRAME', details);
    this.name = 'FaceOutsideFrameError';
  }
}
