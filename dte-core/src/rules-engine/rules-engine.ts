import type { Rule } from '../types/rule.types.js';
import type { TrustProfile } from '../types/trust.types.js';
import type { DecisionOutcome } from '../types/decision.types.js';
import type { IRulesEngine, RuleEvaluationResult } from '../interfaces/IRulesEngine.js';
import type { ITrustStorage } from '../interfaces/ITrustStorage.js';

export class RulesEngine implements IRulesEngine {
  constructor(private storage: ITrustStorage) {}

  evaluate(action: string, trustProfile: TrustProfile): RuleEvaluationResult {
    const applicableRules = this.storage
      .getRulesByAction(action)
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority);

    if (applicableRules.length === 0) {
      return {
        outcome: 'deny',
        matchedRules: [],
        explanation: `No enabled rules configured for action "${action}". Default: deny.`,
      };
    }

    for (const rule of applicableRules) {
      const failedConditions: string[] = [];

      for (const condition of rule.conditions) {
        const dimensionScore = trustProfile.dimensions[condition.dimension];
        const actualValue = dimensionScore?.score ?? 0;

        const passed = evaluateCondition(actualValue, condition.operator, condition.value);
        if (!passed) {
          failedConditions.push(
            `"${condition.dimension}" ${condition.operator} ${condition.value} (current: ${actualValue})`,
          );
        }
      }

      if (failedConditions.length === 0) {
        return {
          outcome: rule.outcome,
          matchedRules: [rule],
          explanation: `Rule "${rule.ruleId}" matched. Action "${action}" → ${rule.outcome}.${rule.description ? ` (${rule.description})` : ''}`,
        };
      }
    }

    const lastRule = applicableRules[applicableRules.length - 1]!;
    const recheck = () => {
      for (const rule of applicableRules) {
        const failedConditions: string[] = [];
        for (const condition of rule.conditions) {
          const dimensionScore = trustProfile.dimensions[condition.dimension];
          const actualValue = dimensionScore?.score ?? 0;
          const passed = evaluateCondition(actualValue, condition.operator, condition.value);
          if (!passed) {
            failedConditions.push(
              `"${condition.dimension}" ${condition.operator} ${condition.value} (current: ${actualValue})`,
            );
          }
        }
        if (failedConditions.length === 0) continue;
        return {
          outcome: 'deny' as DecisionOutcome,
          matchedRules: [rule],
          explanation: `Action "${action}" denied. Rule "${rule.ruleId}" requires: ${failedConditions.join('; ')}.`,
        };
      }
      return null;
    };

    const denial = recheck();
    if (denial) return denial;

    return {
      outcome: 'deny',
      matchedRules: [],
      explanation: `Action "${action}" denied. No applicable rule permitted the action.`,
    };
  }

  add(rule: Rule): void {
    if (!rule.ruleId || !rule.action) {
      throw new Error('Rule must have ruleId and action');
    }
    this.storage.saveRule(rule);
  }

  remove(ruleId: string): boolean {
    return this.storage.removeRule(ruleId);
  }

  getAll(): Rule[] {
    return this.storage.getRules();
  }

  getByAction(action: string): Rule[] {
    return this.storage.getRulesByAction(action);
  }
}

function evaluateCondition(
  actual: number,
  operator: string,
  expected: number,
): boolean {
  switch (operator) {
    case 'gte': return actual >= expected;
    case 'gt':  return actual > expected;
    case 'lte': return actual <= expected;
    case 'lt':  return actual < expected;
    case 'eq':  return Math.abs(actual - expected) < 0.01;
    case 'neq': return Math.abs(actual - expected) >= 0.01;
    default:    return false;
  }
}
