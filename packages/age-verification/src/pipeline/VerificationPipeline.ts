import type { PipelineContext, PipelineStep } from '../interfaces/PipelineStep.js';
import type { VerificationConfig } from '../config/VerificationConfig.js';
import { VerificationStatus, canTransition, isTerminalStatus } from '../models/VerificationStatus.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { VerificationCancelledError } from '../errors/VerificationCancelledError.js';

export class VerificationPipeline {
  private steps: Map<string, PipelineStep> = new Map();
  private config: VerificationConfig;
  private events: EventEmitter;
  private cancelled: boolean = false;

  constructor(config: VerificationConfig, events: EventEmitter) {
    this.config = config;
    this.events = events;
  }

  registerStep(step: PipelineStep): void {
    this.steps.set(step.name, step);
  }

  getRegisteredSteps(): string[] {
    return Array.from(this.steps.keys());
  }

  cancel(): void {
    this.cancelled = true;
  }

  async execute(initialContext: PipelineContext): Promise<PipelineContext> {
    this.cancelled = false;
    let context = { ...initialContext, currentStatus: VerificationStatus.PROCESSING };

    this.events.emit('verification_started', {
      sessionId: context.sessionId,
      timestamp: Date.now(),
    });

    for (const stepName of this.config.pipeline.steps) {
      if (this.cancelled) {
        context = await this.handleCancellation(context);
        break;
      }

      if (isTerminalStatus(context.currentStatus)) break;

      const step = this.steps.get(stepName);
      if (!step) {
        context.error = new Error(`Step not found: ${stepName}`);
        break;
      }

      if (!step.canExecute(context)) continue;

      try {
        const timeoutPromise = this.createTimeoutPromise(stepName);
        const executionPromise = step.execute(context);
        context = await Promise.race([executionPromise, timeoutPromise]);
      } catch (error) {
        context = await step.onError(context, error instanceof Error ? error : new Error(String(error)));
        if (this.config.pipeline.stopOnError) break;
      }
    }

    if (!isTerminalStatus(context.currentStatus) && !this.cancelled) {
      context.currentStatus = VerificationStatus.COMPLETED;
    }

    this.events.emit('verification_completed', {
      sessionId: context.sessionId,
      result: context.finalResult!,
      timestamp: Date.now(),
    });

    return context;
  }

  private async handleCancellation(context: PipelineContext): Promise<PipelineContext> {
    context.currentStatus = VerificationStatus.CANCELLED;
    context.error = new VerificationCancelledError();
    this.events.emit('verification_failed', {
      sessionId: context.sessionId,
      error: context.error as VerificationCancelledError,
      timestamp: Date.now(),
    });
    return context;
  }

  private createTimeoutPromise(stepName: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Step "${stepName}" timed out after ${this.config.pipeline.timeoutMs}ms`));
      }, this.config.pipeline.timeoutMs);
    });
  }
}
