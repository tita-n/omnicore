import type { DTEConfig } from '../types/config.types.js';
import type { IConfigManager } from '../interfaces/IConfigManager.js';
import { defaultConfig } from './defaults.js';

export class ConfigManager implements IConfigManager {
  private config: DTEConfig;

  constructor(overrides?: Partial<DTEConfig>) {
    this.config = this.merge(defaultConfig(), overrides ?? {});
    this.validate();
  }

  get<T = unknown>(path: string): T {
    const parts = path.split('.');
    let current: unknown = this.config;

    for (const part of parts) {
      if (typeof current !== 'object' || current === null) {
        throw new Error(`Config path "${path}" not found`);
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current as T;
  }

  getAll(): DTEConfig {
    return { ...this.config, rules: [...this.config.rules] };
  }

  update(path: string, value: unknown): void {
    const parts = path.split('.');
    let current: Record<string, unknown> = this.config as unknown as Record<string, unknown>;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    const lastKey = parts[parts.length - 1]!;
    current[lastKey] = value;
    this.validate();
  }

  private merge(base: DTEConfig, overrides: Partial<DTEConfig>): DTEConfig {
    const merged: DTEConfig = {
      ...base,
      ...overrides,
    };

    if (overrides.dimensions) {
      merged.dimensions = { ...base.dimensions };
      for (const [key, val] of Object.entries(overrides.dimensions)) {
        merged.dimensions[key] = { ...base.dimensions[key]!, ...val };
      }
    }

    if (overrides.decay) {
      merged.decay = { ...base.decay };
      for (const [key, val] of Object.entries(overrides.decay)) {
        merged.decay[key] = { ...base.decay[key]!, ...val };
      }
    }

    if (overrides.rules) {
      merged.rules = [...overrides.rules];
    }

    if (overrides.sourceMultipliers) {
      merged.sourceMultipliers = [...overrides.sourceMultipliers];
    }

    return merged;
  }

  private validate(): void {
    for (const [name, dim] of Object.entries(this.config.dimensions)) {
      if (dim.weight < 0 || dim.weight > 1) {
        throw new Error(`Dimension "${name}" weight must be between 0 and 1`);
      }
      if (dim.halfLifeMs <= 0) {
        throw new Error(`Dimension "${name}" halfLifeMs must be positive`);
      }
    }

    for (const [name, dec] of Object.entries(this.config.decay)) {
      if (dec.halfLifeMs <= 0) {
        throw new Error(`Decay "${name}" halfLifeMs must be positive`);
      }
    }

    if (this.config.maxLogSize < 1) {
      throw new Error('maxLogSize must be at least 1');
    }

    if (this.config.defaultTtlMs <= 0) {
      throw new Error('defaultTtlMs must be positive');
    }

    for (const rule of this.config.rules) {
      if (!rule.ruleId || !rule.action) {
        throw new Error('Each rule must have a ruleId and action');
      }
    }
  }
}
