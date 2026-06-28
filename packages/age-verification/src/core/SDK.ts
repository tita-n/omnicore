import type { DTEOptions } from './types.js';
import type { VerificationConfig } from '../config/VerificationConfig.js';
import type { VerificationSession as VerificationSessionModel } from '../models/VerificationSession.js';
import type { VerificationResult } from '../models/VerificationResult.js';
import { VerificationStatus } from '../models/VerificationStatus.js';
import { createVerificationSession, updateSessionStatus } from '../models/VerificationSession.js';
import { createEmptyResult } from '../models/VerificationResult.js';
import { defaultConfig } from '../config/defaultConfig.js';
import { isConfigValid } from '../config/configSchema.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { VerificationPipeline } from '../pipeline/VerificationPipeline.js';

export class AgeVerificationSDK {
  private config: VerificationConfig;
  private events: EventEmitter = new EventEmitter();
  private pipeline: VerificationPipeline;
  private sessions: Map<string, VerificationSessionModel> = new Map();
  private results: Map<string, VerificationResult> = new Map();

  constructor(dteOptions?: DTEOptions) {
    this.config = { ...defaultConfig };

    if (dteOptions?.dteEndpoint) {
      this.config.dte.endpoint = dteOptions.dteEndpoint;
    }

    if (!isConfigValid(this.config)) {
      console.warn('Default configuration is invalid — this indicates a code defect');
    }

    this.pipeline = new VerificationPipeline(this.config, this.events);
  }

  get events$(): EventEmitter {
    return this.events;
  }

  createSession(userId: string, metadata?: Record<string, unknown>): VerificationSessionModel {
    const sessionId = this.generateId();
    const session = createVerificationSession(sessionId, userId, metadata as Record<string, string>);
    this.sessions.set(sessionId, session);

    this.events.emit('session_created', { session });
    return session;
  }

  async startVerification(sessionId: string, _userId: string): Promise<VerificationResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const updated = updateSessionStatus(session, VerificationStatus.PROCESSING);
    this.sessions.set(sessionId, updated);

    return createEmptyResult(sessionId, _userId);
  }

  cancelVerification(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.pipeline.cancel();
    const updated = updateSessionStatus(session, VerificationStatus.CANCELLED);
    this.sessions.set(sessionId, updated);
  }

  getVerificationResult(sessionId: string): VerificationResult | undefined {
    return this.results.get(sessionId);
  }

  getVerificationStatus(sessionId: string): VerificationStatus | undefined {
    return this.sessions.get(sessionId)?.status;
  }

  private generateId(): string {
    return `avm_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
}
