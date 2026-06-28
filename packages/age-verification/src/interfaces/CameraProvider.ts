export interface CameraCapabilities {
  maxResolution: { width: number; height: number };
  supportedFormats: string[];
  facingMode: 'user' | 'environment' | 'both';
  hasFlash: boolean;
}

export interface CaptureFrame {
  data: Uint8Array | string;
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'raw';
  timestamp: number;
}

export interface MediaStreamConstraints {
  video?: boolean | { width?: number; height?: number; facingMode?: 'user' | 'environment' };
  audio?: boolean;
}

export interface CameraProvider {
  initialize(constraints?: MediaStreamConstraints): Promise<void>;
  startCapture(): Promise<void>;
  stopCapture(): Promise<void>;
  captureFrames(): AsyncIterable<CaptureFrame>;
  getCapabilities(): CameraCapabilities;
  isActive(): boolean;
}