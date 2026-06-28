import type { AuditTrail, DimensionExplanation } from '../types/audit.types.js';

export interface IAuditSystem {
  getAuditTrail(accountId: string, referenceTime: number): AuditTrail;
  getExplanation(accountId: string, dimension: string, referenceTime: number): DimensionExplanation | undefined;
}
