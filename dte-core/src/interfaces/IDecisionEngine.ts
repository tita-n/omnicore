import type { Decision } from '../types/decision.types.js';

export interface EvaluateParams {
  accountId: string;
  action: string;
  referenceTime: number;
}

export interface IDecisionEngine {
  evaluate(params: EvaluateParams): Decision;
}
