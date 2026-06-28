import type { SignalTypeDefinition } from '../types/signal-type.types.js';

export interface ISignalRegistry {
  register(def: SignalTypeDefinition): void;
  get(signalType: string): SignalTypeDefinition | undefined;
  contains(signalType: string): boolean;
  getAll(): SignalTypeDefinition[];
}
