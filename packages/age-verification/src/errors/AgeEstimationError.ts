import { VerificationError } from './VerificationError.js';

export class AgeEstimationError extends VerificationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AGE_ESTIMATION_ERROR', details);
    this.name = 'AgeEstimationError';
  }
}
