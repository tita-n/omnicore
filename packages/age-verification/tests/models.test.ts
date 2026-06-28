import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AgeBand,
  ageBandFromNumber,
  ageBandToRange,
  isAgeBand,
  VerificationStatus,
  isVerificationStatus,
  isTerminalStatus,
  canTransition,
  createVerificationSession,
  updateSessionStatus,
  createEmptyResult,
  isResultValid,
} from '../src/models/index.js';

void describe('AgeBand', () => {
  void it('has expected enum values', () => {
    assert.equal(AgeBand.UNKNOWN, 'UNKNOWN');
    assert.equal(AgeBand.AGE_13_15, 'AGE_13_15');
    assert.equal(AgeBand.AGE_16_17, 'AGE_16_17');
    assert.equal(AgeBand.AGE_18_20, 'AGE_18_20');
    assert.equal(AgeBand.AGE_21_PLUS, 'AGE_21_PLUS');
  });

  void it('ageBandFromNumber returns correct band', () => {
    assert.equal(ageBandFromNumber(10), AgeBand.UNKNOWN);
    assert.equal(ageBandFromNumber(13), AgeBand.AGE_13_15);
    assert.equal(ageBandFromNumber(16), AgeBand.AGE_16_17);
    assert.equal(ageBandFromNumber(18), AgeBand.AGE_18_20);
    assert.equal(ageBandFromNumber(21), AgeBand.AGE_21_PLUS);
    assert.equal(ageBandFromNumber(99), AgeBand.AGE_21_PLUS);
  });

  void it('ageBandToRange returns correct ranges', () => {
    assert.deepEqual(ageBandToRange(AgeBand.AGE_13_15), { min: 13, max: 15 });
    assert.deepEqual(ageBandToRange(AgeBand.UNKNOWN), { min: 0, max: null });
    assert.deepEqual(ageBandToRange(AgeBand.AGE_21_PLUS), { min: 21, max: null });
  });

  void it('isAgeBand validates correctly', () => {
    assert.equal(isAgeBand('AGE_18_20'), true);
    assert.equal(isAgeBand('INVALID'), false);
    assert.equal(isAgeBand(123), false);
    assert.equal(isAgeBand(null), false);
  });
});

void describe('VerificationStatus', () => {
  void it('has expected enum values', () => {
    assert.equal(VerificationStatus.CREATED, 'CREATED');
    assert.equal(VerificationStatus.CAPTURING, 'CAPTURING');
    assert.equal(VerificationStatus.PROCESSING, 'PROCESSING');
    assert.equal(VerificationStatus.COMPLETED, 'COMPLETED');
    assert.equal(VerificationStatus.FAILED, 'FAILED');
    assert.equal(VerificationStatus.CANCELLED, 'CANCELLED');
  });

  void it('isVerificationStatus validates correctly', () => {
    assert.equal(isVerificationStatus('CREATED'), true);
    assert.equal(isVerificationStatus('UNKNOWN'), false);
    assert.equal(isVerificationStatus(undefined), false);
  });

  void it('isTerminalStatus identifies terminal states', () => {
    assert.equal(isTerminalStatus(VerificationStatus.COMPLETED), true);
    assert.equal(isTerminalStatus(VerificationStatus.FAILED), true);
    assert.equal(isTerminalStatus(VerificationStatus.CANCELLED), true);
    assert.equal(isTerminalStatus(VerificationStatus.CREATED), false);
    assert.equal(isTerminalStatus(VerificationStatus.PROCESSING), false);
  });

  void it('canTransition enforces valid transitions', () => {
    assert.equal(canTransition(VerificationStatus.CREATED, VerificationStatus.CAPTURING), true);
    assert.equal(canTransition(VerificationStatus.CREATED, VerificationStatus.CANCELLED), true);
    assert.equal(canTransition(VerificationStatus.CREATED, VerificationStatus.COMPLETED), false);
    assert.equal(canTransition(VerificationStatus.COMPLETED, VerificationStatus.CREATED), false);
    assert.equal(canTransition(VerificationStatus.CAPTURING, VerificationStatus.PROCESSING), true);
    assert.equal(canTransition(VerificationStatus.PROCESSING, VerificationStatus.COMPLETED), true);
    assert.equal(canTransition(VerificationStatus.PROCESSING, VerificationStatus.FAILED), true);
  });
});

void describe('VerificationSession', () => {
  void it('createVerificationSession creates with CREATED status', () => {
    const session = createVerificationSession('sess_1', 'user_1');
    assert.equal(session.sessionId, 'sess_1');
    assert.equal(session.userId, 'user_1');
    assert.equal(session.status, VerificationStatus.CREATED);
    assert.ok(session.createdAt > 0);
    assert.equal(session.createdAt, session.updatedAt);
  });

  void it('updateSessionStatus changes status and updatedAt', async () => {
    const session = createVerificationSession('sess_2', 'user_2');
    const original = session.updatedAt;
    await new Promise(r => setTimeout(r, 10));
    const updated = updateSessionStatus(session, VerificationStatus.CAPTURING);
    assert.equal(updated.status, VerificationStatus.CAPTURING);
    assert.ok(updated.updatedAt > original);
  });
});

void describe('VerificationResult', () => {
  void it('createEmptyResult creates with defaults', () => {
    const result = createEmptyResult('sess_3', 'user_3');
    assert.equal(result.sessionId, 'sess_3');
    assert.equal(result.userId, 'user_3');
    assert.equal(result.ageBand, AgeBand.UNKNOWN);
    assert.equal(result.confidence, 0);
    assert.equal(result.verificationStatus, VerificationStatus.CREATED);
    assert.equal(result.evidence.faceDetected, false);
  });

  void it('isResultValid checks thresholds', () => {
    const result = createEmptyResult('sess_4', 'user_4');
    assert.equal(isResultValid(result, 0.5, 0.5), false);

    const validResult = { ...result, confidence: 0.8, qualityScore: 0.7, verificationStatus: VerificationStatus.COMPLETED, evidence: { ...result.evidence, faceDetected: true } };
    assert.equal(isResultValid(validResult, 0.5, 0.5), true);
    assert.equal(isResultValid(validResult, 0.9, 0.5), false);
  });
});
