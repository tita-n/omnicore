import { useRef, useState, useCallback, useEffect } from 'react';
import { CameraManager } from '../../services/camera/CameraManager.js';
import type { EventEmitter } from '../../events/EventEmitter.js';
import type { CameraConfig } from '../../config/VerificationConfig.js';

export interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  switchCamera: () => Promise<void>;
}

export function useCamera(
  config: CameraConfig,
  events: EventEmitter,
  sessionId: string
): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const managerRef = useRef<CameraManager | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const manager = new CameraManager(config, events, sessionId);
      managerRef.current = manager;
      await manager.startCamera();

      if (videoRef.current) {
        const stream = (manager as any).provider?.stream as MediaStream | undefined;
        if (stream) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      }

      setIsActive(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera failed to start';
      setError(message);
    }
  }, [config, events, sessionId]);

  const stop = useCallback(() => {
    managerRef.current?.stopCamera().catch(() => {});
    managerRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const switchCamera = useCallback(async () => {
    try {
      await managerRef.current?.switchCamera();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch camera');
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      video.play().catch(() => {});
    };
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      stop();
    };
  }, [stop]);

  return { videoRef, isActive, error, start, stop, switchCamera };
}
