import type { VerificationEventType, VerificationEventPayloads } from './EventTypes.js';

type Listener<T = unknown> = (payload: T) => void | Promise<void>;

export class EventEmitter {
  private listeners: Map<string, Set<Listener<unknown>>> = new Map();

  on<E extends VerificationEventType>(
    event: E,
    listener: Listener<VerificationEventPayloads[E]>
  ): void {
    const existing = this.listeners.get(event) ?? new Set();
    existing.add(listener as Listener<unknown>);
    this.listeners.set(event, existing);
  }

  off<E extends VerificationEventType>(
    event: E,
    listener: Listener<VerificationEventPayloads[E]>
  ): void {
    const existing = this.listeners.get(event);
    if (existing) {
      existing.delete(listener as Listener<unknown>);
      if (existing.size === 0) this.listeners.delete(event);
    }
  }

  emit<E extends VerificationEventType>(
    event: E,
    payload: VerificationEventPayloads[E]
  ): void {
    const existing = this.listeners.get(event);
    if (existing) {
      for (const listener of existing) {
        listener(payload);
      }
    }
  }

  async emitAsync<E extends VerificationEventType>(
    event: E,
    payload: VerificationEventPayloads[E]
  ): Promise<void> {
    const existing = this.listeners.get(event);
    if (existing) {
      const promises: Promise<void>[] = [];
      for (const listener of existing) {
        const result = listener(payload);
        if (result instanceof Promise) promises.push(result);
      }
      await Promise.all(promises);
    }
  }

  removeAll(): void {
    this.listeners.clear();
  }

  listenerCount(event: VerificationEventType): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
