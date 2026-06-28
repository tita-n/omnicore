import type { FaceDetection } from '../../interfaces/FaceDetector.js';

export interface FaceValidationError {
  code: string;
  message: string;
}

export interface FaceValidationResult {
  passed: boolean;
  errors: FaceValidationError[];
  validatedDetection: FaceDetection | null;
  timestamp: number;
}
