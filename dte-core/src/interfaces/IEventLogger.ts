import type { TrustEvent, EventSearchCriteria } from '../types/event.types.js';

export interface IEventLogger {
  log(type: TrustEvent['type'], accountId: string, data: Record<string, unknown>): TrustEvent;
  search(criteria: EventSearchCriteria): TrustEvent[];
}
