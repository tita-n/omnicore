export type EventType =
  | 'signal_added'
  | 'signal_removed'
  | 'signal_updated'
  | 'trust_recalculated'
  | 'decision_requested'
  | 'rule_triggered';

export interface TrustEvent {
  eventId: string;
  type: EventType;
  accountId: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface EventSearchCriteria {
  accountId?: string;
  type?: EventType;
  from?: number;
  to?: number;
  limit?: number;
  offset?: number;
}
