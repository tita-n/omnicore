export interface FaceDetection {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks: Array<{
    x: number;
    y: number;
    type: string;
  }>;
  confidence: number;
  pose?: {
    pitch: number;
    yaw: number;
    roll: number;
  };
}

export interface FaceDetector {
  detect(imageData: Uint8Array | string, width: number, height: number): Promise<FaceDetection | null>;
  validate(detection: FaceDetection, minConfidence: number): boolean;
  getModelInfo(): { name: string; version: string; inputSize: { width: number; height: number } };
}