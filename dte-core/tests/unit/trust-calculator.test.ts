import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TrustCalculator } from '../../src/trust-calculator/trust-calculator.js';
import type { Signal } from '../../src/types/signal.types.js';
import type { DimensionConfig, DecayConfig } from '../../src/types/config.types.js';

describe('TrustCalculator', () => {
  const calculator = new TrustCalculator();
  const baseTime = 1_000_000_000_000;
  const dimConfigs: Record<string, DimensionConfig> = {
    identity: { weight: 1.0, halfLifeMs: 30 * 24 * 60 * 60 * 1000 },
    behavior: { weight: 0.8, halfLifeMs: 7 * 24 * 60 * 60 * 1000 },
    community: { weight: 0.6, halfLifeMs: 14 * 24 * 60 * 60 * 1000 },
  };
  const decayConfigs: Record<string, DecayConfig> = {
    identity: { halfLifeMs: 30 * 24 * 60 * 60 * 1000 },
    behavior: { halfLifeMs: 7 * 24 * 60 * 60 * 1000 },
    community: { halfLifeMs: 14 * 24 * 60 * 60 * 1000 },
  };

  function makeSignal(overrides: Partial<Signal> & { signalId: string }): Signal {
    return {
      accountId: 'user-1',
      signalType: 'TEST',
      source: 'test-module',
      category: 'identity',
      value: 50,
      confidence: 100,
      timestamp: baseTime,
      expirationTime: null,
      explanation: 'test signal',
      ...overrides,
    };
  }

  it('returns score 0 for empty signals', () => {
    const profile = calculator.calculate({
      accountId: 'user-1',
      signals: [],
      dimensionConfigs: dimConfigs,
      decayConfigs,
      sourceMultipliers: [],
      referenceTime: baseTime,
    });

    assert.equal(profile.dimensions.identity!.score, 0);
    assert.equal(profile.dimensions.identity!.confidence, 0);
    assert.equal(profile.dimensions.identity!.contributingSignals.length, 0);
  });

  it('computes simple positive contribution correctly', () => {
    const profile = calculator.calculate({
      accountId: 'user-1',
      signals: [
        makeSignal({ signalId: 's1', category: 'identity', value: 80, confidence: 100 }),
      ],
      dimensionConfigs: dimConfigs,
      decayConfigs,
      sourceMultipliers: [],
      referenceTime: baseTime,
    });

    assert.equal(profile.dimensions.identity!.score, 80);
    assert.equal(profile.dimensions.identity!.confidence, 100);
  });

  it('handles negative signals', () => {
    const profile = calculator.calculate({
      accountId: 'user-1',
      signals: [
        makeSignal({ signalId: 's1', category: 'identity', value: -50, confidence: 100 }),
      ],
      dimensionConfigs: dimConfigs,
      decayConfigs,
      sourceMultipliers: [],
      referenceTime: baseTime,
    });

    assert.equal(profile.dimensions.identity!.score, 0);
    assert.equal(profile.dimensions.identity!.contributingSignals.length, 1);
    assert.ok(profile.dimensions.identity!.contributingSignals[0]!.contribution < 0);
  });

  it('combines positive and negative signals', () => {
    const profile = calculator.calculate({
      accountId: 'user-1',
      signals: [
        makeSignal({ signalId: 's1', category: 'identity', value: 80, confidence: 100 }),
        makeSignal({ signalId: 's2', category: 'identity', value: -30, confidence: 80 }),
      ],
      dimensionConfigs: dimConfigs,
      decayConfigs,
      sourceMultipliers: [],
      referenceTime: baseTime,
    });

    const identity = profile.dimensions.identity!;
    assert.ok(identity.score > 0);
    assert.ok(identity.score < 80);
    assert.equal(identity.contributingSignals.length, 2);
  });

  it('applies confidence weighting', () => {
    const profile = calculator.calculate({
      accountId: 'user-1',
      signals: [
        makeSignal({ signalId: 's1', category: 'identity', value: 100, confidence: 50 }),
      ],
      dimensionConfigs: dimConfigs,
      decayConfigs,
      sourceMultipliers: [],
      referenceTime: baseTime,
    });

    assert.equal(profile.dimensions.identity!.score, 50);
  });

  it('applies dimension weight from config', () => {
    const profile = calculator.calculate({
      accountId: 'user-1',
      signals: [
        makeSignal({ signalId: 's1', category: 'identity', value: 100, confidence: 100 }),
      ],
      dimensionConfigs: {
        identity: { weight: 0.5, halfLifeMs: 999999 },
      },
      decayConfigs,
      sourceMultipliers: [],
      referenceTime: baseTime,
    });

    assert.equal(profile.dimensions.identity!.score, 50);
  });

  it('applies source multiplier', () => {
    const profile = calculator.calculate({
      accountId: 'user-1',
      signals: [
        makeSignal({ signalId: 's1', category: 'identity', value: 100, confidence: 100, source: 'test-module' }),
      ],
      dimensionConfigs: dimConfigs,
      decayConfigs,
      sourceMultipliers: [{ source: 'test-module', multiplier: 0.5 }],
      referenceTime: baseTime,
    });

    assert.equal(profile.dimensions.identity!.score, 50);
  });

  it('decays signal value over time', () => {
    const signalTime = baseTime;
    const halfLifeMs = 86_400_000;

    const profile = calculator.calculate({
      accountId: 'user-1',
      signals: [
        makeSignal({
          signalId: 's1',
          category: 'identity',
          value: 100,
          confidence: 100,
          timestamp: signalTime,
        }),
      ],
      dimensionConfigs: {
        identity: { weight: 1.0, halfLifeMs },
      },
      decayConfigs: {
        identity: { halfLifeMs },
      },
      sourceMultipliers: [],
      referenceTime: signalTime + halfLifeMs / 2,
    });

    assert.equal(profile.dimensions.identity!.score, 50);
  });

  it('fully decays signal to 0 after halfLife', () => {
    const halfLifeMs = 86_400_000;

    const profile = calculator.calculate({
      accountId: 'user-1',
      signals: [
        makeSignal({
          signalId: 's1',
          category: 'identity',
          value: 100,
          confidence: 100,
          timestamp: baseTime,
        }),
      ],
      dimensionConfigs: {
        identity: { weight: 1.0, halfLifeMs },
      },
      decayConfigs: {
        identity: { halfLifeMs },
      },
      sourceMultipliers: [],
      referenceTime: baseTime + halfLifeMs,
    });

    assert.equal(profile.dimensions.identity!.score, 0);
  });

  it('filters out expired signals', () => {
    const profile = calculator.calculate({
      accountId: 'user-1',
      signals: [
        makeSignal({
          signalId: 's1',
          category: 'identity',
          value: 80,
          confidence: 100,
          expirationTime: baseTime - 1,
        }),
      ],
      dimensionConfigs: dimConfigs,
      decayConfigs,
      sourceMultipliers: [],
      referenceTime: baseTime,
    });

    assert.equal(profile.dimensions.identity!.score, 0);
    assert.equal(profile.dimensions.identity!.contributingSignals.length, 0);
  });

  it('is deterministic: same inputs produce same output', () => {
    const signals = [
      makeSignal({ signalId: 's1', category: 'identity', value: 70, confidence: 90, timestamp: baseTime - 1000 }),
      makeSignal({ signalId: 's2', category: 'behavior', value: -20, confidence: 60, timestamp: baseTime - 500 }),
      makeSignal({ signalId: 's3', category: 'community', value: 40, confidence: 80, timestamp: baseTime - 2000 }),
    ];

    const p1 = calculator.calculate({
      accountId: 'user-1', signals, dimensionConfigs: dimConfigs, decayConfigs,
      sourceMultipliers: [], referenceTime: baseTime,
    });
    const p2 = calculator.calculate({
      accountId: 'user-1', signals, dimensionConfigs: dimConfigs, decayConfigs,
      sourceMultipliers: [], referenceTime: baseTime,
    });

    assert.deepEqual(p1, p2);
  });

  it('clamps score to 0-100', () => {
    const profile = calculator.calculate({
      accountId: 'user-1',
      signals: [
        makeSignal({ signalId: 's1', category: 'identity', value: 200, confidence: 100 }),
        makeSignal({ signalId: 's2', category: 'identity', value: -200, confidence: 100 }),
      ],
      dimensionConfigs: dimConfigs,
      decayConfigs,
      sourceMultipliers: [],
      referenceTime: baseTime,
    });

    assert.ok(profile.dimensions.identity!.score >= 0);
    assert.ok(profile.dimensions.identity!.score <= 100);
  });

  it('respects input signal sort order deterministically', () => {
    const signals = [
      makeSignal({ signalId: 'z', category: 'identity', value: 10, confidence: 100, timestamp: baseTime }),
      makeSignal({ signalId: 'a', category: 'identity', value: 20, confidence: 100, timestamp: baseTime }),
    ];

    const p1 = calculator.calculate({
      accountId: 'user-1', signals, dimensionConfigs: dimConfigs, decayConfigs,
      sourceMultipliers: [], referenceTime: baseTime,
    });
    const p2 = calculator.calculate({
      accountId: 'user-1', signals: [...signals].reverse(), dimensionConfigs: dimConfigs,
      decayConfigs, sourceMultipliers: [], referenceTime: baseTime,
    });

    assert.deepEqual(p1, p2);
  });
});
