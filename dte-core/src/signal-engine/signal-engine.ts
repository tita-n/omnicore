import crypto from 'node:crypto';
import type { Signal, SubmitSignalData } from '../types/signal.types.js';
import type { ISignalEngine } from '../interfaces/ISignalEngine.js';
import type { ISignalRegistry } from '../interfaces/ISignalRegistry.js';
import type { ITrustStorage } from '../interfaces/ITrustStorage.js';
import type { IEventLogger } from '../interfaces/IEventLogger.js';
import type { IConfigManager } from '../interfaces/IConfigManager.js';
import { validateSignalData } from './signal-validator.js';

export class SignalEngine implements ISignalEngine {
  constructor(
    private registry: ISignalRegistry,
    private storage: ITrustStorage,
    private logger: IEventLogger,
    private config: IConfigManager,
  ) {}

  submit(data: SubmitSignalData): Signal {
    const validation = validateSignalData(data);
    if (!validation.valid) {
      throw new Error(`Invalid signal data: ${validation.errors.join('; ')}`);
    }

    const typeDef = this.registry.get(data.signalType);
    if (!typeDef) {
      throw new Error(
        `Unregistered signal type "${data.signalType}". ` +
        `Register it first via registerSignalType() or use a built-in type.`
      );
    }

    const timestamp = Date.now();
    const defaultTtl = typeDef.defaultTtlMs ?? this.config.get<number>('defaultTtlMs');

    const signal: Signal = {
      signalId: crypto.randomUUID(),
      accountId: data.accountId,
      signalType: data.signalType,
      source: typeDef.source,
      category: typeDef.category,
      value: data.value,
      confidence: data.confidence,
      timestamp,
      expirationTime: data.expirationTime !== undefined ? data.expirationTime : defaultTtl !== null ? timestamp + defaultTtl : null,
      explanation: data.explanation,
      metadata: data.metadata,
    };

    this.storage.saveSignal(signal);

    this.logger.log('signal_added', data.accountId, {
      signalId: signal.signalId,
      signalType: data.signalType,
      source: typeDef.source,
      category: typeDef.category,
      value: data.value,
    });

    return signal;
  }

  get(signalId: string): Signal | undefined {
    return this.storage.getSignal(signalId);
  }

  getActive(accountId: string, referenceTime: number): Signal[] {
    const allSignals = this.storage.getSignalsByAccount(accountId);
    return allSignals.filter(s => {
      if (s.expirationTime !== null && referenceTime >= s.expirationTime) {
        return false;
      }
      return true;
    });
  }

  remove(signalId: string): boolean {
    const signal = this.storage.getSignal(signalId);
    if (!signal) return false;

    const removed = this.storage.removeSignal(signalId);
    if (removed) {
      this.logger.log('signal_removed', signal.accountId, {
        signalId,
        signalType: signal.signalType,
      });
    }
    return removed;
  }

  update(signalId: string, updates: Partial<SubmitSignalData>): Signal {
    const existing = this.storage.getSignal(signalId);
    if (!existing) {
      throw new Error(`Signal ${signalId} not found`);
    }

    const changedFields: Record<string, unknown> = {};

    if (updates.value !== undefined) {
      if (updates.value < -100 || updates.value > 100) {
        throw new Error('value must be between -100 and 100');
      }
      changedFields.value = updates.value;
    }

    if (updates.confidence !== undefined) {
      if (updates.confidence < 0 || updates.confidence > 100) {
        throw new Error('confidence must be between 0 and 100');
      }
      changedFields.confidence = updates.confidence;
    }

    if (updates.explanation !== undefined) {
      changedFields.explanation = updates.explanation;
    }

    if (updates.expirationTime !== undefined) {
      changedFields.expirationTime = updates.expirationTime;
    }

    if (updates.metadata !== undefined) {
      changedFields.metadata = updates.metadata;
    }

    this.storage.updateSignal(signalId, changedFields as Partial<Signal>);

    this.logger.log('signal_updated', existing.accountId, {
      signalId,
      changes: changedFields,
    });

    return this.storage.getSignal(signalId)!;
  }
}
