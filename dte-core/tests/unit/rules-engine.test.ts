import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { RulesEngine } from '../../src/rules-engine/rules-engine.js';
import { MemoryTrustStorage } from '../../src/storage/memory-storage.js';
import type { Rule } from '../../src/types/rule.types.js';
import type { TrustProfile } from '../../src/types/trust.types.js';

describe('RulesEngine', () => {
  let engine: RulesEngine;
  let storage: MemoryTrustStorage;

  beforeEach(() => {
    storage = new MemoryTrustStorage();
    engine = new RulesEngine(storage);
  });

  const trustProfile: TrustProfile = {
    accountId: 'user-1',
    dimensions: {
      identity: { score: 75, confidence: 90, contributingSignals: [], lastUpdated: 1000 },
      behavior: { score: 60, confidence: 80, contributingSignals: [], lastUpdated: 1000 },
      account: { score: 50, confidence: 70, contributingSignals: [], lastUpdated: 1000 },
    },
    computedAt: 1000,
  };

  it('allows when all conditions pass', () => {
    const rule: Rule = {
      ruleId: 'test-rule',
      action: 'send_message',
      conditions: [{ dimension: 'identity', operator: 'gte', value: 50 }],
      outcome: 'allow',
      priority: 100,
      enabled: true,
    };
    engine.add(rule);

    const result = engine.evaluate('send_message', trustProfile);
    assert.equal(result.outcome, 'allow');
    assert.equal(result.matchedRules.length, 1);
    assert.equal(result.matchedRules[0]!.ruleId, 'test-rule');
  });

  it('denies when condition fails', () => {
    const rule: Rule = {
      ruleId: 'strict-rule',
      action: 'send_message',
      conditions: [{ dimension: 'identity', operator: 'gte', value: 90 }],
      outcome: 'allow',
      priority: 100,
      enabled: true,
    };
    engine.add(rule);

    const result = engine.evaluate('send_message', trustProfile);
    assert.equal(result.outcome, 'deny');
    assert.ok(result.explanation.includes('identity'));
  });

  it('denies when no rules are configured for action', () => {
    const result = engine.evaluate('unknown_action', trustProfile);
    assert.equal(result.outcome, 'deny');
    assert.equal(result.matchedRules.length, 0);
  });

  it('evaluates rules by priority (lower = higher priority)', () => {
    const low: Rule = {
      ruleId: 'low-priority',
      action: 'send_message',
      conditions: [{ dimension: 'identity', operator: 'gte', value: 10 }],
      outcome: 'allow',
      priority: 200,
      enabled: true,
    };
    const high: Rule = {
      ruleId: 'high-priority',
      action: 'send_message',
      conditions: [{ dimension: 'identity', operator: 'gte', value: 10 }],
      outcome: 'deny',
      priority: 50,
      enabled: true,
    };
    engine.add(low);
    engine.add(high);

    const result = engine.evaluate('send_message', trustProfile);
    assert.equal(result.outcome, 'deny');
    assert.equal(result.matchedRules[0]!.ruleId, 'high-priority');
  });

  it('skips disabled rules', () => {
    const rule: Rule = {
      ruleId: 'disabled-rule',
      action: 'send_message',
      conditions: [{ dimension: 'identity', operator: 'gte', value: 10 }],
      outcome: 'allow',
      priority: 100,
      enabled: false,
    };
    engine.add(rule);

    const result = engine.evaluate('send_message', trustProfile);
    assert.equal(result.outcome, 'deny');
  });

  it('supports multiple conditions (AND logic)', () => {
    const rule: Rule = {
      ruleId: 'multi-condition',
      action: 'premium',
      conditions: [
        { dimension: 'identity', operator: 'gte', value: 70 },
        { dimension: 'account', operator: 'gte', value: 50 },
      ],
      outcome: 'allow',
      priority: 100,
      enabled: true,
    };
    engine.add(rule);

    const passing = engine.evaluate('premium', trustProfile);
    assert.equal(passing.outcome, 'allow');

    const lowIdentity = { ...trustProfile, dimensions: { ...trustProfile.dimensions, identity: { ...trustProfile.dimensions.identity!, score: 30 } } };
    const failing = engine.evaluate('premium', lowIdentity);
    assert.equal(failing.outcome, 'deny');
  });

  it('supports all operators', () => {
    engine.add({ ruleId: 'gte', action: 'test', conditions: [{ dimension: 'identity', operator: 'gte', value: 75 }], outcome: 'allow', priority: 100, enabled: true });
    assert.equal(engine.evaluate('test', trustProfile).outcome, 'allow');

    engine.add({ ruleId: 'gt', action: 'test2', conditions: [{ dimension: 'identity', operator: 'gt', value: 74 }], outcome: 'allow', priority: 100, enabled: true });
    assert.equal(engine.evaluate('test2', trustProfile).outcome, 'allow');

    engine.add({ ruleId: 'lte', action: 'test3', conditions: [{ dimension: 'identity', operator: 'lte', value: 75 }], outcome: 'allow', priority: 100, enabled: true });
    assert.equal(engine.evaluate('test3', trustProfile).outcome, 'allow');

    engine.add({ ruleId: 'eq', action: 'test4', conditions: [{ dimension: 'identity', operator: 'eq', value: 75 }], outcome: 'allow', priority: 100, enabled: true });
    assert.equal(engine.evaluate('test4', trustProfile).outcome, 'allow');

    engine.add({ ruleId: 'neq', action: 'test5', conditions: [{ dimension: 'identity', operator: 'neq', value: 99 }], outcome: 'allow', priority: 100, enabled: true });
    assert.equal(engine.evaluate('test5', trustProfile).outcome, 'allow');
  });

  it('requires ruleId and action on add', () => {
    assert.throws(() =>
      engine.add({ ruleId: '', action: '', conditions: [], outcome: 'allow', priority: 100, enabled: true }),
    );
  });

  it('returns explanation with rule description', () => {
    engine.add({
      ruleId: 'desc-rule',
      action: 'test',
      conditions: [{ dimension: 'identity', operator: 'gte', value: 50 }],
      outcome: 'allow',
      priority: 100,
      enabled: true,
      description: 'My custom rule',
    });

    const result = engine.evaluate('test', trustProfile);
    assert.ok(result.explanation.includes('My custom rule'));
  });
});
