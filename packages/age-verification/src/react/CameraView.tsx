import React, { useRef, useEffect } from 'react';
import type { FaceDetection } from '../interfaces/FaceDetector.js';
import type { FaceValidationResult } from '../services/face-validation/index.js';

export interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  detections: FaceDetection[];
  validationResult: FaceValidationResult | null;
  isActive: boolean;
  showOverlay?: boolean;
  className?: string;
  width?: number;
  height?: number;
  onVideoReady?: () => void;
}

export function CameraView({
  videoRef,
  detections,
  validationResult,
  isActive,
  showOverlay = true,
  className,
  width = 640,
  height = 480,
  onVideoReady,
}: CameraViewProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!showOverlay || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const detection of detections) {
      const bbox = detection.boundingBox;
      ctx.strokeStyle = validationResult?.passed ? '#00ff00' : '#ff0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

      if (detection.landmarks) {
        ctx.fillStyle = '#00ff00';
        for (const landmark of detection.landmarks) {
          ctx.beginPath();
          ctx.arc(landmark.x, landmark.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = validationResult?.passed ? '#00ff00' : '#ff0000';
      ctx.font = '14px monospace';
      ctx.fillText(
        `conf: ${(detection.confidence * 100).toFixed(0)}%`,
        bbox.x,
        bbox.y - 8
      );
    }

    if (validationResult && !validationResult.passed) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0000';
      ctx.font = '16px monospace';
      ctx.fillText(
        validationResult.errors.map(e => e.message).join(', '),
        16,
        32
      );
    }
  }, [detections, validationResult, showOverlay]);

  return (
    <div className={className} style={{ position: 'relative', width, height }}>
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        autoPlay
        playsInline
        muted
        width={width}
        height={height}
        onLoadedData={onVideoReady}
        style={{ display: isActive ? 'block' : 'none' }}
      />
      {showOverlay && (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      {!isActive && (
        <div
          style={{
            width,
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1a1a1a',
            color: '#666',
            fontFamily: 'monospace',
          }}
        >
          Camera off
        </div>
      )}
    </div>
  );
}
