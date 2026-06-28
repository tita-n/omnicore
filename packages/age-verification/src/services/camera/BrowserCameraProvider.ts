import type { CameraProvider, CameraCapabilities, CaptureFrame } from '../../interfaces/CameraProvider.js';

export class BrowserCameraProvider implements CameraProvider {
  private stream: MediaStream | null = null;
  private active: boolean = false;
  private captureInterval: ReturnType<typeof setInterval> | null = null;
  private frameQueue: CaptureFrame[] = [];
  private resolveFrame: ((frame: CaptureFrame) => void) | null = null;

  async initialize(constraints?: MediaStreamConstraints): Promise<void> {
    const videoConstraints: MediaTrackConstraints = {
      facingMode: constraints?.video && typeof constraints.video === 'object'
        ? constraints.video.facingMode ?? 'user'
        : 'user',
      width: constraints?.video && typeof constraints.video === 'object'
        ? constraints.video.width
        : { ideal: 1280 },
      height: constraints?.video && typeof constraints.video === 'object'
        ? constraints.video.height
        : { ideal: 720 },
    };

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    });

    this.active = true;
  }

  startCapture(): Promise<void> {
    return new Promise((resolve) => {
      this.captureInterval = setInterval(() => {
        if (!this.stream) return;
        const track = this.stream.getVideoTracks()[0];
        if (!track) return;

        const settings = track.getSettings();
        const canvas = document.createElement('canvas');
        canvas.width = settings.width ?? 640;
        canvas.height = settings.height ?? 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const video = document.createElement('video');
        video.srcObject = this.stream;
        video.play();
        ctx.drawImage(video, 0, 0);
        video.pause();
        video.srcObject = null;

        canvas.toBlob((blob) => {
          if (!blob) return;
          const reader = new FileReader();
          reader.onloadend = () => {
            const frame: CaptureFrame = {
              data: reader.result as string,
              width: canvas.width,
              height: canvas.height,
              format: 'jpeg',
              timestamp: Date.now(),
            };
            this.frameQueue.push(frame);
            if (this.resolveFrame) {
              this.resolveFrame(frame);
              this.resolveFrame = null;
            }
          };
          reader.readAsDataURL(blob);
        }, 'image/jpeg');
      }, 200);

      resolve();
    });
  }

  stopCapture(): Promise<void> {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.active = false;
    this.frameQueue = [];
    return Promise.resolve();
  }

  async *captureFrames(): AsyncIterable<CaptureFrame> {
    while (this.active) {
      if (this.frameQueue.length > 0) {
        yield this.frameQueue.shift()!;
      } else {
        yield await new Promise<CaptureFrame>((resolve) => {
          this.resolveFrame = resolve;
        });
      }
    }
  }

  getCapabilities(): CameraCapabilities {
    if (!this.stream) {
      return {
        maxResolution: { width: 0, height: 0 },
        supportedFormats: [],
        facingMode: 'user',
        hasFlash: false,
      };
    }

    const track = this.stream.getVideoTracks()[0];
    const caps = track?.getCapabilities?.() ?? {};

    return {
      maxResolution: {
        width: caps.width?.max ?? 0,
        height: caps.height?.max ?? 0,
      },
      supportedFormats: ['jpeg'],
      facingMode: (caps.facingMode as unknown as ('user' | 'environment' | 'both')) ?? 'user',
      hasFlash: false,
    };
  }

  isActive(): boolean {
    return this.active;
  }
}
