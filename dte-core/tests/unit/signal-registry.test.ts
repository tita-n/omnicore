import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SignalRegistry } from '../../src/signal-engine/signal-registry.js';
import { SIGNAL_TYPES } from '../../src/types/index.js';

describe('SignalRegistry', () => {
  let registry: SignalRegistry;

  beforeEach(() => {
    registry = new SignalRegistry();
  });

  it('contains all built-in signal types', () => {
    const types = registry.getAll();
    assert.ok(types.length >= 9);
    assert.equal(registry.contains(SIGNAL_TYPES.AGE_VERIFICATION), true);
    assert.equal(registry.contains(SIGNAL_TYPES.PHONE_VERIFICATION), true);
    assert.equal(registry.contains(SIGNAL_TYPES.EMAIL_VERIFICATION), true);
    assert.equal(registry.contains(SIGNAL_TYPES.DEVICE_TRUST), true);
    assert.equal(registry.contains(SIGNAL_TYPES.LIVENESS), true);
    assert.equal(registry.contains(SIGNAL_TYPES.BEHAVIOR), true);
    assert.equal(registry.contains(SIGNAL_TYPES.COMMUNITY_REPORT), true);
    assert.equal(registry.contains(SIGNAL_TYPES.SPAM_DETECTION), true);
    assert.equal(registry.contains(SIGNAL_TYPES.PHOTO_VERIFICATION), true);
  });

  it('returns correct definition for known types', () => {
    const def = registry.get(SIGNAL_TYPES.AGE_VERIFICATION);
    assert.ok(def);
    assert.equal(def.source, 'age-verification');
    assert.equal(def.category, 'identity');
    assert.equal(def.defaultWeight, 1.0);
  });

  it('returns undefined for unregistered types', () => {
    assert.equal(registry.get('UNKNOWN_TYPE'), undefined);
    assert.equal(registry.contains('UNKNOWN_TYPE'), false);
  });

  it('allows registering new signal types', () => {
    registry.register({
      type: 'ML_FRAUD_SCORE',
      source: 'ml-fraud-detection',
      category: 'behavior',
      description: 'ML-based fraud score',
      defaultWeight: 0.9,
      defaultTtlMs: 86_400_000,
    });

    assert.equal(registry.contains('ML_FRAUD_SCORE'), true);
    const def = registry.get('ML_FRAUD_SCORE');
    assert.equal(def!.source, 'ml-fraud-detection');
    assert.equal(def!.category, 'behavior');
  });

  it('prevents duplicate registration', () => {
    assert.throws(() =>
      registry.register({
        type: SIGNAL_TYPES.AGE_VERIFICATION,
        source: 'duplicate',
        category: 'identity',
        description: 'dup',
        defaultWeight: 1.0,
        defaultTtlMs: null,
      }),
      /already registered/,
    );
  });

  it('rejects registration without required fields', () => {
    assert.throws(() =>
      registry.register({
        type: '',
        source: 'test',
        category: 'identity',
        description: 'missing type',
        defaultWeight: 1.0,
        defaultTtlMs: null,
      }),
    );
  });
});
