import crypto from 'node:crypto';
import type { TrustEvent, EventType, EventSearchCriteria } from '../types/event.types.js';
import type { IEventLogger } from '../interfaces/IEventLogger.js';
import type { ITrustStorage } from '../interfaces/ITrustStorage.js';

export class EventLogger implements IEventLogger {
  constructor(private storage: ITrustStorage) {}

  log(type: EventType, accountId: string, data: Record<string, unknown>): TrustEvent {
    const event: TrustEvent = {
      eventId: crypto.randomUUID(),
      type,
      accountId,
      timestamp: Date.now(),
      data,
    };

    this.storage.saveEvent(event);
    return event;
  }

  search(criteria: EventSearchCriteria): TrustEvent[] {
    return this.storage.searchEvents(criteria);
  }
}
