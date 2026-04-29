import type { GifFrame } from '../types';

export interface SchedulerOptions {
  frames: GifFrame[];
  fps?: number;
  maxFps: number;
  pauseOnHidden: boolean;
  onTick: (frameIndex: number) => void;
}

export interface Scheduler {
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  goToFrame(index: number): void;
  destroy(): void;
  isRunning(): boolean;
}

export function createScheduler(options: SchedulerOptions): Scheduler {
  const { frames, fps, maxFps, pauseOnHidden, onTick } = options;

  let currentFrameIndex = 0;
  let running = false;
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let pausedByVisibility = false;

  const minDelay = 1000 / maxFps;

  function getDelay(): number {
    if (fps) return 1000 / fps;
    return Math.max(frames[currentFrameIndex]?.delay ?? 100, minDelay);
  }

  function clearTimer(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function tick(): void {
    if (!running) return;
    onTick(currentFrameIndex);
    const delay = getDelay();
    currentFrameIndex = (currentFrameIndex + 1) % frames.length;
    timerId = setTimeout(tick, delay);
  }

  function handleVisibilityChange(): void {
    if (document.hidden) {
      if (running) {
        pausedByVisibility = true;
        running = false;
        clearTimer();
      }
    } else {
      if (pausedByVisibility) {
        pausedByVisibility = false;
        running = true;
        tick();
      }
    }
  }

  function start(): void {
    if (running) return;
    running = true;
    if (pauseOnHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    tick();
  }

  function pause(): void {
    running = false;
    pausedByVisibility = false;
    clearTimer();
  }

  function resume(): void {
    if (running) return;
    running = true;
    tick();
  }

  function stop(): void {
    running = false;
    pausedByVisibility = false;
    clearTimer();
    currentFrameIndex = 0;
  }

  function goToFrame(index: number): void {
    currentFrameIndex = ((index % frames.length) + frames.length) % frames.length;
  }

  function destroy(): void {
    running = false;
    pausedByVisibility = false;
    clearTimer();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }

  return { start, pause, resume, stop, goToFrame, destroy, isRunning: () => running };
}
