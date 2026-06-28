import type { AuditTrail, DimensionExplanation } from '../types/audit.types.js';
import type { IAuditSystem } from '../interfaces/IAuditSystem.js';
import type { ISignalEngine } from '../interfaces/ISignalEngine.js';
import type { ITrustCalculator, CalculateParams } from '../interfaces/ITrustCalculator.js';
import type { ITrustStorage } from '../interfaces/ITrustStorage.js';
import type { IConfigManager } from '../interfaces/IConfigManager.js';

export class AuditSystem implements IAuditSystem {
  constructor(
    private storage: ITrustStorage,
    private signalEngine: ISignalEngine,
    private calculator: ITrustCalculator,
    private config: IConfigManager,
  ) {}

  getAuditTrail(accountId: string, referenceTime: number): AuditTrail {
    const events = this.storage.searchEvents({ accountId });
    const decisions = this.storage.getDecisionHistory(accountId, { limit: 100 });
    const profile = this.storage.getLatestTrustProfile(accountId);

    return {
      accountId,
      events,
      trustProfiles: profile ? [profile] : [],
      decisions,
      generatedAt: referenceTime,
    };
  }

  getExplanation(
    accountId: string,
    dimension: string,
    referenceTime: number,
  ): DimensionExplanation | undefined {
    const activeSignals = this.signalEngine.getActive(accountId, referenceTime);
    const config = this.config.getAll();
    const dimensionConfig = config.dimensions[dimension];
    const decayConfig = config.decay;

    if (!dimensionConfig) return undefined;

    const profile = this.calculator.calculate({
      accountId,
      signals: activeSignals,
      dimensionConfigs: { [dimension]: dimensionConfig },
      decayConfigs: decayConfig,
      sourceMultipliers: config.sourceMultipliers,
      referenceTime,
    });

    const dimScore = profile.dimensions[dimension];
    if (!dimScore) return undefined;

    return {
      dimension,
      score: dimScore.score,
      confidence: dimScore.confidence,
      contributors: dimScore.contributingSignals.map(c => ({
        source: c.source,
        contribution: c.contribution,
        explanation: c.explanation,
      })),
    };
  }
}
