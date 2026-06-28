import type { Signal } from '../types/signal.types.js';
import type { TrustEvent, EventSearchCriteria } from '../types/event.types.js';
import type { TrustProfile } from '../types/trust.types.js';
import type { Rule } from '../types/rule.types.js';
import type { DecisionRecord } from '../types/decision.types.js';
import type { ITrustStorage } from '../interfaces/ITrustStorage.js';

export class MemoryTrustStorage implements ITrustStorage {
  private signals = new Map<string, Signal>();
  private events: TrustEvent[] = [];
  private trustProfiles = new Map<string, TrustProfile>();
  private rules = new Map<string, Rule>();
  private decisions: DecisionRecord[] = [];

  saveSignal(signal: Signal): void {
    this.signals.set(signal.signalId, signal);
  }

  getSignal(signalId: string): Signal | undefined {
    return this.signals.get(signalId);
  }

  getSignalsByAccount(accountId: string): Signal[] {
    const result: Signal[] = [];
    for (const signal of this.signals.values()) {
      if (signal.accountId === accountId) {
        result.push(signal);
      }
    }
    return result;
  }

  removeSignal(signalId: string): boolean {
    return this.signals.delete(signalId);
  }

  updateSignal(signalId: string, updates: Partial<Signal>): void {
    const existing = this.signals.get(signalId);
    if (!existing) {
      throw new Error(`Signal ${signalId} not found`);
    }
    this.signals.set(signalId, { ...existing, ...updates });
  }

  saveEvent(event: TrustEvent): void {
    this.events.push(event);
  }

  searchEvents(criteria: EventSearchCriteria): TrustEvent[] {
    let results = this.events;

    if (criteria.accountId) {
      results = results.filter(e => e.accountId === criteria.accountId);
    }
    if (criteria.type) {
      results = results.filter(e => e.type === criteria.type);
    }
    if (criteria.from !== undefined) {
      results = results.filter(e => e.timestamp >= criteria.from!);
    }
    if (criteria.to !== undefined) {
      results = results.filter(e => e.timestamp <= criteria.to!);
    }

    const offset = criteria.offset ?? 0;
    const limit = criteria.limit ?? results.length;
    return results.slice(offset, offset + limit);
  }

  saveTrustProfile(accountId: string, profile: TrustProfile): void {
    this.trustProfiles.set(accountId, profile);
  }

  getLatestTrustProfile(accountId: string): TrustProfile | undefined {
    return this.trustProfiles.get(accountId);
  }

  saveRule(rule: Rule): void {
    this.rules.set(rule.ruleId, rule);
  }

  getRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  getRulesByAction(action: string): Rule[] {
    return Array.from(this.rules.values()).filter(r => r.action === action);
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  saveDecision(record: DecisionRecord): void {
    this.decisions.push(record);
  }

  getDecisionHistory(
    accountId: string,
    options?: { limit?: number; offset?: number; action?: string; from?: number; to?: number }
  ): DecisionRecord[] {
    let results = this.decisions.filter(d => d.accountId === accountId);

    if (options?.action) {
      results = results.filter(d => d.action === options.action);
    }
    if (options?.from !== undefined) {
      results = results.filter(d => d.evaluatedAt >= options.from!);
    }
    if (options?.to !== undefined) {
      results = results.filter(d => d.evaluatedAt <= options.to!);
    }

    results.sort((a, b) => b.evaluatedAt - a.evaluatedAt);

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    return results.slice(offset, offset + limit);
  }
}
