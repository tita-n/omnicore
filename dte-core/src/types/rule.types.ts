import type { DecisionOutcome } from './decision.types.js';

export interface RuleCondition {
  dimension: string;
  operator: 'gte' | 'gt' | 'lte' | 'lt' | 'eq' | 'neq';
  value: number;
}

export interface Rule {
  ruleId: string;
  action: string;
  conditions: RuleCondition[];
  outcome: DecisionOutcome;
  priority: number;
  enabled: boolean;
  description?: string;
}

export interface RuleEvaluation {
  matchedRules: Rule[];
  outcome: DecisionOutcome;
  explanation: string;
}
