import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryTrustStorage } from '../../src/storage/memory-storage.js';
import { EventLogger } from '../../src/event-logger/event-logger.js';
import { SignalRegistry } from '../../src/signal-engine/signal-registry.js';
import { SignalEngine } from '../../src/signal-engine/signal-engine.js';
import { ConfigManager, defaultConfig } from '../../src/config/index.js';
import { SIGNAL_TYPES } from '../../src/types/index.js';

describe('SignalEngine', () => {
  let engine: SignalEngine;
  let storage: MemoryTrustStorage;

  beforeEach(() => {
    storage = new MemoryTrustStorage();
    const logger = new EventLogger(storage);
    const registry = new SignalRegistry();
    const config = new ConfigManager(defaultConfig());
    engine = new SignalEngine(registry, storage, logger, config);
  });

  it('submits a valid signal and assigns UUID + timestamp', () => {
    const signal = engine.submit({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 80,
      confidence: 95,
      explanation: 'Government ID verified',
    });

    assert.ok(signal.signalId);
    assert.equal(signal.signalId.length, 36);
    assert.ok(signal.timestamp > 0);
    assert.equal(signal.source, 'age-verification');
    assert.equal(signal.category, 'identity');
    assert.equal(signal.accountId, 'user-1');
  });

  it('rejects unregistered signal types', () => {
    assert.throws(() =>
      engine.submit({
        accountId: 'user-1',
        signalType: 'UNREGISTERED_TYPE',
        value: 50,
        confidence: 90,
        explanation: 'test',
      }),
      /Unregistered signal type/,
    );
  });

  it('rejects invalid value range', () => {
    assert.throws(() =>
      engine.submit({
        accountId: 'user-1',
        signalType: SIGNAL_TYPES.AGE_VERIFICATION,
        value: 150,
        confidence: 90,
        explanation: 'too high',
      }),
      /Invalid signal data/,
    );
  });

  it('rejects invalid confidence range', () => {
    assert.throws(() =>
      engine.submit({
        accountId: 'user-1',
        signalType: SIGNAL_TYPES.AGE_VERIFICATION,
        value: 50,
        confidence: 150,
        explanation: 'invalid confidence',
      }),
      /Invalid signal data/,
    );
  });

  it('applies custom expirationTime', () => {
    const signal = engine.submit({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.DEVICE_TRUST,
      value: 70,
      confidence: 80,
      explanation: 'device recognized',
      expirationTime: Date.now() + 1000,
    });

    assert.ok(signal.expirationTime! > signal.timestamp);
  });

  it('defaults expirationTime from registry TTL', () => {
    const signal = engine.submit({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 80,
      confidence: 95,
      explanation: 'verified',
    });

    assert.notEqual(signal.expirationTime, null);
    assert.ok(signal.expirationTime! > signal.timestamp);
  });

  it('allows permanent signals (expirationTime = null)', () => {
    const signal = engine.submit({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.COMMUNITY_REPORT,
      value: -30,
      confidence: 60,
      explanation: 'user report',
      expirationTime: null,
    });

    assert.equal(signal.expirationTime, null);
  });

  it('filters expired signals as inactive', () => {
    const now = Date.now();
    engine.submit({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.DEVICE_TRUST,
      value: 70,
      confidence: 80,
      explanation: 'device',
      expirationTime: now - 1000,
    });

    const active = engine.getActive('user-1', now);
    assert.equal(active.length, 0);
  });

  it('keeps non-expired signals as active', () => {
    const now = Date.now();
    engine.submit({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 80,
      confidence: 95,
      explanation: 'verified',
      expirationTime: now + 999999,
    });

    const active = engine.getActive('user-1', now);
    assert.equal(active.length, 1);
  });

  it('removes a signal and logs the event', () => {
    const signal = engine.submit({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 80,
      confidence: 95,
      explanation: 'test',
    });

    const removed = engine.remove(signal.signalId);
    assert.equal(removed, true);
    assert.equal(engine.get(signal.signalId), undefined);
  });

  it('returns false when removing non-existent signal', () => {
    assert.equal(engine.remove('nonexistent'), false);
  });

  it('updates a signal partially', () => {
    const signal = engine.submit({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 80,
      confidence: 95,
      explanation: 'original',
    });

    const updated = engine.update(signal.signalId, {
      value: 60,
      explanation: 'updated',
    });

    assert.equal(updated.value, 60);
    assert.equal(updated.explanation, 'updated');
    assert.equal(updated.signalId, signal.signalId);
  });
});
