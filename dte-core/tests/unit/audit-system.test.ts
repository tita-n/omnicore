import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryTrustStorage } from '../../src/storage/memory-storage.js';
import { EventLogger } from '../../src/event-logger/event-logger.js';
import { SignalRegistry } from '../../src/signal-engine/signal-registry.js';
import { SignalEngine } from '../../src/signal-engine/signal-engine.js';
import { ConfigManager, defaultConfig } from '../../src/config/index.js';
import { TrustCalculator } from '../../src/trust-calculator/trust-calculator.js';
import { AuditSystem } from '../../src/audit-system/audit-system.js';
import { SIGNAL_TYPES } from '../../src/types/index.js';

describe('AuditSystem', () => {
  let audit: AuditSystem;
  let signalEngine: SignalEngine;
  let storage: MemoryTrustStorage;
  let calculator: TrustCalculator;

  beforeEach(() => {
    storage = new MemoryTrustStorage();
    const logger = new EventLogger(storage);
    const registry = new SignalRegistry();
    const config = new ConfigManager(defaultConfig());
    signalEngine = new SignalEngine(registry, storage, logger, config);
    calculator = new TrustCalculator();
    audit = new AuditSystem(storage, signalEngine, calculator, config);
  });

  it('returns audit trail with events and decisions', () => {
    signalEngine.submit({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 80,
      confidence: 95,
      explanation: 'verified',
    });

    const trail = audit.getAuditTrail('user-1', Date.now());
    assert.equal(trail.accountId, 'user-1');
    assert.ok(trail.events.length >= 1);
  });

  it('returns explanation with contributors', () => {
    signalEngine.submit({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 85,
      confidence: 95,
      explanation: 'Government ID verified',
    });

    const explanation = audit.getExplanation('user-1', 'identity', Date.now());
    assert.ok(explanation);
    assert.equal(explanation!.dimension, 'identity');
    assert.ok(explanation!.score > 0);
    assert.ok(explanation!.contributors.length >= 1);
    assert.equal(explanation!.contributors[0]!.source, 'age-verification');
    assert.equal(explanation!.contributors[0]!.explanation, 'Government ID verified');
  });

  it('returns undefined for unknown dimension', () => {
    const explanation = audit.getExplanation('user-1', 'nonexistent', Date.now());
    assert.equal(explanation, undefined);
  });

  it('generates correct contribution breakdown for multiple signals', () => {
    signalEngine.submit({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 90,
      confidence: 100,
      explanation: 'Age verified',
    });

    signalEngine.submit({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.EMAIL_VERIFICATION,
      value: 50,
      confidence: 70,
      explanation: 'Email confirmed',
    });

    const explanation = audit.getExplanation('user-1', 'identity', Date.now());
    assert.equal(explanation!.contributors.length, 2);
  });
});
