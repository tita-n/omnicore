import crypto from 'node:crypto';
import type { Decision } from '../types/decision.types.js';
import type { IDecisionEngine, EvaluateParams } from '../interfaces/IDecisionEngine.js';
import type { ITrustCalculator } from '../interfaces/ITrustCalculator.js';
import type { IRulesEngine } from '../interfaces/IRulesEngine.js';
import type { IEventLogger } from '../interfaces/IEventLogger.js';
import type { IConfigManager } from '../interfaces/IConfigManager.js';
import type { ITrustStorage } from '../interfaces/ITrustStorage.js';
import type { ISignalEngine } from '../interfaces/ISignalEngine.js';

export class DecisionEngine implements IDecisionEngine {
  constructor(
    private calculator: ITrustCalculator,
    private rulesEngine: IRulesEngine,
    private logger: IEventLogger,
    private config: IConfigManager,
    private storage: ITrustStorage,
    private signalEngine: ISignalEngine,
  ) {}

  evaluate(params: EvaluateParams): Decision {
    const { accountId, action, referenceTime } = params;

    const activeSignals = this.signalEngine.getActive(accountId, referenceTime);
    const config = this.config.getAll();

    const trustProfile = this.calculator.calculate({
      accountId,
      signals: activeSignals,
      dimensionConfigs: config.dimensions,
      decayConfigs: config.decay,
      sourceMultipliers: config.sourceMultipliers,
      referenceTime,
    });

    this.storage.saveTrustProfile(accountId, trustProfile);

    this.logger.log('trust_recalculated', accountId, {
      dimensions: Object.fromEntries(
        Object.entries(trustProfile.dimensions).map(([k, v]) => [k, { score: v.score, confidence: v.confidence }]),
      ),
    });

    const ruleResult = this.rulesEngine.evaluate(action, trustProfile);

    if (ruleResult.matchedRules.length > 0) {
      for (const rule of ruleResult.matchedRules) {
        this.logger.log('rule_triggered', accountId, {
          ruleId: rule.ruleId,
          action,
          outcome: ruleResult.outcome,
        });
      }
    }

    this.logger.log('decision_requested', accountId, {
      action,
      outcome: ruleResult.outcome,
      matchedRules: ruleResult.matchedRules.map(r => r.ruleId),
    });

    const decision: Decision = {
      action,
      accountId,
      outcome: ruleResult.outcome,
      explanation: ruleResult.explanation,
      triggeredRules: ruleResult.matchedRules.map(r => ({
        ruleId: r.ruleId,
        description: r.description,
      })),
      trustSnapshot: trustProfile,
      evaluatedAt: referenceTime,
    };

    this.storage.saveDecision({
      decisionId: crypto.randomUUID(),
      ...decision,
    });

    return decision;
  }
}
