import type { GifFrame } from '../types';

const FAVICON_SIZE = 32;

export interface FaviconController {
  renderFrame(frame: GifFrame): void;
  setFallback(url: string): void;
  restore(): void;
}

export function createFaviconController(gifWidth: number, gifHeight: number): FaviconController {
  let originalHref: string | null = null;
  let link: HTMLLinkElement | null = null;
  let offscreenCanvas: HTMLCanvasElement | null = null;
  let faviconCanvas: HTMLCanvasElement | null = null;

  link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  originalHref = link.href;

  offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = gifWidth;
  offscreenCanvas.height = gifHeight;

  faviconCanvas = document.createElement('canvas');
  faviconCanvas.width = FAVICON_SIZE;
  faviconCanvas.height = FAVICON_SIZE;

  function renderFrame(frame: GifFrame): void {
    if (!offscreenCanvas || !faviconCanvas || !link) return;

    const offCtx = offscreenCanvas.getContext('2d');
    if (!offCtx) return;

    // Draw the patch at its position on the GIF canvas
    const imageData = new ImageData(
      new Uint8ClampedArray(frame.patch),
      frame.dims.width,
      frame.dims.height
    );
    offCtx.putImageData(imageData, frame.dims.left, frame.dims.top);

    const faviconCtx = faviconCanvas.getContext('2d');
    if (!faviconCtx) return;

    faviconCtx.clearRect(0, 0, FAVICON_SIZE, FAVICON_SIZE);
    faviconCtx.drawImage(offscreenCanvas, 0, 0, FAVICON_SIZE, FAVICON_SIZE);

    link.type = 'image/png';
    link.href = faviconCanvas.toDataURL('image/png');
  }

  function setFallback(url: string): void {
    if (link) {
      link.type = '';
      link.href = url;
    }
  }

  function restore(): void {
    if (link && originalHref !== null) {
      link.type = '';
      link.href = originalHref;
    }
    offscreenCanvas = null;
    faviconCanvas = null;
    link = null;
    originalHref = null;
  }

  return { renderFrame, setFallback, restore };
}

export function frameToDataUrl(frame: GifFrame, size = 32): string {
  const offscreen = document.createElement('canvas');
  offscreen.width = frame.dims.width;
  offscreen.height = frame.dims.height;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return '';

  const imageData = new ImageData(
    new Uint8ClampedArray(frame.patch),
    frame.dims.width,
    frame.dims.height
  );
  offCtx.putImageData(imageData, 0, 0);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(offscreen, 0, 0, size, size);
  return canvas.toDataURL('image/png');
}
