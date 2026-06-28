import { useRef, useState, useCallback, useEffect } from 'react';
import type { FaceDetectionProvider, FaceDetectionResult } from '../../interfaces/FaceDetectionProvider.js';
import type { FaceDetection } from '../../interfaces/FaceDetector.js';
import type { FaceValidationResult } from '../../services/face-validation/FaceValidationResult.js';
import { validateFaces, createDefaultValidationConfig } from '../../services/face-validation/FaceValidator.js';
import type { FaceDetectionConfig, CameraConfig } from '../../config/VerificationConfig.js';

export interface UseFaceDetectionResult {
  detections: FaceDetection[];
  isDetecting: boolean;
  validationResult: FaceValidationResult | null;
  error: string | null;
  startDetection: () => void;
  stopDetection: () => void;
}

export function useFaceDetection(
  provider: FaceDetectionProvider,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  faceDetectionConfig: FaceDetectionConfig,
  cameraConfig: CameraConfig,
  enabled: boolean
): UseFaceDetectionResult {
  const [detections, setDetections] = useState<FaceDetection[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [validationResult, setValidationResult] = useState<FaceValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);

  const startDetection = useCallback(() => {
    if (!enabled || !videoRef.current) return;

    setIsDetecting(true);
    setError(null);

    const initAndLoop = async () => {
      try {
        if (!initializedRef.current) {
          await provider.initialize();
          initializedRef.current = true;
        }

        const validationConfig = createDefaultValidationConfig();
        validationConfig.minFaceSize = faceDetectionConfig.minFaceSize;
        validationConfig.maxFaces = faceDetectionConfig.maxFaces;

        loopRef.current = setInterval(async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;

          try {
            const result: FaceDetectionResult = await provider.detect(video);
            setDetections(result.detections);

            const validation = validateFaces(
              result.detections,
              result.inputWidth,
              result.inputHeight,
              validationConfig
            );
            setValidationResult(validation);
          } catch {
            // detection frame skipped
          }
        }, cameraConfig.detectionIntervalMs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Detection initialization failed');
        setIsDetecting(false);
      }
    };

    initAndLoop();
  }, [provider, videoRef, faceDetectionConfig, cameraConfig, enabled]);

  const stopDetection = useCallback(() => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    setIsDetecting(false);
    setDetections([]);
  }, []);

  useEffect(() => {
    return () => {
      stopDetection();
      if (initializedRef.current) {
        provider.dispose().catch(() => {});
        initializedRef.current = false;
      }
    };
  }, [provider, stopDetection]);

  return { detections, isDetecting, validationResult, error, startDetection, stopDetection };
}
