import { useState, useEffect, useCallback, useRef } from 'react';
import type { GifFrame, UseAnimatedFaviconOptions, UseAnimatedFaviconResult, ParseResult } from '../types';
import { parseGifFrames } from '../lib/parser';
import { createFaviconController, type FaviconController } from '../lib/favicon';
import { createScheduler, type Scheduler } from '../lib/scheduler';
import { isFirefox, isUnsupportedBrowser, isSafari, supportsWorker } from '../lib/detect';

function loadWithWorker(
  url: string,
  options: { maxFrames: number; maxFileSize: number; onWarning?: (msg: string) => void }
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../lib/worker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = ({ data }) => {
      if (data.type === 'frames') {
        worker.terminate();
        resolve({ frames: data.frames, width: data.width, height: data.height });
      } else if (data.type === 'warning') {
        options.onWarning?.(data.message);
      } else if (data.type === 'error') {
        worker.terminate();
        reject(new Error(data.message));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(new Error(err.message));
    };

    worker.postMessage({ url, maxFrames: options.maxFrames, maxFileSize: options.maxFileSize });
  });
}

export function useAnimatedFavicon(
  url: string,
  options: UseAnimatedFaviconOptions = {}
): UseAnimatedFaviconResult {
  const {
    autoPlay = true,
    fps,
    maxFps = 15,
    maxFrames = 60,
    maxFileSize = 5242880,
    fallbackUrl,
    pauseOnHidden = true,
    restoreOnUnmount = true,
    useWorker = false,
  } = options;

  const [frames, setFrames] = useState<GifFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const schedulerRef = useRef<Scheduler | null>(null);
  const faviconRef = useRef<FaviconController | null>(null);
  const framesRef = useRef<GifFrame[]>([]);
  const mountedRef = useRef(true);

  // Keep callbacks in refs to avoid re-running the main effect
  const onLoadRef = useRef(options.onLoad);
  const onErrorRef = useRef(options.onError);
  const onWarningRef = useRef(options.onWarning);
  const onFrameChangeRef = useRef(options.onFrameChange);
  onLoadRef.current = options.onLoad;
  onErrorRef.current = options.onError;
  onWarningRef.current = options.onWarning;
  onFrameChangeRef.current = options.onFrameChange;

  const cleanupScheduler = useCallback(() => {
    schedulerRef.current?.destroy();
    schedulerRef.current = null;
  }, []);

  const cleanupFavicon = useCallback((restore: boolean) => {
    if (faviconRef.current) {
      if (restore) faviconRef.current.restore();
      faviconRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (!schedulerRef.current || framesRef.current.length === 0) return;
    schedulerRef.current.resume();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    schedulerRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    if (!schedulerRef.current) return;
    schedulerRef.current.stop();
    setIsPlaying(false);
    setCurrentFrame(0);
    if (framesRef.current[0] && faviconRef.current) {
      faviconRef.current.renderFrame(framesRef.current[0]);
    }
  }, []);

  const goToFrame = useCallback((index: number) => {
    const frame = framesRef.current[index];
    if (!frame) return;
    schedulerRef.current?.goToFrame(index);
    setCurrentFrame(index);
    faviconRef.current?.renderFrame(frame);
  }, []);

  const destroy = useCallback(() => {
    cleanupScheduler();
    cleanupFavicon(true);
    framesRef.current = [];
    setFrames([]);
    setCurrentFrame(0);
    setIsPlaying(false);
  }, [cleanupScheduler, cleanupFavicon]);

  useEffect(() => {
    if (typeof window === 'undefined' || !url) return;

    mountedRef.current = true;
    const abortController = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);
      setFrames([]);
      setCurrentFrame(0);
      setIsPlaying(false);

      cleanupScheduler();
      cleanupFavicon(restoreOnUnmount);

      if (isUnsupportedBrowser()) {
        onWarningRef.current?.('Browser does not support animated favicons');
        if (fallbackUrl) {
          const ctrl = createFaviconController(32, 32);
          faviconRef.current = ctrl;
          ctrl.setFallback(fallbackUrl);
        }
        if (mountedRef.current) setIsLoading(false);
        return;
      }

      if (isSafari()) {
        onWarningRef.current?.('Safari may not reliably display animated favicons');
      }

      try {
        if (isFirefox()) {
          // Firefox supports animated GIF favicons natively.
          const ctrl = createFaviconController(32, 32);
          faviconRef.current = ctrl;
          ctrl.setFallback(url);
          onLoadRef.current?.([]);
          if (mountedRef.current) {
            setFrames([]);
            setCurrentFrame(0);
            setIsPlaying(false);
          }
          return;
        }

        let result: ParseResult;

        if (useWorker && supportsWorker()) {
          result = await loadWithWorker(url, {
            maxFrames,
            maxFileSize,
            onWarning: onWarningRef.current,
          });
        } else {
          if (useWorker) {
            onWarningRef.current?.('Web Worker unavailable, falling back to main thread');
          }
          result = await parseGifFrames(url, {
            maxFrames,
            maxFileSize,
            onWarning: onWarningRef.current,
            signal: abortController.signal,
          });
        }

        if (!mountedRef.current) return;

        framesRef.current = result.frames;
        setFrames(result.frames);
        onLoadRef.current?.(result.frames);

        const favicon = createFaviconController(result.width, result.height);
        faviconRef.current = favicon;

        const scheduler = createScheduler({
          frames: result.frames,
          fps,
          maxFps,
          pauseOnHidden,
          onTick: (frameIndex) => {
            if (!mountedRef.current) return;
            const frame = framesRef.current[frameIndex];
            if (frame) favicon.renderFrame(frame);
            setCurrentFrame(frameIndex);
            onFrameChangeRef.current?.(frameIndex);
          },
        });
        schedulerRef.current = scheduler;

        if (autoPlay) {
          scheduler.start();
          setIsPlaying(true);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        if ((err as Error).name === 'AbortError') return;

        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        onErrorRef.current?.(e);

        if (fallbackUrl) {
          const ctrl = createFaviconController(32, 32);
          faviconRef.current = ctrl;
          ctrl.setFallback(fallbackUrl);
        }
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    }

    load();

    return () => {
      mountedRef.current = false;
      abortController.abort();
      cleanupScheduler();
      cleanupFavicon(restoreOnUnmount);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, autoPlay, fps, maxFps, maxFrames, maxFileSize, fallbackUrl, pauseOnHidden, restoreOnUnmount, useWorker]);

  return {
    frames,
    currentFrame,
    frameCount: frames.length,
    isPlaying,
    isLoading,
    error,
    play,
    pause,
    stop,
    goToFrame,
    destroy,
  };
}
