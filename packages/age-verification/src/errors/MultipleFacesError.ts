import { VerificationError } from './VerificationError.js';

export class MultipleFacesError extends VerificationError {
  constructor(message: string = 'Multiple faces detected', details?: Record<string, unknown>) {
    super(message, 'MULTIPLE_FACES', details);
    this.name = 'MultipleFacesError';
  }
}
