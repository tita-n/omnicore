export interface ConfidenceFactors {
  qualityScore: number;
  livenessScore: number;
  faceDetectionConfidence: number;
  ageEstimationConfidence: number;
  frameConsistency: number;
  temporalStability: number;
}

export interface ConfidenceCalculator {
  calculate(factors: ConfidenceFactors): number;
  getWeights(): Record<string, number>;
  setWeights(weights: Record<string, number>): void;
}