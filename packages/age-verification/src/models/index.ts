export {
  AgeBand,
  ageBandFromNumber,
  ageBandToRange,
  isAgeBand,
} from './AgeBand.js';

export {
  VerificationStatus,
  isVerificationStatus,
  isTerminalStatus,
  canTransition,
} from './VerificationStatus.js';

export { createVerificationSession, updateSessionStatus } from './VerificationSession.js';
export type { VerificationSession, VerificationMetadata } from './VerificationSession.js';

export { createEmptyResult, isResultValid } from './VerificationResult.js';
export type { VerificationResult, VerificationEvidence } from './VerificationResult.js';