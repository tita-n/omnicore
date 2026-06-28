import { VerificationError } from './VerificationError.js';

export class VerificationCancelledError extends VerificationError {
  constructor(message: string = 'Verification was cancelled', details?: Record<string, unknown>) {
    super(message, 'VERIFICATION_CANCELLED', details);
    this.name = 'VerificationCancelledError';
  }
}
