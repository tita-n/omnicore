import type { Signal } from '../types/signal.types.js';
import type { TrustProfile, DimensionScore, SignalContribution } from '../types/trust.types.js';
import type { ITrustCalculator, CalculateParams } from '../interfaces/ITrustCalculator.js';
import { linearDecay } from './decay.js';

export class TrustCalculator implements ITrustCalculator {
  calculate(params: CalculateParams): TrustProfile {
    const { accountId, signals, dimensionConfigs, decayConfigs, sourceMultipliers, referenceTime } = params;

    const sorted = [...signals].sort((a, b) =>
      a.timestamp - b.timestamp || a.signalId.localeCompare(b.signalId),
    );

    const sourceMultiplierMap = new Map<string, number>();
    for (const sm of sourceMultipliers) {
      sourceMultiplierMap.set(sm.source, sm.multiplier);
    }

    const dimensions: Record<string, DimensionScore> = {};

    for (const [dimensionName, dimConfig] of Object.entries(dimensionConfigs)) {
      const dimensionSignals = sorted.filter(s => s.category === dimensionName);
      const decayCfg = decayConfigs[dimensionName] ?? decayConfigs.default;

      let totalContribution = 0;
      let totalWeightUsed = 0;
      let weightedConfidenceSum = 0;
      let confidenceWeightSum = 0;
      const contributions: SignalContribution[] = [];

      for (const signal of dimensionSignals) {
        if (signal.expirationTime !== null && referenceTime >= signal.expirationTime) {
          continue;
        }

        const sourceMultiplier = sourceMultiplierMap.get(signal.source) ?? 1;

        const decayFactor = decayCfg
          ? linearDecay(signal.timestamp, referenceTime, decayCfg.halfLifeMs)
          : 1;
        const decayedValue = signal.value * decayFactor;

        const confidenceFactor = signal.confidence / 100;
        const signalWeight = dimConfig.weight;

        const contribution = decayedValue * confidenceFactor * signalWeight * sourceMultiplier;

        totalContribution += contribution;
        totalWeightUsed += signalWeight * confidenceFactor * sourceMultiplier;

        weightedConfidenceSum += signal.confidence * Math.abs(contribution);
        confidenceWeightSum += Math.abs(contribution);

        if (contribution !== 0) {
          contributions.push({
            signalId: signal.signalId,
            source: signal.source,
            contribution: parseFloat(contribution.toFixed(4)),
            explanation: signal.explanation,
          });
        }
      }

      const score = clampToTrustScore(totalContribution);
      const confidence = confidenceWeightSum > 0
        ? clampToTrustScore(weightedConfidenceSum / confidenceWeightSum)
        : 0;

      dimensions[dimensionName] = {
        score,
        confidence: parseFloat(confidence.toFixed(2)),
        contributingSignals: contributions,
        lastUpdated: referenceTime,
      };
    }

    return {
      accountId,
      dimensions,
      computedAt: referenceTime,
    };
  }
}

function clampToTrustScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
