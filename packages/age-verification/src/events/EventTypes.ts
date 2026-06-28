import type { VerificationSession } from '../models/VerificationSession.js';
import type { VerificationResult } from '../models/VerificationResult.js';
import type { VerificationError } from '../errors/VerificationError.js';

export interface SessionCreated {
  session: VerificationSession;
}

export interface CaptureStarted {
  sessionId: string;
  timestamp: number;
}

export interface CaptureFinished {
  sessionId: string;
  frameCount: number;
  durationMs: number;
}

export interface VerificationStarted {
  sessionId: string;
  timestamp: number;
}

export interface VerificationCompleted {
  sessionId: string;
  result: VerificationResult;
  timestamp: number;
}

export interface VerificationFailed {
  sessionId: string;
  error: VerificationError;
  timestamp: number;
}

export interface SignalEmitted {
  sessionId: string;
  signalType: string;
  success: boolean;
  timestamp: number;
}

export type VerificationEventPayloads = {
  session_created: SessionCreated;
  capture_started: CaptureStarted;
  capture_finished: CaptureFinished;
  verification_started: VerificationStarted;
  verification_completed: VerificationCompleted;
  verification_failed: VerificationFailed;
  signal_emitted: SignalEmitted;
};

export type VerificationEventType = keyof VerificationEventPayloads;
