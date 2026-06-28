import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryTrustStorage } from '../../src/storage/memory-storage.js';
import type { TrustProfile } from '../../src/types/trust.types.js';
import type { Rule } from '../../src/types/rule.types.js';

describe('MemoryTrustStorage', () => {
  let storage: MemoryTrustStorage;

  beforeEach(() => {
    storage = new MemoryTrustStorage();
  });

  it('stores and retrieves signals', () => {
    const signal: any = { signalId: 's1', accountId: 'user-1' };
    storage.saveSignal(signal);
    assert.ok(storage.getSignal('s1'));
  });

  it('removes signals', () => {
    storage.saveSignal({ signalId: 's1', accountId: 'user-1' } as any);
    assert.equal(storage.removeSignal('s1'), true);
    assert.equal(storage.getSignal('s1'), undefined);
  });

  it('stores and retrieves decision history with ordering', () => {
    const profile: TrustProfile = { accountId: 'user-1', dimensions: {}, computedAt: 1000 };

    storage.saveDecision({
      decisionId: 'd1', accountId: 'user-1', action: 'send', outcome: 'deny',
      explanation: 'no', triggeredRules: [], trustSnapshot: profile, evaluatedAt: 2000,
    });
    storage.saveDecision({
      decisionId: 'd2', accountId: 'user-1', action: 'send', outcome: 'allow',
      explanation: 'yes', triggeredRules: [], trustSnapshot: profile, evaluatedAt: 1000,
    });

    const history = storage.getDecisionHistory('user-1');
    assert.equal(history.length, 2);
    assert.ok(history[0]!.evaluatedAt > history[1]!.evaluatedAt);
  });

  it('filters decision history by action', () => {
    const profile: TrustProfile = { accountId: 'user-1', dimensions: {}, computedAt: 0 };
    storage.saveDecision({ decisionId: 'd1', accountId: 'user-1', action: 'send_message', outcome: 'allow', explanation: '', triggeredRules: [], trustSnapshot: profile, evaluatedAt: 1 });
    storage.saveDecision({ decisionId: 'd2', accountId: 'user-1', action: 'upload_image', outcome: 'deny', explanation: '', triggeredRules: [], trustSnapshot: profile, evaluatedAt: 2 });

    const filtered = storage.getDecisionHistory('user-1', { action: 'send_message' });
    assert.equal(filtered.length, 1);
  });

  it('stores and retrieves rules', () => {
    const rule: Rule = { ruleId: 'r1', action: 'test', conditions: [], outcome: 'allow', priority: 100, enabled: true };
    storage.saveRule(rule);
    assert.equal(storage.getRules().length, 1);
    assert.equal(storage.getRulesByAction('test').length, 1);
    assert.equal(storage.getRulesByAction('other').length, 0);
  });

  it('stores and retrieves trust profiles', () => {
    const profile: TrustProfile = { accountId: 'user-1', dimensions: {}, computedAt: 100 };
    storage.saveTrustProfile('user-1', profile);
    assert.ok(storage.getLatestTrustProfile('user-1'));
  });
});
