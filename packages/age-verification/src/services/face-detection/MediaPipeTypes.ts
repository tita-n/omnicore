import type { FaceDetection } from '../../interfaces/FaceDetector.js';

interface MediaPipeBoundingBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

interface MediaPipeKeypoint {
  x: number;
  y: number;
  z?: number;
}

interface MediaPipeCategory {
  score: number;
  index?: number;
  categoryName?: string;
}

interface MediaPipeDetection {
  boundingBox?: MediaPipeBoundingBox;
  keypoints?: MediaPipeKeypoint[];
  categories?: MediaPipeCategory[];
}

const KEYPOINT_TYPES: string[] = [
  'left_eye', 'right_eye', 'nose_tip', 'mouth_center', 'left_ear', 'right_ear',
];

export function mpDetectionToFaceDetection(mpDetection: MediaPipeDetection, frameWidth: number, frameHeight: number): FaceDetection {
  const bbox = mpDetection.boundingBox;
  const width = bbox?.width ?? 0;
  const height = bbox?.height ?? 0;
  const confidence = mpDetection.categories?.[0]?.score ?? 0;

  const landmarks = (mpDetection.keypoints ?? []).map((kp, i) => ({
    x: kp.x,
    y: kp.y,
    type: KEYPOINT_TYPES[i] ?? `keypoint_${i}`,
  }));

  return {
    boundingBox: {
      x: bbox?.originX ?? 0,
      y: bbox?.originY ?? 0,
      width,
      height,
    },
    landmarks,
    confidence,
    pose: undefined,
  };
}

export function boundingBoxToImageCoords(bbox: { x: number; y: number; width: number; height: number }, frameWidth: number, frameHeight: number): { x: number; y: number; width: number; height: number } {
  return {
    x: (bbox.x / frameWidth),
    y: (bbox.y / frameHeight),
    width: (bbox.width / frameWidth),
    height: (bbox.height / frameHeight),
  };
}
