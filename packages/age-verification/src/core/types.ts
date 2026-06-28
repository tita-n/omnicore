export interface DTEOptions {
  dteEndpoint?: string;
}

export interface AvmOptions extends DTEOptions {
  camera?: Partial<import('../config/VerificationConfig.js').CameraConfig>;
  faceDetection?: Partial<import('../config/VerificationConfig.js').FaceDetectionConfig>;
}
