import type { CameraConfig } from '../../config/VerificationConfig.js';
import type { CameraProvider, CameraCapabilities } from '../../interfaces/CameraProvider.js';
import type { EventEmitter } from '../../events/EventEmitter.js';
import { BrowserCameraProvider } from './BrowserCameraProvider.js';
import { UnsupportedBrowserError } from '../../errors/UnsupportedBrowserError.js';
import { CameraError } from '../../errors/CameraError.js';

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  facing: 'user' | 'environment' | 'unknown';
}

export class CameraManager {
  private provider: CameraProvider | null = null;
  private config: CameraConfig;
  private events: EventEmitter;
  private sessionId: string;
  private _isActive: boolean = false;

  constructor(config: CameraConfig, events: EventEmitter, sessionId: string) {
    this.config = config;
    this.events = events;
    this.sessionId = sessionId;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  async requestPermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const err = new UnsupportedBrowserError('Camera access not supported in this browser');
      this.events.emit('permission_denied', {
        sessionId: this.sessionId,
        error: err.message,
        timestamp: Date.now(),
      });
      throw err;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      this.events.emit('permission_granted', {
        sessionId: this.sessionId,
        timestamp: Date.now(),
      });
      return true;
    } catch (err) {
      const message = err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Camera permission denied by user'
        : 'Camera access denied';
      this.events.emit('permission_denied', {
        sessionId: this.sessionId,
        error: message,
        timestamp: Date.now(),
      });
      throw new CameraError(message, { originalError: err });
    }
  }

  async enumerateDevices(): Promise<CameraDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');

    return videoDevices.map(d => {
      const label = d.label.toLowerCase();
      const facing: 'user' | 'environment' | 'unknown' =
        label.includes('front') || label.includes('user') ? 'user'
        : label.includes('back') || label.includes('environment') ? 'environment'
        : 'unknown';
      return { deviceId: d.deviceId, label: d.label, facing };
    });
  }

  private getPreferredDevice(devices: CameraDeviceInfo[]): string | undefined {
    const front = devices.find(d => d.facing === 'user');
    return front?.deviceId ?? devices[0]?.deviceId;
  }

  async startCamera(): Promise<void> {
    await this.requestPermission();

    const devices = await this.enumerateDevices();
    const deviceId = this.getPreferredDevice(devices);

    const videoConstraint: MediaTrackConstraints = {
      width: { ideal: this.config.maxWidth },
      height: { ideal: this.config.maxHeight },
      facingMode: this.config.preferredFacingMode,
      ...(deviceId ? { deviceId: { exact: deviceId } as ConstrainDOMString } : {}),
    };

    const constraints: MediaStreamConstraints = {
      video: videoConstraint,
    };

    this.provider = new BrowserCameraProvider();
    await this.provider.initialize(constraints);
    await this.provider.startCapture();
    this._isActive = true;

    this.events.emit('camera_initialized', {
      sessionId: this.sessionId,
      deviceLabel: devices.find(d => d.deviceId === deviceId)?.label ?? 'unknown',
      timestamp: Date.now(),
    });

    this.events.emit('camera_started', {
      sessionId: this.sessionId,
      resolution: { width: this.config.maxWidth, height: this.config.maxHeight },
      timestamp: Date.now(),
    });
  }

  async stopCamera(): Promise<void> {
    if (this.provider) {
      await this.provider.stopCapture();
      this.provider = null;
    }
    this._isActive = false;

    this.events.emit('camera_stopped', {
      sessionId: this.sessionId,
      timestamp: Date.now(),
    });
  }

  async switchCamera(): Promise<void> {
    if (!this.provider) return;

    await this.provider.stopCapture();
    this._isActive = false;

    this.config.preferredFacingMode =
      this.config.preferredFacingMode === 'user' ? 'environment' : 'user';

    await this.startCamera();
  }

  getProvider(): CameraProvider | null {
    return this.provider;
  }

  getCapabilities(): CameraCapabilities {
    return this.provider?.getCapabilities() ?? {
      maxResolution: { width: 0, height: 0 },
      supportedFormats: [],
      facingMode: 'user',
      hasFlash: false,
    };
  }
}
