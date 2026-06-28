import { VerificationError } from './VerificationError.js';

export class QualityError extends VerificationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'QUALITY_ERROR', details);
    this.name = 'QualityError';
  }
}
