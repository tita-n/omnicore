export const SIGNAL_TYPES = {
  AGE_VERIFICATION: 'AGE_VERIFICATION',
  PHONE_VERIFICATION: 'PHONE_VERIFICATION',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  DEVICE_TRUST: 'DEVICE_TRUST',
  LIVENESS: 'LIVENESS',
  BEHAVIOR: 'BEHAVIOR',
  COMMUNITY_REPORT: 'COMMUNITY_REPORT',
  SPAM_DETECTION: 'SPAM_DETECTION',
  PHOTO_VERIFICATION: 'PHOTO_VERIFICATION',
} as const;

export type SignalCategory = 'identity' | 'behavior' | 'community' | 'device' | 'account';

export interface SignalTypeDefinition {
  type: string;
  source: string;
  category: SignalCategory;
  description: string;
  defaultWeight: number;
  defaultTtlMs: number | null;
}
