import type { FaceDetection } from '../interfaces/FaceDetector.js';
import type { VerificationSession } from '../models/VerificationSession.js';
import type { VerificationResult } from '../models/VerificationResult.js';
import type { VerificationError } from '../errors/VerificationError.js';

export interface SessionCreated {
  session: VerificationSession;
}

export interface CaptureStarted {
  sessionId: string;
  timestamp: number;
}

export interface CaptureFinished {
  sessionId: string;
  frameCount: number;
  durationMs: number;
}

export interface VerificationStarted {
  sessionId: string;
  timestamp: number;
}

export interface VerificationCompleted {
  sessionId: string;
  result: VerificationResult;
  timestamp: number;
}

export interface VerificationFailed {
  sessionId: string;
  error: VerificationError;
  timestamp: number;
}

export interface SignalEmitted {
  sessionId: string;
  signalType: string;
  success: boolean;
  timestamp: number;
}

export interface CameraInitialized {
  sessionId: string;
  deviceLabel: string;
  timestamp: number;
}

export interface PermissionGranted {
  sessionId: string;
  timestamp: number;
}

export interface PermissionDenied {
  sessionId: string;
  error: string;
  timestamp: number;
}

export interface CameraStarted {
  sessionId: string;
  resolution: { width: number; height: number };
  timestamp: number;
}

export interface CameraStopped {
  sessionId: string;
  timestamp: number;
}

export interface FaceDetected {
  sessionId: string;
  faceCount: number;
  detections: FaceDetection[];
  timestamp: number;
}

export interface FaceLost {
  sessionId: string;
  timestamp: number;
}

export interface MultipleFacesDetected {
  sessionId: string;
  faceCount: number;
  timestamp: number;
}

export interface FaceValidated {
  sessionId: string;
  passed: boolean;
  errors: string[];
  timestamp: number;
}

export type VerificationEventPayloads = {
  session_created: SessionCreated;
  capture_started: CaptureStarted;
  capture_finished: CaptureFinished;
  verification_started: VerificationStarted;
  verification_completed: VerificationCompleted;
  verification_failed: VerificationFailed;
  signal_emitted: SignalEmitted;
  camera_initialized: CameraInitialized;
  permission_granted: PermissionGranted;
  permission_denied: PermissionDenied;
  camera_started: CameraStarted;
  camera_stopped: CameraStopped;
  face_detected: FaceDetected;
  face_lost: FaceLost;
  multiple_faces_detected: MultipleFacesDetected;
  face_validated: FaceValidated;
};

export type VerificationEventType = keyof VerificationEventPayloads;
