import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DTE, SIGNAL_TYPES } from '../../src/index.js';

describe('DTE Integration', () => {
  it('full pipeline: submit signals → calculate trust → evaluate action → audit', () => {
    const dte = new DTE();

    const s1 = dte.submitSignal({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 85,
      confidence: 95,
      explanation: 'Government ID verified via third-party',
    });

    const s2 = dte.submitSignal({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.PHONE_VERIFICATION,
      value: 70,
      confidence: 90,
      explanation: 'Phone number verified via SMS',
    });

    const s3 = dte.submitSignal({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.EMAIL_VERIFICATION,
      value: 60,
      confidence: 80,
      explanation: 'Email confirmed via link',
    });

    const s4 = dte.submitSignal({
      accountId: 'user-1',
      signalType: SIGNAL_TYPES.DEVICE_TRUST,
      value: 90,
      confidence: 85,
      explanation: 'Known device, used for 60 days',
    });

    assert.ok(s1.signalId);
    assert.ok(s2.signalId);
    assert.ok(s3.signalId);
    assert.ok(s4.signalId);

    const decision = dte.evaluateAction('user-1', 'send_message');

    assert.equal(decision.action, 'send_message');
    assert.equal(decision.accountId, 'user-1');
    assert.equal(decision.outcome, 'allow');
    assert.ok(decision.explanation);
    assert.ok(decision.triggeredRules.length >= 1);
    assert.ok(decision.trustSnapshot.dimensions.identity);
    assert.ok(decision.trustSnapshot.dimensions.device);
    assert.ok(decision.evaluatedAt > 0);

    const explanation = dte.getTrustExplanation('user-1', 'identity');
    assert.ok(explanation);
    assert.ok(explanation!.score > 0);
    assert.ok(explanation!.contributors.length >= 1);

    const history = dte.getDecisionHistory('user-1');
    assert.ok(history.length >= 1);
    assert.equal(history[0]!.outcome, 'allow');
  });

  it('denies action when trust is too low', () => {
    const dte = new DTE();

    dte.submitSignal({
      accountId: 'low-trust-user',
      signalType: SIGNAL_TYPES.COMMUNITY_REPORT,
      value: -90,
      confidence: 80,
      explanation: 'Multiple user reports for spam',
    });

    const decision = dte.evaluateAction('low-trust-user', 'start_video_call');
    assert.equal(decision.outcome, 'deny');

    const explanation = dte.getTrustExplanation('low-trust-user', 'identity');
    assert.equal(explanation!.score, 0);
  });

  it('allows custom signal type registration', () => {
    const dte = new DTE();

    dte.registerSignalType({
      type: 'CUSTOM_VERIFICATION',
      source: 'custom-module',
      category: 'identity',
      description: 'Custom identity check',
      defaultWeight: 0.8,
      defaultTtlMs: null,
    });

    const signal = dte.submitSignal({
      accountId: 'user-custom',
      signalType: 'CUSTOM_VERIFICATION',
      value: 75,
      confidence: 90,
      explanation: 'Custom verification passed',
    });

    assert.equal(signal.source, 'custom-module');
    assert.equal(signal.category, 'identity');
  });

  it('tracks decision history across multiple evaluations', () => {
    const dte = new DTE();

    dte.submitSignal({
      accountId: 'history-user',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 80,
      confidence: 95,
      explanation: 'Verified',
    });

    dte.evaluateAction('history-user', 'send_message');
    dte.evaluateAction('history-user', 'upload_image');
    dte.evaluateAction('history-user', 'start_video_call');

    const history = dte.getDecisionHistory('history-user');
    assert.equal(history.length, 3);
    assert.ok(history.some(d => d.action === 'send_message'));
    assert.ok(history.some(d => d.action === 'upload_image'));
    assert.ok(history.some(d => d.action === 'start_video_call'));
  });

  it('supports recalculateTrust independently of decision engine', () => {
    const dte = new DTE();

    dte.submitSignal({
      accountId: 'calc-user',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 90,
      confidence: 100,
      explanation: 'Verified',
    });

    const profile = dte.recalculateTrust('calc-user');
    assert.ok(profile.dimensions.identity);
    assert.ok(profile.dimensions.identity!.score > 0);
  });

  it('returns audit trail with events and decisions', () => {
    const dte = new DTE();

    dte.submitSignal({
      accountId: 'audit-user',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 80,
      confidence: 95,
      explanation: 'test',
    });

    dte.evaluateAction('audit-user', 'send_message');

    const trail = dte.getAuditTrail('audit-user');
    assert.equal(trail.accountId, 'audit-user');
    assert.ok(trail.events.length >= 2);
    assert.ok(trail.decisions.length >= 1);
  });

  it('removes and updates signals', () => {
    const dte = new DTE();

    const signal = dte.submitSignal({
      accountId: 'mutate-user',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 80,
      confidence: 95,
      explanation: 'original',
    });

    const updated = dte.updateSignal(signal.signalId, {
      value: 40,
      explanation: 'downgraded',
    });
    assert.equal(updated.value, 40);

    const removed = dte.removeSignal(signal.signalId);
    assert.equal(removed, true);
  });

  it('supports require_additional_verification outcome via rules', () => {
    const dte = new DTE();

    dte.addRule({
      ruleId: 'require-liveness',
      action: 'high_value_action',
      conditions: [
        { dimension: 'identity', operator: 'gte', value: 80 },
      ],
      outcome: 'require_additional_verification',
      priority: 100,
      enabled: true,
      description: 'Requires additional verification for high-value actions',
    });

    dte.submitSignal({
      accountId: 'verify-user',
      signalType: SIGNAL_TYPES.PHONE_VERIFICATION,
      value: 50,
      confidence: 80,
      explanation: 'Phone verified',
    });

    dte.submitSignal({
      accountId: 'verify-user',
      signalType: SIGNAL_TYPES.AGE_VERIFICATION,
      value: 60,
      confidence: 90,
      explanation: 'Age verified',
    });

    const decision = dte.evaluateAction('verify-user', 'high_value_action');
    assert.equal(decision.outcome, 'require_additional_verification');
  });
});
