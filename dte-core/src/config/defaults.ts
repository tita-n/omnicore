import type { DTEConfig } from '../types/config.types.js';
import type { Rule } from '../types/rule.types.js';

export function defaultConfig(): DTEConfig {
  return {
    dimensions: {
      identity: { weight: 1.0, halfLifeMs: 30 * 24 * 60 * 60 * 1000 },
      behavior: { weight: 0.8, halfLifeMs: 7 * 24 * 60 * 60 * 1000 },
      community: { weight: 0.6, halfLifeMs: 14 * 24 * 60 * 60 * 1000 },
      device: { weight: 0.7, halfLifeMs: 90 * 24 * 60 * 60 * 1000 },
      account: { weight: 0.5, halfLifeMs: 180 * 24 * 60 * 60 * 1000 },
    },
    decay: {
      identity: { halfLifeMs: 30 * 24 * 60 * 60 * 1000 },
      behavior: { halfLifeMs: 7 * 24 * 60 * 60 * 1000 },
      community: { halfLifeMs: 14 * 24 * 60 * 60 * 1000 },
      device: { halfLifeMs: 90 * 24 * 60 * 60 * 1000 },
      account: { halfLifeMs: 180 * 24 * 60 * 60 * 1000 },
    },
    sourceMultipliers: [],
    rules: defaultRules(),
    maxLogSize: 10_000,
    defaultTtlMs: 90 * 24 * 60 * 60 * 1000,
  };
}

export function defaultRules(): Rule[] {
  return [
    {
      ruleId: 'send-messages',
      action: 'send_message',
      conditions: [
        { dimension: 'identity', operator: 'gte', value: 30 },
      ],
      outcome: 'allow',
      priority: 100,
      enabled: true,
      description: 'Minimum identity trust required for messaging',
    },
    {
      ruleId: 'upload-images',
      action: 'upload_image',
      conditions: [
        { dimension: 'identity', operator: 'gte', value: 40 },
      ],
      outcome: 'allow',
      priority: 100,
      enabled: true,
      description: 'Minimum identity trust required for uploading images',
    },
    {
      ruleId: 'premium-access',
      action: 'access_premium',
      conditions: [
        { dimension: 'identity', operator: 'gte', value: 60 },
        { dimension: 'account', operator: 'gte', value: 50 },
      ],
      outcome: 'allow',
      priority: 100,
      enabled: true,
      description: 'Minimum identity and account trust required for premium access',
    },
    {
      ruleId: 'create-groups',
      action: 'create_group',
      conditions: [
        { dimension: 'identity', operator: 'gte', value: 50 },
        { dimension: 'behavior', operator: 'gte', value: 40 },
      ],
      outcome: 'allow',
      priority: 100,
      enabled: true,
      description: 'Minimum identity and behavior trust required for creating groups',
    },
    {
      ruleId: 'start-video-call',
      action: 'start_video_call',
      conditions: [
        { dimension: 'identity', operator: 'gte', value: 70 },
        { dimension: 'behavior', operator: 'gte', value: 50 },
      ],
      outcome: 'allow',
      priority: 100,
      enabled: true,
      description: 'Minimum identity and behavior trust required for starting video calls',
    },
    {
      ruleId: 'high-risk-messaging',
      action: 'send_message',
      conditions: [
        { dimension: 'identity', operator: 'gte', value: 50 },
        { dimension: 'behavior', operator: 'gte', value: 60 },
      ],
      outcome: 'allow',
      priority: 50,
      enabled: true,
      description: 'Higher trust threshold for unrestricted messaging',
    },
    {
      ruleId: 'profile-verification',
      action: 'verify_profile',
      conditions: [
        { dimension: 'account', operator: 'gte', value: 40 },
      ],
      outcome: 'allow',
      priority: 100,
      enabled: true,
      description: 'Minimum account trust required for profile verification',
    },
  ];
}
