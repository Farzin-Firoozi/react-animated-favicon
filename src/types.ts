export interface GifFrame {
  index: number;
  patch: Uint8ClampedArray;
  dims: { width: number; height: number; top: number; left: number };
  delay: number; // milliseconds
}

export interface ParseResult {
  frames: GifFrame[];
  width: number;
  height: number;
}

export interface UseAnimatedFaviconOptions {
  autoPlay?: boolean;
  fps?: number;
  maxFps?: number;
  maxFrames?: number;
  maxFileSize?: number;
  fallbackUrl?: string;
  pauseOnHidden?: boolean;
  restoreOnUnmount?: boolean;
  useWorker?: boolean;
  onLoad?: (frames: GifFrame[]) => void;
  onError?: (err: Error) => void;
  onWarning?: (msg: string) => void;
  onFrameChange?: (index: number) => void;
}

export interface UseAnimatedFaviconResult {
  frames: GifFrame[];
  currentFrame: number;
  frameCount: number;
  isPlaying: boolean;
  isLoading: boolean;
  error: Error | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  goToFrame: (index: number) => void;
  destroy: () => void;
}
