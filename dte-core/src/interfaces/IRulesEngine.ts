import type { Rule } from '../types/rule.types.js';
import type { TrustProfile } from '../types/trust.types.js';
import type { DecisionOutcome } from '../types/decision.types.js';

export interface RuleEvaluationResult {
  outcome: DecisionOutcome;
  matchedRules: Rule[];
  explanation: string;
}

export interface IRulesEngine {
  evaluate(action: string, trustProfile: TrustProfile): RuleEvaluationResult;
  add(rule: Rule): void;
  remove(ruleId: string): boolean;
  getAll(): Rule[];
  getByAction(action: string): Rule[];
}
