import type { Rule } from './rule.types.js';

export interface DimensionConfig {
  weight: number;
  halfLifeMs: number;
}

export interface DecayConfig {
  halfLifeMs: number;
}

export interface SourceMultiplierConfig {
  source: string;
  multiplier: number;
}

export interface DTEConfig {
  dimensions: Record<string, DimensionConfig>;
  decay: Record<string, DecayConfig>;
  sourceMultipliers: SourceMultiplierConfig[];
  rules: Rule[];
  maxLogSize: number;
  defaultTtlMs: number;
}
