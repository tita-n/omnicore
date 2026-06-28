import { VerificationError } from './VerificationError.js';

export class FaceTooSmallError extends VerificationError {
  constructor(message: string = 'Detected face is too small for verification', details?: Record<string, unknown>) {
    super(message, 'FACE_TOO_SMALL', details);
    this.name = 'FaceTooSmallError';
  }
}
