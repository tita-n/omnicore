import type { SignalCategory } from './signal-type.types.js';

export interface Signal {
  signalId: string;
  accountId: string;
  signalType: string;
  source: string;
  category: SignalCategory;
  value: number;
  confidence: number;
  timestamp: number;
  expirationTime: number | null;
  explanation: string;
  metadata?: Record<string, unknown>;
}

export interface SubmitSignalData {
  accountId: string;
  signalType: string;
  value: number;
  confidence: number;
  explanation: string;
  expirationTime?: number | null;
  metadata?: Record<string, unknown>;
}
