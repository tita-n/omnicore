import { AgeBand } from './AgeBand.js';
import { VerificationStatus } from './VerificationStatus.js';

export interface VerificationMetadata {
  deviceInfo?: string;
  browserInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  locale?: string;
  [key: string]: unknown;
}

export interface VerificationSession {
  sessionId: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  status: VerificationStatus;
  metadata: VerificationMetadata;
  configId?: string;
}

export function createVerificationSession(
  sessionId: string,
  userId: string,
  metadata: VerificationMetadata = {}
): VerificationSession {
  const now = Date.now();
  return {
    sessionId,
    userId,
    createdAt: now,
    updatedAt: now,
    status: VerificationStatus.CREATED,
    metadata,
  };
}

export function updateSessionStatus(session: VerificationSession, status: VerificationStatus): VerificationSession {
  return {
    ...session,
    status,
    updatedAt: Date.now(),
  };
}