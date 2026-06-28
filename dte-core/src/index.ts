export { DTE } from './dte.js';

export { SIGNAL_TYPES } from './types/signal-type.types.js';
export type { SignalTypeDefinition, SignalCategory } from './types/signal-type.types.js';
export type { Signal, SubmitSignalData } from './types/signal.types.js';
export type { TrustProfile, DimensionScore, SignalContribution } from './types/trust.types.js';
export type { Decision, DecisionRecord, DecisionOutcome } from './types/decision.types.js';
export type { Rule, RuleCondition } from './types/rule.types.js';
export type { TrustEvent, EventType } from './types/event.types.js';
export type { AuditTrail, DimensionExplanation } from './types/audit.types.js';
export type { DTEConfig, DimensionConfig, DecayConfig } from './types/config.types.js';

export type { ITrustStorage } from './interfaces/ITrustStorage.js';
export type { ITrustCalculator, CalculateParams } from './interfaces/ITrustCalculator.js';
export type { IRulesEngine, RuleEvaluationResult } from './interfaces/IRulesEngine.js';
export type { IDecisionEngine, EvaluateParams } from './interfaces/IDecisionEngine.js';
export type { ISignalEngine } from './interfaces/ISignalEngine.js';
export type { ISignalRegistry } from './interfaces/ISignalRegistry.js';
export type { IEventLogger } from './interfaces/IEventLogger.js';
export type { IAuditSystem } from './interfaces/IAuditSystem.js';
export type { IConfigManager } from './interfaces/IConfigManager.js';
