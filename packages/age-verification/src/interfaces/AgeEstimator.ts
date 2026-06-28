import { AgeBand } from '../models/AgeBand.js';

export interface AgeEstimation {
  ageBand: AgeBand;
  estimatedAge: number;
  confidence: number;
  ageRange: { min: number; max: number };
}

export interface AgeEstimator {
  estimate(faceData: Uint8Array | string, landmarks: Array<{ x: number; y: number }>): Promise<AgeEstimation>;
  getModelInfo(): { name: string; version: string; supportedAgeBands: AgeBand[] };
}