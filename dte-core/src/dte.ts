import type { Signal, SubmitSignalData } from './types/signal.types.js';
import type { SignalTypeDefinition } from './types/signal-type.types.js';
import type { TrustProfile } from './types/trust.types.js';
import type { Decision } from './types/decision.types.js';
import type { DecisionRecord } from './types/decision.types.js';
import type { AuditTrail, DimensionExplanation } from './types/audit.types.js';
import type { Rule } from './types/rule.types.js';
import type { DTEConfig } from './types/config.types.js';

import { ConfigManager, defaultConfig } from './config/index.js';
import { MemoryTrustStorage } from './storage/index.js';
import { EventLogger } from './event-logger/index.js';
import { SignalRegistry, SignalEngine } from './signal-engine/index.js';
import { TrustCalculator } from './trust-calculator/index.js';
import { RulesEngine } from './rules-engine/index.js';
import { AuditSystem } from './audit-system/index.js';
import { DecisionEngine } from './decision-engine/index.js';

export class DTE {
  private configManager: ConfigManager;
  private storage: MemoryTrustStorage;
  private logger: EventLogger;
  private registry: SignalRegistry;
  private signalEngine: SignalEngine;
  private calculator: TrustCalculator;
  private rulesEngine: RulesEngine;
  private auditSystem: AuditSystem;
  private decisionEngine: DecisionEngine;

  constructor(config?: Partial<DTEConfig>) {
    const resolvedConfig = config ? { ...defaultConfig(), ...config } : defaultConfig();
    this.configManager = new ConfigManager(resolvedConfig);
    this.storage = new MemoryTrustStorage();
    this.logger = new EventLogger(this.storage);
    this.registry = new SignalRegistry();
    this.signalEngine = new SignalEngine(this.registry, this.storage, this.logger, this.configManager);
    this.calculator = new TrustCalculator();
    this.rulesEngine = new RulesEngine(this.storage);
    this.auditSystem = new AuditSystem(this.storage, this.signalEngine, this.calculator, this.configManager);
    this.decisionEngine = new DecisionEngine(
      this.calculator,
      this.rulesEngine,
      this.logger,
      this.configManager,
      this.storage,
      this.signalEngine,
    );

    for (const rule of resolvedConfig.rules) {
      this.rulesEngine.add(rule);
    }
  }

  submitSignal(data: SubmitSignalData): Signal {
    return this.signalEngine.submit(data);
  }

  recalculateTrust(accountId: string, referenceTime?: number): TrustProfile {
    const refTime = referenceTime ?? Date.now();
    const activeSignals = this.signalEngine.getActive(accountId, refTime);
    const config = this.configManager.getAll();

    const profile = this.calculator.calculate({
      accountId,
      signals: activeSignals,
      dimensionConfigs: config.dimensions,
      decayConfigs: config.decay,
      sourceMultipliers: config.sourceMultipliers,
      referenceTime: refTime,
    });

    this.storage.saveTrustProfile(accountId, profile);
    return profile;
  }

  getTrustProfile(accountId: string): TrustProfile | undefined {
    return this.storage.getLatestTrustProfile(accountId);
  }

  evaluateAction(accountId: string, action: string, referenceTime?: number): Decision {
    return this.decisionEngine.evaluate({
      accountId,
      action,
      referenceTime: referenceTime ?? Date.now(),
    });
  }

  getAuditTrail(accountId: string, referenceTime?: number): AuditTrail {
    return this.auditSystem.getAuditTrail(accountId, referenceTime ?? Date.now());
  }

  getTrustExplanation(
    accountId: string,
    dimension: string,
    referenceTime?: number,
  ): DimensionExplanation | undefined {
    return this.auditSystem.getExplanation(accountId, dimension, referenceTime ?? Date.now());
  }

  getDecisionHistory(
    accountId: string,
    options?: { limit?: number; offset?: number; action?: string; from?: number; to?: number },
  ): DecisionRecord[] {
    return this.storage.getDecisionHistory(accountId, options);
  }

  removeSignal(signalId: string): boolean {
    return this.signalEngine.remove(signalId);
  }

  updateSignal(signalId: string, updates: Partial<SubmitSignalData>): Signal {
    return this.signalEngine.update(signalId, updates);
  }

  addRule(rule: Rule): void {
    this.rulesEngine.add(rule);
  }

  removeRule(ruleId: string): boolean {
    return this.rulesEngine.remove(ruleId);
  }

  getRules(): Rule[] {
    return this.rulesEngine.getAll();
  }

  registerSignalType(def: SignalTypeDefinition): void {
    this.registry.register(def);
  }

  updateConfig(path: string, value: unknown): void {
    this.configManager.update(path, value);
  }
}
