import type { DTEConnector as DTEConnectorInterface, DTEConnectorConfig } from '../interfaces/DTEConnector.js';
import type { VerificationResult } from '../models/VerificationResult.js';

export class DTEConnector implements DTEConnectorInterface {
  private config: DTEConnectorConfig;

  constructor(config: DTEConnectorConfig) {
    this.config = config;
  }

  async emitSignal(verificationResult: VerificationResult, _userId: string): Promise<void> {
    const signal = {
      type: this.config.signalType,
      source: this.config.source,
      data: {
        verificationId: verificationResult.verificationId,
        ageBand: verificationResult.ageBand,
        confidence: verificationResult.confidence,
        qualityScore: verificationResult.qualityScore,
        livenessScore: verificationResult.livenessScore,
        timestamp: verificationResult.timestamp,
      },
      weight: this.config.defaultWeight,
      ttlMs: this.config.defaultTtlMs,
    };

    await this.postSignal(signal);
  }

  getSignalType(): string {
    return this.config.signalType;
  }

  getSignalSource(): string {
    return this.config.source;
  }

  private async postSignal(_signal: Record<string, unknown>): Promise<void> {
    if (!this.config.dteEndpoint) return;

    const response = await fetch(this.config.dteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(_signal),
    });

    if (!response.ok) {
      throw new Error(`DTE signal failed: ${response.status} ${response.statusText}`);
    }
  }
}
