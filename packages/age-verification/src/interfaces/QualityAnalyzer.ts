export interface QualityMetrics {
  brightness: number;
  contrast: number;
  sharpness: number;
  occlusion: number;
  glare: number;
  blur: number;
  overallScore: number;
}

export interface QualityAnalyzer {
  analyze(imageData: Uint8Array | string, faceDetection: import('./FaceDetector.js').FaceDetection): Promise<QualityMetrics>;
  score(metrics: QualityMetrics, weights?: Record<string, number>): number;
  getThresholds(): Record<string, number>;
}