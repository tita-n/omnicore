import type { SignalTypeDefinition, SignalCategory } from '../types/signal-type.types.js';
import type { ISignalRegistry } from '../interfaces/ISignalRegistry.js';
import { SIGNAL_TYPES } from '../types/signal-type.types.js';

interface BuiltInEntry {
  type: string;
  source: string;
  category: SignalCategory;
  description: string;
  defaultWeight: number;
  defaultTtlMs: number | null;
}

const BUILT_IN_TYPES: BuiltInEntry[] = [
  {
    type: SIGNAL_TYPES.AGE_VERIFICATION,
    source: 'age-verification',
    category: 'identity',
    description: 'Verified age via government ID or trusted third-party',
    defaultWeight: 1.0,
    defaultTtlMs: 365 * 24 * 60 * 60 * 1000,
  },
  {
    type: SIGNAL_TYPES.PHONE_VERIFICATION,
    source: 'phone-verification',
    category: 'identity',
    description: 'Verified phone number via carrier or SMS challenge',
    defaultWeight: 1.0,
    defaultTtlMs: 180 * 24 * 60 * 60 * 1000,
  },
  {
    type: SIGNAL_TYPES.EMAIL_VERIFICATION,
    source: 'email-verification',
    category: 'identity',
    description: 'Verified email address via confirmation link',
    defaultWeight: 0.7,
    defaultTtlMs: 180 * 24 * 60 * 60 * 1000,
  },
  {
    type: SIGNAL_TYPES.DEVICE_TRUST,
    source: 'device-trust',
    category: 'device',
    description: 'Recognized device with consistent usage pattern',
    defaultWeight: 0.8,
    defaultTtlMs: 90 * 24 * 60 * 60 * 1000,
  },
  {
    type: SIGNAL_TYPES.LIVENESS,
    source: 'liveness-detection',
    category: 'identity',
    description: 'Liveness check passed during verification',
    defaultWeight: 0.9,
    defaultTtlMs: 30 * 24 * 60 * 60 * 1000,
  },
  {
    type: SIGNAL_TYPES.BEHAVIOR,
    source: 'behavioral-analysis',
    category: 'behavior',
    description: 'Behavioral pattern analysis score',
    defaultWeight: 0.7,
    defaultTtlMs: 7 * 24 * 60 * 60 * 1000,
  },
  {
    type: SIGNAL_TYPES.COMMUNITY_REPORT,
    source: 'community-reputation',
    category: 'community',
    description: 'Report submitted by another community member',
    defaultWeight: 0.6,
    defaultTtlMs: null,
  },
  {
    type: SIGNAL_TYPES.SPAM_DETECTION,
    source: 'fraud-detection',
    category: 'behavior',
    description: 'Spam or fraudulent behavior detected',
    defaultWeight: 0.9,
    defaultTtlMs: 30 * 24 * 60 * 60 * 1000,
  },
  {
    type: SIGNAL_TYPES.PHOTO_VERIFICATION,
    source: 'photo-verification',
    category: 'identity',
    description: 'Photo matched against verified identity document',
    defaultWeight: 0.5,
    defaultTtlMs: 365 * 24 * 60 * 60 * 1000,
  },
];

export class SignalRegistry implements ISignalRegistry {
  private definitions = new Map<string, SignalTypeDefinition>();

  constructor() {
    for (const entry of BUILT_IN_TYPES) {
      this.register(entry);
    }
  }

  register(def: SignalTypeDefinition): void {
    if (!def.type || !def.source || !def.category) {
      throw new Error('Signal type definition must include type, source, and category');
    }
    if (this.definitions.has(def.type)) {
      throw new Error(`Signal type "${def.type}" is already registered`);
    }
    this.definitions.set(def.type, { ...def });
  }

  get(signalType: string): SignalTypeDefinition | undefined {
    return this.definitions.get(signalType);
  }

  contains(signalType: string): boolean {
    return this.definitions.has(signalType);
  }

  getAll(): SignalTypeDefinition[] {
    return Array.from(this.definitions.values());
  }
}
