import type { TrustProfile } from './trust.types.js';

export type DecisionOutcome = 'allow' | 'deny' | 'require_additional_verification';

export interface Decision {
  action: string;
  accountId: string;
  outcome: DecisionOutcome;
  explanation: string;
  triggeredRules: Array<{ ruleId: string; description?: string }>;
  trustSnapshot: TrustProfile;
  evaluatedAt: number;
}

export interface DecisionRecord {
  decisionId: string;
  accountId: string;
  action: string;
  outcome: DecisionOutcome;
  explanation: string;
  triggeredRules: Array<{ ruleId: string; description?: string }>;
  trustSnapshot: TrustProfile;
  evaluatedAt: number;
}
