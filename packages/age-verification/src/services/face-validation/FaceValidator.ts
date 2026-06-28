import type { FaceDetection } from '../../interfaces/FaceDetector.js';
import type { FaceValidationResult, FaceValidationError } from './FaceValidationResult.js';

export interface FaceValidationConfig {
  minFaceSize: number;
  maxFaces: number;
  marginRatio: number;
}

export function validateFaces(
  detections: FaceDetection[],
  videoWidth: number,
  videoHeight: number,
  config: FaceValidationConfig
): FaceValidationResult {
  const errors: FaceValidationError[] = [];

  if (detections.length === 0) {
    errors.push({ code: 'NO_FACE', message: 'No face detected in frame' });
    return { passed: false, errors, validatedDetection: null, timestamp: Date.now() };
  }

  if (detections.length > config.maxFaces) {
    errors.push({
      code: 'MULTIPLE_FACES',
      message: `${detections.length} faces detected, maximum allowed is ${config.maxFaces}`,
    });
    return { passed: false, errors, validatedDetection: null, timestamp: Date.now() };
  }

  const detection = detections[0]!;

  const faceWidth = detection.boundingBox.width;
  const faceHeight = detection.boundingBox.height;

  if (faceWidth < config.minFaceSize || faceHeight < config.minFaceSize) {
    errors.push({
      code: 'FACE_TOO_SMALL',
      message: `Face size (${Math.round(faceWidth)}x${Math.round(faceHeight)}px) is below minimum (${config.minFaceSize}px)`,
    });
    return { passed: false, errors, validatedDetection: null, timestamp: Date.now() };
  }

  const marginX = videoWidth * config.marginRatio;
  const marginY = videoHeight * config.marginRatio;

  const bbox = detection.boundingBox;
  if (
    bbox.x < marginX ||
    bbox.y < marginY ||
    bbox.x + bbox.width > videoWidth - marginX ||
    bbox.y + bbox.height > videoHeight - marginY
  ) {
    errors.push({
      code: 'FACE_OUTSIDE_FRAME',
      message: 'Face is too close to the edge of the frame',
    });
    return { passed: false, errors, validatedDetection: null, timestamp: Date.now() };
  }

  return {
    passed: true,
    errors: [],
    validatedDetection: detection,
    timestamp: Date.now(),
  };
}

export function createDefaultValidationConfig(): FaceValidationConfig {
  return {
    minFaceSize: 100,
    maxFaces: 1,
    marginRatio: 0.05,
  };
}
