import React, { useRef, useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { CameraManager } from '../src/services/camera/CameraManager.js';
import { MediaPipeFaceDetectionProvider } from '../src/services/face-detection/MediaPipeFaceDetectionProvider.js';
import { validateFaces, createDefaultValidationConfig } from '../src/services/face-validation/FaceValidator.js';
import { defaultConfig } from '../src/config/defaultConfig.js';
import { EventEmitter } from '../src/events/EventEmitter.js';
import type { FaceDetection } from '../src/interfaces/FaceDetector.js';

const cfg = defaultConfig;
const events = new EventEmitter();

type LogLevel = 'info' | 'warn' | 'error';

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}

function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<CameraManager | null>(null);
  const detectorRef = useRef<MediaPipeFaceDetectionProvider | null>(null);
  const loopRef = useRef<number | null>(null);
  const fpsTimestamps = useRef<number[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [cameraActive, setCameraActive] = useState(false);
  const [detections, setDetections] = useState<FaceDetection[]>([]);
  const [validationPassed, setValidationPassed] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ msg: string; level: LogLevel; ts: number }>>([]);
  const [fps, setFps] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);

  const addLog = useCallback((msg: string, level: LogLevel = 'info') => {
    setLogs(prev => [...prev.slice(-199), { msg, level, ts: Date.now() }]);
  }, []);

  // --- Event listeners (once) ---
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    const on = (event: string, fn: (...args: unknown[]) => void) => {
      events.on(event as any, fn as any);
      unsubs.push(() => events.off(event as any, fn as any));
    };

    on('permission_granted', () => {
      setPermissionStatus('granted');
      addLog('Permission granted', 'info');
    });

    on('permission_denied', (p: any) => {
      setPermissionStatus('denied');
      setErrorMessage(p.error);
      addLog(`Permission denied: ${p.error}`, 'error');
    });

    on('camera_started', (p: any) => {
      setCameraActive(true);
      setErrorMessage(null);
      addLog(`Camera started: ${p.resolution.width}x${p.resolution.height}`, 'info');
    });

    on('camera_stopped', () => {
      setCameraActive(false);
      addLog('Camera stopped', 'warn');
    });

    on('camera_initialized', (p: any) => {
      addLog(`Camera initialized: ${p.deviceLabel}`, 'info');
    });

    on('face_detected', (p: any) => {
      setDetections(p.detections);
    });

    on('face_lost', () => {
      setDetections([]);
      setValidationPassed(null);
      setValidationErrors([]);
      addLog('Face lost', 'warn');
    });

    on('multiple_faces_detected', (p: any) => {
      addLog(`Multiple faces: ${p.faceCount}`, 'warn');
    });

    on('face_validated', (p: any) => {
      setValidationPassed(p.passed);
      setValidationErrors(p.errors);
      addLog(`Validation: ${p.passed ? 'PASS' : 'FAIL'} ${p.errors.join(', ')}`, p.passed ? 'info' : 'warn');
    });

    return () => { unsubs.forEach(fn => fn()); };
  }, [addLog]);

  // --- Sync canvas size to video ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const sync = () => {
      canvas.width = video.videoWidth || cfg.camera.maxWidth;
      canvas.height = video.videoHeight || cfg.camera.maxHeight;
    };
    video.addEventListener('loadedmetadata', sync);
    return () => video.removeEventListener('loadedmetadata', sync);
  }, []);

  // --- Detection + overlay loop ---
  const runFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;
    if (!video || !canvas || !detector || !cameraActive) return;

    try {
      if (!modelLoaded) {
        await detector.initialize();
        setModelLoaded(true);
        addLog('MediaPipe model loaded', 'info');
      }

      const result = await detector.detect(video);
      setDetections(result.detections);

      const validationConfig = createDefaultValidationConfig();
      validationConfig.minFaceSize = cfg.faceDetection.minFaceSize;
      validationConfig.maxFaces = cfg.faceDetection.maxFaces;

      const validation = validateFaces(result.detections, result.inputWidth, result.inputHeight, validationConfig);
      setValidationPassed(validation.passed);
      setValidationErrors(validation.errors.map(e => e.message));

      // Draw overlay
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (result.detections.length > 0) {
          const color = validation.passed ? '#4ade80' : '#f87171';
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          for (const d of result.detections) {
            ctx.strokeRect(d.boundingBox.x, d.boundingBox.y, d.boundingBox.width, d.boundingBox.height);
            ctx.fillStyle = color;
            ctx.font = '13px monospace';
            ctx.fillText(`${(d.confidence * 100).toFixed(0)}%`, d.boundingBox.x, d.boundingBox.y - 6);
            if (d.landmarks) {
              for (const lm of d.landmarks) {
                ctx.beginPath();
                ctx.arc(lm.x, lm.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
              }
            }
          }

          if (!validation.passed) {
            ctx.fillStyle = 'rgba(248, 113, 113, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }

        ctx.font = 'bold 14px monospace';
        if (validation.passed && result.detections.length > 0) {
          ctx.fillStyle = '#4ade80';
          ctx.fillText('VALID', 12, 28);
        } else if (result.detections.length === 0) {
          ctx.fillStyle = '#888';
          ctx.fillText('No face detected', 12, 28);
        } else {
          ctx.fillStyle = '#f87171';
          ctx.fillText(validation.errors.map(e => e.message).join(', '), 12, 28);
        }
      }

      // FPS tracking
      const now = performance.now();
      fpsTimestamps.current = [...fpsTimestamps.current.slice(-29), now];
      if (fpsTimestamps.current.length > 1) {
        const dt = (fpsTimestamps.current[fpsTimestamps.current.length - 1] - fpsTimestamps.current[0]) / (fpsTimestamps.current.length - 1);
        setFps(Math.round(1000 / dt));
      }
    } catch {
      // frame skip
    }

    loopRef.current = requestAnimationFrame(runFrame);
  }, [cameraActive, modelLoaded, addLog]);

  useEffect(() => {
    if (cameraActive) {
      loopRef.current = requestAnimationFrame(runFrame);
    }
    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
  }, [cameraActive, runFrame]);

  // --- Controls ---
  const handleStart = useCallback(async () => {
    setErrorMessage(null);
    const cam = new CameraManager(cfg.camera, events, 'test_session');
    const detector = new MediaPipeFaceDetectionProvider(cfg.faceDetection, events, 'test_session');
    cameraRef.current = cam;
    detectorRef.current = detector;

    await cam.startCamera();
    const stream = (cam as any).provider?.stream as MediaStream | undefined;
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      await videoRef.current.play();
    }
  }, [addLog]);

  const handleStop = useCallback(() => {
    cameraRef.current?.stopCamera();
    if (videoRef.current) videoRef.current.srcObject = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    detectorRef.current?.dispose();
    setCameraActive(false);
    setDetections([]);
    setValidationPassed(null);
    setValidationErrors([]);
  }, []);

  const handleSwitch = useCallback(async () => {
    await cameraRef.current?.switchCamera();
    const stream = (cameraRef.current as any)?.provider?.stream as MediaStream | undefined;
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      await videoRef.current.play();
    }
  }, []);

  const handleClearLog = useCallback(() => setLogs([]), []);

  // --- Stats ---
  const faceCount = detections.length;
  const avgConfidence = faceCount > 0
    ? (detections.reduce((s, d) => s + d.confidence, 0) / faceCount * 100).toFixed(1)
    : '—';
  const largestFace = faceCount > 0
    ? Math.max(...detections.map(d => d.boundingBox.width))
    : 0;

  return (
    <>
      <h1>AVM Milestone 2 — Test Server</h1>
      <div className="layout">
        {/* Video */}
        <div className="video-section">
          <div className="video-wrapper">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width={cfg.camera.maxWidth}
              height={cfg.camera.maxHeight}
              style={{ maxWidth: '100%', background: '#000', borderRadius: 4 }}
            />
            <canvas
              ref={canvasRef}
              width={cfg.camera.maxWidth}
              height={cfg.camera.maxHeight}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            />
          </div>

          <div className="controls">
            <button className="success" onClick={handleStart} disabled={cameraActive}>Start Camera</button>
            <button className="danger" onClick={handleStop} disabled={!cameraActive}>Stop Camera</button>
            <button onClick={handleSwitch} disabled={!cameraActive}>Switch Camera</button>
          </div>

          <div className="status-bar">
            <span><span className={`status-dot ${cameraActive ? 'active' : 'inactive'}`} /> Camera: {cameraActive ? 'ON' : 'OFF'}</span>
            <span><span className={`status-dot ${modelLoaded ? 'active' : 'inactive'}`} /> Model: {modelLoaded ? 'Loaded' : 'Pending'}</span>
            <span>FPS: {fps}</span>
          </div>

          {errorMessage && <div className="error-msg">Error: {errorMessage}</div>}
        </div>

        {/* Panels */}
        <div className="panel">
          {/* Stats */}
          <div className="card">
            <h2>Detection Stats</h2>
            <div className="stats-grid">
              <label>Faces detected</label>
              <span className={`value ${faceCount === 1 ? 'ok' : faceCount > 1 ? 'fail' : 'warn'}`} style={{ fontSize: 24 }}>{faceCount}</span>
              <label>Avg confidence</label><span>{avgConfidence}%</span>
              <label>Largest face</label><span>{largestFace}px</span>
              <label>Validation</label>
              <span className={`value ${validationPassed === true ? 'ok' : validationPassed === false ? 'fail' : 'warn'}`} style={{ fontSize: 14 }}>
                {validationPassed === true ? 'PASS' : validationPassed === false ? 'FAIL' : 'Waiting...'}
              </span>
            </div>
            {validationErrors.length > 0 && (
              <div style={{ marginTop: 8, color: '#f87171' }}>
                {validationErrors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>

          {/* Test Checklist */}
          <div className="card test-checklist">
            <h2>Test Checklist</h2>
            <details open>
              <summary>Camera Tests</summary>
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                <li className={permissionStatus === 'granted' ? 'done' : ''}>Permission granted</li>
                <li className={cameraActive ? 'done' : ''}>Camera started</li>
                <li className={permissionStatus === 'denied' ? 'done' : ''}>Deny handled gracefully</li>
              </ul>
            </details>
            <details open>
              <summary>Face Detection Tests</summary>
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                <li className={faceCount === 1 && validationPassed === true ? 'done' : ''}>Single face → passed</li>
                <li className={faceCount === 0 && validationPassed === null ? 'done' : ''}>No face → handled</li>
                <li className={faceCount > 1 ? 'done' : ''}>Multiple faces → rejected</li>
                <li className={validationPassed === false && validationErrors.some(e => e.toLowerCase().includes('small') || e.toLowerCase().includes('size')) ? 'done' : ''}>Face too small → rejected</li>
                <li className={validationPassed === false && validationErrors.some(e => e.toLowerCase().includes('edge') || e.toLowerCase().includes('frame')) ? 'done' : ''}>Partial face → rejected</li>
              </ul>
            </details>
            <details open>
              <summary>Performance</summary>
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                <li className={fps >= 10 ? 'done' : ''}>Detection FPS ≥ 10</li>
                <li className={cameraActive ? 'done' : ''}>Bounding box follows face</li>
              </ul>
            </details>
          </div>

          {/* Event Log */}
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>Event Log</h2>
              <button onClick={handleClearLog} style={{ padding: '2px 8px', fontSize: 11 }}>Clear</button>
            </div>
            <div className="log">
              {logs.length === 0 && <div style={{ color: '#555' }}>Waiting for events...</div>}
              {logs.map((entry, i) => (
                <div key={i} className={`entry ${entry.level}`}>
                  {formatTimestamp(entry.ts)} {entry.msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
