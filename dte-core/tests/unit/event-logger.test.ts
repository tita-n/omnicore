import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryTrustStorage } from '../../src/storage/memory-storage.js';
import { EventLogger } from '../../src/event-logger/event-logger.js';

describe('EventLogger', () => {
  let storage: MemoryTrustStorage;
  let logger: EventLogger;

  beforeEach(() => {
    storage = new MemoryTrustStorage();
    logger = new EventLogger(storage);
  });

  it('creates events with UUID and timestamp', () => {
    const event = logger.log('signal_added', 'user-1', { signalId: 'abc' });
    assert.ok(event.eventId);
    assert.equal(event.eventId.length, 36);
    assert.ok(event.timestamp > 0);
    assert.equal(event.type, 'signal_added');
    assert.equal(event.accountId, 'user-1');
  });

  it('searches events by accountId', () => {
    logger.log('signal_added', 'user-1', {});
    logger.log('signal_removed', 'user-1', {});
    logger.log('signal_added', 'user-2', {});

    const user1Events = logger.search({ accountId: 'user-1' });
    assert.equal(user1Events.length, 2);
  });

  it('searches events by type', () => {
    logger.log('signal_added', 'user-1', {});
    logger.log('decision_requested', 'user-1', {});
    logger.log('signal_added', 'user-1', {});

    const addedEvents = logger.search({ accountId: 'user-1', type: 'signal_added' });
    assert.equal(addedEvents.length, 2);
  });

  it('searches events by time range', async () => {
    logger.log('signal_added', 'user-1', {});
    await new Promise(r => setTimeout(r, 5));
    const mid = Date.now();
    logger.log('signal_removed', 'user-1', {});

    const result = logger.search({ accountId: 'user-1', from: mid });
    assert.equal(result.length, 1);
    assert.equal(result[0]!.type, 'signal_removed');
  });
});
