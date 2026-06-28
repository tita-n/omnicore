export interface LivenessResult {
  isLive: boolean;
  confidence: number;
  challengePassed: boolean;
  challengeType: 'passive' | 'active' | 'hybrid';
  details: Record<string, unknown>;
}

export interface LivenessEngine {
  verify(frames: AsyncIterable<import('./CameraProvider.js').CaptureFrame>, faceDetections: import('./FaceDetector.js').FaceDetection[]): Promise<LivenessResult>;
  calculateConfidence(livenessResult: LivenessResult, qualityScore: number): number;
  getSupportedChallenges(): string[];
}