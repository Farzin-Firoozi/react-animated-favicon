# react-animated-favicon

[![npm version](https://img.shields.io/npm/v/react-animated-favicon?style=flat)](https://www.npmjs.com/package/react-animated-favicon)
[![npm downloads](https://img.shields.io/npm/dm/react-animated-favicon?style=flat)](https://www.npmjs.com/package/react-animated-favicon)
[![npm license](https://img.shields.io/npm/l/react-animated-favicon?style=flat)](https://www.npmjs.com/package/react-animated-favicon)
[![GitHub stars](https://img.shields.io/github/stars/farzin-firoozi/react-animated-favicon?style=flat)](https://github.com/farzin-firoozi/react-animated-favicon)

Zero-dependency React library for animated GIF favicons, fully client-side.

`react-animated-favicon` decodes GIF frames in the browser, renders them on a hidden canvas, and swaps `<link rel="icon">` with `data:` URLs on each tick. No server rendering required.

## Installation

```bash
npm install react-animated-favicon
```

## Quick Start

```tsx
import { AnimatedFavicon } from "react-animated-favicon";

export function App() {
  return (
    <AnimatedFavicon
      url="https://example.com/loader.gif"
      fallbackUrl="/favicon.ico"
    />
  );
}
```

## Hook Usage

```tsx
import { useAnimatedFavicon } from "react-animated-favicon";

export function FaviconControls() {
  const {
    currentFrame,
    frameCount,
    isPlaying,
    isLoading,
    error,
    play,
    pause,
    stop,
    goToFrame,
  } = useAnimatedFavicon("https://example.com/loader.gif", {
    autoPlay: true,
    maxFps: 15,
    fallbackUrl: "/favicon.ico",
  });

  if (isLoading) return <p>Loading favicon...</p>;
  if (error) return <p>Failed to load animated favicon.</p>;

  return (
    <div>
      <p>
        Frame {currentFrame + 1} / {frameCount}
      </p>
      <button onClick={play} disabled={isPlaying}>
        Play
      </button>
      <button onClick={pause} disabled={!isPlaying}>
        Pause
      </button>
      <button onClick={stop}>Stop</button>
      <button onClick={() => goToFrame(0)}>First frame</button>
    </div>
  );
}
```

## Component + Context API

```tsx
import {
  GifFaviconProvider,
  useGifFaviconContext,
} from "react-animated-favicon";

function Controls() {
  const { isPlaying, play, pause } = useGifFaviconContext();
  return (
    <button onClick={isPlaying ? pause : play}>
      {isPlaying ? "Pause" : "Play"}
    </button>
  );
}

export function App() {
  return (
    <GifFaviconProvider
      url="https://example.com/loader.gif"
      options={{ fallbackUrl: "/favicon.ico", useWorker: true }}
    >
      <Controls />
    </GifFaviconProvider>
  );
}
```

## Utilities (No React Dependency)

```ts
import { preloadGif, frameToDataUrl } from "react-animated-favicon";

const frames = await preloadGif("https://example.com/loader.gif");
const firstFramePngDataUrl = frameToDataUrl(frames[0], 32);
```

Useful for preloading, transformations, or generating a visual fallback from frame 0.

## API

### `useAnimatedFavicon(url, options?)`

Aliases are also exported:

- `useGifFavicon`
- `GifFavicon` (`AnimatedFavicon` alias)
- `GifFaviconProvider` (`AnimatedFaviconProvider` alias)
- `useGifFaviconContext`

Returns:

- `frames: GifFrame[]`
- `currentFrame: number`
- `frameCount: number`
- `isPlaying: boolean`
- `isLoading: boolean`
- `error: Error | null`
- `play(): void`
- `pause(): void`
- `stop(): void`
- `goToFrame(index: number): void`
- `destroy(): void`

### Options

| Option             | Type               | Default     | Description                                                      |
| ------------------ | ------------------ | ----------- | ---------------------------------------------------------------- |
| `autoPlay`         | `boolean`          | `true`      | Start animating immediately after load.                          |
| `fps`              | `number`           | `undefined` | Force fixed FPS, overriding GIF delay values.                    |
| `maxFps`           | `number`           | `15`        | Hard cap for playback speed.                                     |
| `maxFrames`        | `number`           | `60`        | Truncate decoded frames beyond this count.                       |
| `maxFileSize`      | `number`           | `5242880`   | Warn (via `onWarning`) if GIF exceeds this size in bytes.        |
| `fallbackUrl`      | `string`           | `undefined` | Static favicon URL used on failures or unsupported environments. |
| `pauseOnHidden`    | `boolean`          | `true`      | Pause animation while tab is hidden.                             |
| `restoreOnUnmount` | `boolean`          | `true`      | Restore original favicon when unmounted/destroyed.               |
| `useWorker`        | `boolean`          | `false`     | Offload fetch/parse to a Web Worker when available.              |
| `onLoad`           | `(frames) => void` | —           | Called after frames are decoded.                                 |
| `onError`          | `(err) => void`    | —           | Called on network/parse/runtime failures.                        |
| `onWarning`        | `(msg) => void`    | —           | Called for non-fatal issues (size/browser fallback).             |
| `onFrameChange`    | `(index) => void`  | —           | Called on each frame tick.                                       |

### `GifFrame`

```ts
interface GifFrame {
  index: number;
  patch: Uint8ClampedArray;
  dims: { width: number; height: number; top: number; left: number };
  delay: number;
}
```

## Web Worker Support

Set `useWorker: true` to parse GIFs off the main thread:

```ts
useAnimatedFavicon(url, { useWorker: true });
```

- Falls back to main-thread parsing when Worker features are unavailable.
- Uses transferable `ArrayBuffer`s for efficient frame transfer.
- `OffscreenCanvas` can be used as progressive enhancement on supported browsers.

## SSR and Next.js

The library is SSR-safe: all DOM work runs in `useEffect`.  
For Next.js App Router, use the component inside a client boundary:

```tsx
"use client";

import { AnimatedFavicon } from "react-animated-favicon";

export default function ClientFavicon() {
  return (
    <AnimatedFavicon
      url="https://example.com/loader.gif"
      fallbackUrl="/favicon.ico"
    />
  );
}
```

## CORS

GIF fetching follows browser CORS rules. If the GIF host blocks cross-origin requests, parsing fails and `onError` runs. Use a CORS-enabled source or your own proxy.

Example Cloudflare Worker proxy:

```js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");
    if (!target) return new Response("Missing ?url=", { status: 400 });

    const res = await fetch(target, {
      headers: { "User-Agent": "react-animated-favicon-proxy" },
    });

    const headers = new Headers(res.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  },
};
```

Then pass the proxied URL to the library.

## Browser Support

| Browser       | Support     | Notes                                     |
| ------------- | ----------- | ----------------------------------------- |
| Chrome 90+    | Full        | Reliable up to ~15 FPS.                   |
| Firefox 88+   | Full        | Reliable up to ~10 FPS.                   |
| Edge 90+      | Full        | Chromium behavior.                        |
| Safari 15+    | Partial     | Rapid updates may be ignored.             |
| Safari < 15   | No          | Falls back to `fallbackUrl`.              |
| Mobile Chrome | Best effort | Favicon visibility depends on UI surface. |
| Mobile Safari | No          | Falls back to `fallbackUrl`.              |

## Performance and Memory

- Default `pauseOnHidden: true` avoids background tab timer throttling.
- Frame RAM is roughly `width * height * 4` bytes per frame.
- For large GIFs, lower memory use with `maxFrames` and/or a lower `fps`.
- Recommended upper playback bound is about 15 FPS for stable favicon updates.

## TypeScript

Type declarations are published with the package.  
Common exports:

- `UseAnimatedFaviconOptions`
- `UseAnimatedFaviconResult`
- `GifFrame`
- `ParseResult`

## Contributing

```bash
npm install
npm run lint
npm test
npm run build
```

Project includes an `example` app for local verification.
