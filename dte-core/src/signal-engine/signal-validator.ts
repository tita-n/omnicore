import type { SubmitSignalData } from '../types/signal.types.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSignalData(data: SubmitSignalData): ValidationResult {
  const errors: string[] = [];

  if (!data.accountId) {
    errors.push('accountId is required');
  }

  if (!data.signalType) {
    errors.push('signalType is required');
  }

  if (typeof data.value !== 'number' || !Number.isFinite(data.value)) {
    errors.push('value must be a finite number');
  } else if (data.value < -100 || data.value > 100) {
    errors.push('value must be between -100 and 100');
  }

  if (typeof data.confidence !== 'number' || !Number.isFinite(data.confidence)) {
    errors.push('confidence must be a finite number');
  } else if (data.confidence < 0 || data.confidence > 100) {
    errors.push('confidence must be between 0 and 100');
  }

  if (!data.explanation) {
    errors.push('explanation is required');
  }

  if (
    data.expirationTime !== undefined &&
    data.expirationTime !== null &&
    (!Number.isFinite(data.expirationTime) || data.expirationTime <= 0)
  ) {
    errors.push('expirationTime must be a positive number or null');
  }

  return { valid: errors.length === 0, errors };
}
