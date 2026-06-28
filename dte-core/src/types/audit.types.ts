import type { TrustEvent } from './event.types.js';
import type { TrustProfile } from './trust.types.js';
import type { DecisionRecord } from './decision.types.js';

export interface AuditTrail {
  accountId: string;
  events: TrustEvent[];
  trustProfiles: TrustProfile[];
  decisions: DecisionRecord[];
  generatedAt: number;
}

export interface DimensionExplanation {
  dimension: string;
  score: number;
  confidence: number;
  contributors: Array<{
    source: string;
    contribution: number;
    explanation: string;
  }>;
}
