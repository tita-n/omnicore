export { BrowserCameraProvider, CameraManager } from './camera/index.js';
export type { CameraDeviceInfo } from './camera/index.js';

export { MediaPipeFaceDetectionProvider, mpDetectionToFaceDetection, boundingBoxToImageCoords } from './face-detection/index.js';

export { validateFaces, createDefaultValidationConfig } from './face-validation/index.js';
export type { FaceValidationResult, FaceValidationError } from './face-validation/index.js';
export type { FaceValidationConfig } from './face-validation/index.js';

export { CameraCaptureStep, FaceDetectionStep } from './pipeline-steps/index.js';
