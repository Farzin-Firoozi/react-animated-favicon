import { parseGIF, decompressFrames } from 'gifuct-js';

const workerScope = self as unknown as Worker;

interface WorkerInput {
  url: string;
  maxFrames: number;
  maxFileSize: number;
}

workerScope.onmessage = async ({ data }: MessageEvent<WorkerInput>) => {
  const { url, maxFrames, maxFileSize } = data;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch GIF: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    if (buffer.byteLength > maxFileSize) {
      workerScope.postMessage({ type: 'warning', message: 'GIF file size exceeds maxFileSize limit' });
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
      dims: frame.dims,
      delay: (frame.delay || 10) * 10,
    }));

    const transferables = frames.map((f) => f.patch.buffer as ArrayBuffer);
    workerScope.postMessage({ type: 'frames', frames, width, height }, transferables);
  } catch (err) {
    workerScope.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
