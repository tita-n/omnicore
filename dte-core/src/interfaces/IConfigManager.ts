import type { DTEConfig } from '../types/config.types.js';

export interface IConfigManager {
  get<T = unknown>(path: string): T;
  getAll(): DTEConfig;
  update(path: string, value: unknown): void;
}
