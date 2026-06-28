import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConfigManager, defaultConfig } from '../../src/config/index.js';

describe('ConfigManager', () => {
  it('loads with default config', () => {
    const config = new ConfigManager();
    const all = config.getAll();
    assert.ok(all.dimensions.identity);
    assert.equal(all.dimensions.identity!.weight, 1.0);
    assert.ok(all.rules.length > 0);
  });

  it('accepts partial overrides', () => {
    const config = new ConfigManager({
      dimensions: {
        identity: { weight: 0.5, halfLifeMs: 1000 },
      },
    });

    assert.equal(config.get<number>('dimensions.identity.weight'), 0.5);
    assert.equal(config.get<number>('dimensions.identity.halfLifeMs'), 1000);
    assert.equal(config.get<number>('dimensions.behavior.weight'), 0.8);
  });

  it('validates dimension weight range', () => {
    assert.throws(() =>
      new ConfigManager({
        dimensions: {
          identity: { weight: 5, halfLifeMs: 1000 },
        },
      }),
      /weight must be between 0 and 1/,
    );
  });

  it('validates halfLifeMs is positive', () => {
    assert.throws(() =>
      new ConfigManager({
        decay: {
          identity: { halfLifeMs: 0 },
        },
      }),
      /halfLifeMs must be positive/,
    );
  });

  it('validates maxLogSize', () => {
    assert.throws(
      () => new ConfigManager({ maxLogSize: 0 }),
      /maxLogSize must be at least 1/,
    );
  });

  it('retrieves nested config by dot path', () => {
    const config = new ConfigManager();
    assert.equal(config.get<number>('dimensions.identity.weight'), 1.0);
  });

  it('throws on invalid path', () => {
    const config = new ConfigManager();
    assert.throws(() => config.get('does.not.exist'));
  });

  it('updates config at dot path', () => {
    const config = new ConfigManager();
    config.update('dimensions.identity.weight', 0.3);
    assert.equal(config.get<number>('dimensions.identity.weight'), 0.3);
  });
});
