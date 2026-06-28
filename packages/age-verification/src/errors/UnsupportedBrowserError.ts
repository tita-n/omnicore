import { VerificationError } from './VerificationError.js';

export class UnsupportedBrowserError extends VerificationError {
  constructor(message: string = 'Browser does not support required features', details?: Record<string, unknown>) {
    super(message, 'UNSUPPORTED_BROWSER', details);
    this.name = 'UnsupportedBrowserError';
  }
}
