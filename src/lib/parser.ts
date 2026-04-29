import { parseGIF, decompressFrames } from 'gifuct-js';
import type { ParseResult } from '../types';

export async function parseGifFrames(
  url: string,
  options: {
    maxFrames?: number;
    maxFileSize?: number;
    onWarning?: (msg: string) => void;
    signal?: AbortSignal;
  } = {}
): Promise<ParseResult> {
  const { maxFrames = 60, maxFileSize = 5242880, onWarning, signal } = options;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch GIF: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();

  if (buffer.byteLength > maxFileSize) {
    onWarning?.(
      `GIF file size (${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB) exceeds maxFileSize limit`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gif = parseGIF(buffer) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawFrames = decompressFrames(gif, true) as any[];

  if (!rawFrames || rawFrames.length === 0) {
    throw new Error('GIF contains no decodable frames');
  }

  const width: number = gif.lsd?.width ?? rawFrames[0]?.dims?.width ?? 32;
  const height: number = gif.lsd?.height ?? rawFrames[0]?.dims?.height ?? 32;

  const truncated = rawFrames.slice(0, maxFrames);

  const frames = truncated.map((frame, index) => ({
    index,
    patch: frame.patch as Uint8ClampedArray,
    dims: frame.dims as { width: number; height: number; top: number; left: number },
    // gifuct-js delay is in centiseconds; convert to ms, default to 100ms
    delay: (frame.delay || 10) * 10,
  }));

  return { frames, width, height };
}

export async function preloadGif(url: string): ReturnType<typeof parseGifFrames> {
  return parseGifFrames(url);
}
