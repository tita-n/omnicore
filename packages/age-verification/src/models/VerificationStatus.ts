export enum VerificationStatus {
  CREATED = 'CREATED',
  CAPTURING = 'CAPTURING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export function isVerificationStatus(value: unknown): value is VerificationStatus {
  return typeof value === 'string' && Object.values(VerificationStatus).includes(value as VerificationStatus);
}

export function isTerminalStatus(status: VerificationStatus): boolean {
  return [VerificationStatus.COMPLETED, VerificationStatus.FAILED, VerificationStatus.CANCELLED].includes(status);
}

export function canTransition(from: VerificationStatus, to: VerificationStatus): boolean {
  const validTransitions: Record<VerificationStatus, VerificationStatus[]> = {
    [VerificationStatus.CREATED]: [VerificationStatus.CAPTURING, VerificationStatus.CANCELLED],
    [VerificationStatus.CAPTURING]: [VerificationStatus.PROCESSING, VerificationStatus.CANCELLED],
    [VerificationStatus.PROCESSING]: [VerificationStatus.COMPLETED, VerificationStatus.FAILED, VerificationStatus.CANCELLED],
    [VerificationStatus.COMPLETED]: [],
    [VerificationStatus.FAILED]: [],
    [VerificationStatus.CANCELLED]: [],
  };
  return validTransitions[from]?.includes(to) ?? false;
}