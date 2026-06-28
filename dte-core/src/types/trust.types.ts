export interface SignalContribution {
  signalId: string;
  source: string;
  contribution: number;
  explanation: string;
}

export interface DimensionScore {
  score: number;
  confidence: number;
  contributingSignals: SignalContribution[];
  lastUpdated: number;
}

export interface TrustProfile {
  accountId: string;
  dimensions: Record<string, DimensionScore>;
  computedAt: number;
}
