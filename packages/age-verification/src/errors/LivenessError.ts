import { VerificationError } from './VerificationError.js';

export class LivenessError extends VerificationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'LIVENESS_ERROR', details);
    this.name = 'LivenessError';
  }
}
