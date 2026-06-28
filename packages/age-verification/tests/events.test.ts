import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from '../src/events/EventEmitter.js';
import { VerificationStatus } from '../src/models/VerificationStatus.js';

void describe('EventEmitter', () => {
  void it('emits and receives events', () => {
    const emitter = new EventEmitter();
    let received: string | null = null;

    emitter.on('verification_completed', (payload) => {
      received = payload.sessionId;
    });

    emitter.emit('verification_completed', {
      sessionId: 'sess_1',
      result: {
        verificationId: 'v_1',
        sessionId: 'sess_1',
        userId: 'u_1',
        ageBand: 'AGE_18_20' as const,
        confidence: 0.9,
        qualityScore: 0.8,
        livenessScore: 0.9,
        verificationStatus: VerificationStatus.COMPLETED,
        timestamp: Date.now(),
        evidence: {
          faceDetected: true,
          qualityScore: 0.8,
          livenessScore: 0.9,
          framesAnalyzed: 5,
          captureDurationMs: 1000,
        },
      },
      timestamp: Date.now(),
    });

    assert.equal(received, 'sess_1');
  });

  void it('unsubscribes listeners', () => {
    const emitter = new EventEmitter();
    let count = 0;

    const listener = () => { count++; };
    emitter.on('session_created', listener);
    emitter.emit('session_created', { session: { sessionId: 's_1', userId: 'u_1', createdAt: 0, updatedAt: 0, status: VerificationStatus.CREATED, metadata: {} } });
    assert.equal(count, 1);

    emitter.off('session_created', listener);
    emitter.emit('session_created', { session: { sessionId: 's_1', userId: 'u_1', createdAt: 0, updatedAt: 0, status: VerificationStatus.CREATED, metadata: {} } });
    assert.equal(count, 1);
  });

  void it('supports async emit', async () => {
    const emitter = new EventEmitter();
    let resolved = false;

    emitter.on('verification_started', async () => {
      await new Promise(r => setTimeout(r, 10));
      resolved = true;
    });

    await emitter.emitAsync('verification_started', {
      sessionId: 's_1',
      timestamp: Date.now(),
    });

    assert.equal(resolved, true);
  });

  void it('listenerCount returns correct count', () => {
    const emitter = new EventEmitter();
    assert.equal(emitter.listenerCount('session_created'), 0);

    const fn1 = () => {};
    const fn2 = () => {};
    emitter.on('session_created', fn1);
    emitter.on('session_created', fn2);
    assert.equal(emitter.listenerCount('session_created'), 2);
  });

  void it('removeAll clears all listeners', () => {
    const emitter = new EventEmitter();
    emitter.on('session_created', () => {});
    emitter.on('verification_completed', () => {});
    emitter.removeAll();
    assert.equal(emitter.listenerCount('session_created'), 0);
    assert.equal(emitter.listenerCount('verification_completed'), 0);
  });
});
