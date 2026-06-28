import type { FaceDetection } from './FaceDetector.js';

export interface FaceDetectionResult {
  detections: FaceDetection[];
  timestamp: number;
  inputWidth: number;
  inputHeight: number;
}

export interface FaceDetectionProvider {
  initialize(): Promise<void>;
  detect(video: HTMLVideoElement): Promise<FaceDetectionResult>;
  dispose(): Promise<void>;
}
