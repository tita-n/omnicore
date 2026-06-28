import type { Signal, SubmitSignalData } from '../types/signal.types.js';

export interface ISignalEngine {
  submit(data: SubmitSignalData): Signal;
  get(signalId: string): Signal | undefined;
  getActive(accountId: string, referenceTime: number): Signal[];
  remove(signalId: string): boolean;
  update(signalId: string, updates: Partial<SubmitSignalData>): Signal;
}
