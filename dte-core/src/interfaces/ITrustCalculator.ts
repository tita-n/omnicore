import type { Signal } from '../types/signal.types.js';
import type { TrustProfile } from '../types/trust.types.js';
import type { DimensionConfig, DecayConfig } from '../types/config.types.js';

export interface CalculateParams {
  accountId: string;
  signals: Signal[];
  dimensionConfigs: Record<string, DimensionConfig>;
  decayConfigs: Record<string, DecayConfig>;
  sourceMultipliers: Array<{ source: string; multiplier: number }>;
  referenceTime: number;
}

export interface ITrustCalculator {
  calculate(params: CalculateParams): TrustProfile;
}
