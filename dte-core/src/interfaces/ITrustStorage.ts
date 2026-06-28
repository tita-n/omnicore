import type { Signal } from '../types/signal.types.js';
import type { TrustEvent, EventSearchCriteria } from '../types/event.types.js';
import type { TrustProfile } from '../types/trust.types.js';
import type { Rule } from '../types/rule.types.js';
import type { DecisionRecord } from '../types/decision.types.js';

export interface ITrustStorage {
  saveSignal(signal: Signal): void;
  getSignal(signalId: string): Signal | undefined;
  getSignalsByAccount(accountId: string): Signal[];
  removeSignal(signalId: string): boolean;
  updateSignal(signalId: string, updates: Partial<Signal>): void;

  saveEvent(event: TrustEvent): void;
  searchEvents(criteria: EventSearchCriteria): TrustEvent[];

  saveTrustProfile(accountId: string, profile: TrustProfile): void;
  getLatestTrustProfile(accountId: string): TrustProfile | undefined;

  saveRule(rule: Rule): void;
  getRules(): Rule[];
  getRulesByAction(action: string): Rule[];
  removeRule(ruleId: string): boolean;

  saveDecision(record: DecisionRecord): void;
  getDecisionHistory(
    accountId: string,
    options?: { limit?: number; offset?: number; action?: string; from?: number; to?: number }
  ): DecisionRecord[];
}
