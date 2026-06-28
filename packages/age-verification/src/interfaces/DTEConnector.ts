import { VerificationResult } from '../models/VerificationResult.js';

export interface DTEConnector {
  emitSignal(verificationResult: VerificationResult, userId: string): Promise<void>;
  getSignalType(): string;
  getSignalSource(): string;
}

export interface DTEConnectorConfig {
  dteEndpoint?: string;
  signalType: string;
  source: string;
  defaultWeight: number;
  defaultTtlMs: number | null;
}