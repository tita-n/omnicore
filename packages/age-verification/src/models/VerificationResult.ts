import { AgeBand } from './AgeBand.js';
import { VerificationStatus } from './VerificationStatus.js';

export interface VerificationEvidence {
  faceDetected: boolean;
  qualityScore: number;
  livenessScore: number;
  faceBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: Array<{ x: number; y: number }>;
  framesAnalyzed: number;
  captureDurationMs: number;
}

export interface VerificationResult {
  verificationId: string;
  sessionId: string;
  userId: string;
  ageBand: AgeBand;
  confidence: number;
  qualityScore: number;
  livenessScore: number;
  verificationStatus: VerificationStatus;
  timestamp: number;
  evidence: VerificationEvidence;
  error?: string;
}

export function createEmptyResult(sessionId: string, userId: string): VerificationResult {
  return {
    verificationId: '',
    sessionId,
    userId,
    ageBand: AgeBand.UNKNOWN,
    confidence: 0,
    qualityScore: 0,
    livenessScore: 0,
    verificationStatus: VerificationStatus.CREATED,
    timestamp: 0,
    evidence: {
      faceDetected: false,
      qualityScore: 0,
      livenessScore: 0,
      framesAnalyzed: 0,
      captureDurationMs: 0,
    },
  };
}

export function isResultValid(result: VerificationResult, minimumConfidence: number, minimumQuality: number): boolean {
  return (
    result.confidence >= minimumConfidence &&
    result.qualityScore >= minimumQuality &&
    result.verificationStatus === VerificationStatus.COMPLETED &&
    result.evidence.faceDetected
  );
}