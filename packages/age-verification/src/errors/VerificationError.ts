export class VerificationError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string = 'VERIFICATION_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'VerificationError';
    this.code = code;
    this.details = details;
  }
}
