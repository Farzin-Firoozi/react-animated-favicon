# react-animated-favicon — React Library PRD & Documentation

# Overview

`react-animated-favicon` is a zero-dependency React library that enables animated GIF favicons entirely on the client side. It parses GIF frames using `gifuct-js`, renders them onto a hidden `<canvas>`, and cycles the resulting `data:` URLs through `<link rel="icon">` — no server required.

> **Version:** 1.0.0 · **Status:** Draft · **Author:** Farzin Firoozi · **Updated:** 2026-04-29

> **Package name:** `react-animated-favicon`

---

# Problem Statement

Browsers natively support only static favicons. Developers who want animated favicons have no standard React-first solution — existing workarounds are either non-React, poorly maintained, or require server-side processing. `react-animated-favicon` fills that gap with a clean hook-based API, proper browser compatibility handling, and production-safe defaults.

---

# Goals

- Ship a React hook (`useGifFavicon`) and companion component (`GifFavicon`) that work out of the box.
- Parse GIF frames entirely on the client — no server, no canvas backend.
- Handle all known browser quirks (Safari, background tab throttling, CORS failures) gracefully.
- Support Web Worker offloading via `useWorker` option with `OffscreenCanvas` progressive enhancement.
- Be fully SSR-safe and compatible with Next.js App Router.
- Be tree-shakeable, TypeScript-first, and framework-agnostic (Vite, Next.js, CRA).
- Publish to NPM with minimal bundle footprint.
- Provide a live demo site showcasing all features.

# Non-Goals

- Server-side rendering of the favicon (always a client-side DOM concern).
- Supporting APNG or WebP animations (GIF only in v1).
- Providing a React Native version.
- Hosting a CORS proxy (documented, not bundled).

---

# Public API

## `useGifFavicon(url, options?)` — Primary Hook

```tsx
const {
  frames, // GifFrame[]   — all decoded frames
  currentFrame, // number       — index of currently displayed frame
  frameCount, // number       — total frame count
  isPlaying, // boolean
  isLoading, // boolean
  error, // Error | null
  play, // () => void
  pause, // () => void
  stop, // () => void   — pauses + resets to frame 0
  goToFrame, // (index: number) => void
  destroy, // () => void   — cleans up and restores original favicon
} = useAnimatedFavicon(url, options);
```

## Options Reference

| Option             | Type               | Default     | Description                                            |
| ------------------ | ------------------ | ----------- | ------------------------------------------------------ |
| `autoPlay`         | `boolean`          | `true`      | Start animating immediately on load                    |
| `fps`              | `number`           | `undefined` | Override per-frame delay with a fixed fps              |
| `maxFps`           | `number`           | `15`        | Hard cap — never exceed this regardless of GIF data    |
| `maxFrames`        | `number`           | `60`        | Truncate decoded frames beyond this count              |
| `maxFileSize`      | `number`           | `5242880`   | Warn via `onWarning` if GIF exceeds this (default 5MB) |
| `fallbackUrl`      | `string`           | `undefined` | Static favicon URL if GIF fails                        |
| `pauseOnHidden`    | `boolean`          | `true`      | Pause when tab is hidden, resume on focus              |
| `restoreOnUnmount` | `boolean`          | `true`      | Restore original favicon on unmount                    |
| `useWorker`        | `boolean`          | `false`     | Offload GIF parsing to a Web Worker (opt-in)           |
| `onLoad`           | `(frames) => void` | —           | Called after all frames are decoded                    |
| `onError`          | `(err) => void`    | —           | Called on fetch or parse failure                       |
| `onWarning`        | `(msg) => void`    | —           | Called for non-fatal issues                            |
| `onFrameChange`    | `(index) => void`  | —           | Called on every frame tick                             |

## `GifFrame` Type

```tsx
interface GifFrame {
  index: number;
  patch: Uint8ClampedArray; // RGBA pixel data
  dims: { width: number; height: number; top: number; left: number };
  delay: number; // ms
}
```

## `<GifFavicon />` — Drop-in Component

Zero-render component (returns `null`). Accepts all the same options as `useGifFavicon`.

```tsx
<GifFavicon
  url="https://example.com/animation.gif"
  autoPlay
  fps={12}
  fallbackUrl="/static/favicon.ico"
  onError={(err) => console.error(err)}
/>
```

```
## `<GifFaviconProvider />` — Context Provider
```

<GifFaviconProvider url="..." options={...}>

<App />

</GifFaviconProvider>

// Anywhere in the tree:

const { play, pause, isPlaying } = useGifFaviconContext();

```
## `preloadGif(url)` — Standalone Utility
```

import { preloadGif } from 'gif-favicon';

const frames = await preloadGif('[https://example.com/loader.gif](https://example.com/loader.gif)');

```
No React dependency — useful for prefetching frames before mounting the hook.
## `frameToDataUrl(frame, size?)` — Frame to PNG Utility
```

import { preloadGif, frameToDataUrl } from 'gif-favicon';

const frames = await preloadGif('[https://example.com/loader.gif](https://example.com/loader.gif)');

const dataUrl = frameToDataUrl(frames[0], 32); // 32x32 PNG data: URL

```
Converts a single `GifFrame` to a `data:image/png;base64,...` string. Useful for generating a `fallbackUrl` programmatically from the GIF's own first frame, so the fallback visually matches the animation. No React dependency.
---
# Package Structure
```

react-animated-favicon/

├── src/

│ ├── hooks/

│ │ ├── useAnimatedFavicon.ts # core hook

│ │ └── useAnimatedFaviconContext.ts # context hook

│ ├── components/

│ │ ├── AnimatedFavicon.tsx # headless component

│ │ └── AnimatedFaviconProvider.tsx # context provider

│ ├── lib/

│ │ ├── parser.ts # gifuct-js wrapper + frame extraction

│ │ ├── worker.ts # Web Worker script

│ │ ├── favicon.ts # DOM manipulation (link tag + canvas)

│ │ ├── scheduler.ts # animation loop + visibilitychange

│ │ └── detect.ts # browser detection

│ ├── types.ts # all shared types

│ └── index.ts # public exports

├── demo/ # Vite demo app

├── dist/ # built output (gitignored)

├── package.json

├── tsconfig.json

├── vite.config.ts

├── vitest.config.ts

├── .npmignore

└── [README.md](http://README.md)

```
---
# Internal Architecture
## Frame Parsing (`parser.ts`)
1. `fetch(url)` → `ArrayBuffer`
2. `parseGIF(buffer)` via `gifuct-js`
3. `decompressFrames(gif, true)` — patches full canvas, handles GIF disposal types
4. Truncate at `maxFrames`
5. Emit `onWarning` if byte size exceeds `maxFileSize`
6. Return `GifFrame[]`
## Web Worker (`worker.ts`)
When `useWorker: true`, GIF fetching and parsing are offloaded to a dedicated Web Worker, keeping the main thread fully unblocked during heavy decompression.

**Thread split:**
```

Worker: fetch → parseGIF → decompressFrames → postMessage(frames, transferables)

Main thread: receive frames → canvas rendering → favicon DOM swap

```
**Zero-copy transfer:** Each frame's `patch` (`Uint8ClampedArray`) is transferred as a `Transferable` object via `ArrayBuffer`, avoiding full memory copy:
```

// worker.ts

self.onmessage = async ({ data: { url, maxFrames } }) => {

const res = await fetch(url);

const buffer = await res.arrayBuffer();

const gif = parseGIF(buffer);

const frames = decompressFrames(gif, true).slice(0, maxFrames);

const transferables = [frames.map](http://frames.map)(f => f.patch.buffer);

self.postMessage({ type: 'frames', frames }, transferables);

};

```
**`OffscreenCanvas`**** (progressive enhancement):** On Chrome and Firefox, canvas operations can run inside the worker, transferring the final `ImageBitmap` to the main thread. Safari support is unreliable — a main-thread fallback is always available.
<table header-row="true">
<tr>
<td>Feature</td>
<td>Chrome</td>
<td>Firefox</td>
<td>Safari</td>
</tr>
<tr>
<td>Web Worker</td>
<td>✅</td>
<td>✅</td>
<td>✅</td>
</tr>
<tr>
<td>Transferable `ArrayBuffer`</td>
<td>✅</td>
<td>✅</td>
<td>✅</td>
</tr>
<tr>
<td>`OffscreenCanvas` in worker</td>
<td>✅ 69+</td>
<td>✅ 105+</td>
<td>⚠️ 16.4+ partial</td>
</tr>
</table>
**Fallback:** If `Worker` is unavailable, parsing falls back to main-thread `parser.ts` silently. `onWarning` is called.
## Favicon Rendering (`favicon.ts`)
1. Snapshot existing `<link rel="icon">` href on mount (for `restoreOnUnmount`)
2. Create/reuse `<link rel="icon" type="image/png">` in `<head>`
3. Maintain one persistent offscreen canvas sized to GIF's natural dimensions
4. Maintain one persistent 32×32 favicon canvas
5. On each tick: `putImageData` → `drawImage` → `toDataURL` → set as `link.href`
6. On destroy: restore original href, remove canvases
## Animation Scheduler (`scheduler.ts`)
- Uses `setTimeout` (not `setInterval`) per tick with per-frame delay, respecting `maxFps`
- Listens to `document.visibilitychange` — pauses on hidden, resumes on visible
- Cleans up all timers and listeners on destroy
## SSR Safety
All DOM access is guarded inside `useEffect` — which never runs on the server. The hook returns safe initial state during SSR:
```

// Safe server-side initial state

{ frames: [], currentFrame: 0, frameCount: 0, isPlaying: false, isLoading: false, error: null }

```
Worker instantiation is also lazy and inside `useEffect`:
```

useEffect(() => {

if (typeof window === 'undefined') return; // SSR guard

const worker = new Worker(new URL('../lib/worker.ts', import.meta.url), { type: 'module' });

return () => worker.terminate();

}, [url]);

```
## Next.js App Router Usage
`gif-favicon` does **not** ship a `'use client'` directive — that is the consumer's responsibility.
```

// components/AnimatedFavicon.tsx

'use client';

import { AnimatedFavicon } from 'react-animated-favicon';

export default function AnimatedFavicon({ url }: { url: string }) {

return <AnimatedFavicon url={url} />;

}

```

```

// app/layout.tsx — server component, safe

import AnimatedFavicon from '@/components/AnimatedFavicon';

export default function RootLayout({ children }) {

return (

<html>

<body>

<AnimatedFavicon url="[https://example.com/loader.gif](https://example.com/loader.gif)" />

{children}

</body>

</html>

);

}

```
---
# Build & Tooling
<table header-row="true">
<tr>
<td>Tool</td>
<td>Purpose</td>
</tr>
<tr>
<td>**Vite** (lib mode)</td>
<td>Build ESM + CJS + `.d.ts`</td>
</tr>
<tr>
<td>**TypeScript**</td>
<td>Strict mode, full type exports</td>
</tr>
<tr>
<td>**Vitest**</td>
<td>Unit + integration tests</td>
</tr>
<tr>
<td>**gifuct-js**</td>
<td>GIF parsing dependency</td>
</tr>
<tr>
<td>**React**</td>
<td>Peer dependency (`>=16.8.0`)</td>
</tr>
<tr>
<td>**Prettier + ESLint**</td>
<td>Code style</td>
</tr>
<tr>
<td>**Changesets**</td>
<td>Versioning and changelog</td>
</tr>
<tr>
<td>**GitHub Actions**</td>
<td>CI: lint → test → build → publish</td>
</tr>
</table>
## `vite.config.ts`
```

import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

import dts from 'vite-plugin-dts';

export default defineConfig({

plugins: [react(), dts({ insertTypesEntry: true })],

build: {

lib: {

entry: 'src/index.ts',

name: 'ReactAnimatedFavicon',

formats: ['es', 'cjs'],

fileName: (format) => `react-animated-favicon.${format}.js`,

},

rollupOptions: {

external: ['react', 'react-dom'],

output: { globals: { react: 'React' } },

},

},

});

```
## `package.json` key fields
```

{

"name": "react-animated-favicon",

"version": "1.0.0",

"main": "./dist/react-animated-favicon.cjs.js",

"module": "./dist/[react-animated-favicon.es](http://react-animated-favicon.es).js",

"types": "./dist/index.d.ts",

"exports": {

".": {

"import": "./dist/[react-animated-favicon.es](http://react-animated-favicon.es).js",

"require": "./dist/react-animated-favicon.cjs.js",

"types": "./dist/index.d.ts"

}

},

"sideEffects": false,

"peerDependencies": { "react": ">=16.8.0" },

"dependencies": { "gifuct-js": "^2.1.2" }

}

```
---
# Browser Compatibility
<table header-row="true">
<tr>
<td>Browser</td>
<td>Animated favicon</td>
<td>Notes</td>
</tr>
<tr>
<td>Chrome 90+</td>
<td>✅ Full</td>
<td>Up to \~15fps reliable</td>
</tr>
<tr>
<td>Firefox 88+</td>
<td>✅ Full</td>
<td>Up to \~10fps reliable</td>
</tr>
<tr>
<td>Edge 90+</td>
<td>✅ Full</td>
<td>Chromium-based</td>
</tr>
<tr>
<td>Safari 15+</td>
<td>⚠️ Partial</td>
<td>Often ignores rapid updates; `onWarning` fires</td>
</tr>
<tr>
<td>Safari \< 15</td>
<td>❌ None</td>
<td>Falls back to `fallbackUrl`</td>
</tr>
<tr>
<td>Mobile Chrome</td>
<td>✅ Best effort</td>
<td>Favicon not always visible in mobile UI</td>
</tr>
<tr>
<td>Mobile Safari</td>
<td>❌ None</td>
<td>Falls back to `fallbackUrl`</td>
</tr>
</table>
## Background Tab Throttling
<table header-row="true">
<tr>
<td>Browser</td>
<td>`setTimeout` minimum when hidden</td>
</tr>
<tr>
<td>Chrome</td>
<td>1000ms</td>
</tr>
<tr>
<td>Firefox</td>
<td>1000ms</td>
</tr>
<tr>
<td>Safari</td>
<td>1000ms+</td>
</tr>
</table>
`pauseOnHidden: true` (default) sidesteps this entirely — animation pauses, zero CPU wasted.
## Hard Limits
<table header-row="true">
<tr>
<td>Limit</td>
<td>Value</td>
<td>Notes</td>
</tr>
<tr>
<td>Max reliable fps</td>
<td>\~15</td>
<td>Browser rendering cap for favicon DOM swaps</td>
</tr>
<tr>
<td>Favicon render size</td>
<td>32×32</td>
<td>All frames scaled to this</td>
</tr>
<tr>
<td>GIF file size warning</td>
<td>5MB</td>
<td>Default `maxFileSize`; not a hard block</td>
</tr>
<tr>
<td>Max frames default</td>
<td>60</td>
<td>Truncated beyond this; configurable</td>
</tr>
<tr>
<td>RAM per frame (500×500)</td>
<td>\~1MB</td>
<td>`width × height × 4 bytes`</td>
</tr>
<tr>
<td>`data:` URL size per frame</td>
<td>\~1–3KB</td>
<td>32×32 PNG base64 — no issue</td>
</tr>
</table>
---
# Fallback ICO Support
When the GIF fails to load, parse, or runs in an unsupported environment (Safari \< 15, Mobile Safari, SSR), the library falls back to a static `.ico` or image URL supplied via the `fallbackUrl` option.
## How it works
The fallback is applied in `favicon.ts` by setting `link.href = fallbackUrl` whenever any of the following conditions are met:
- `fetch()` throws (network error, CORS, 404/500)
- `decompressFrames()` returns zero frames
- `gifuct-js` throws a parse error
- `useWorker: true` and the worker throws an unrecoverable error
- Browser is detected as unsupported (Safari \< 15 via `detect.ts`)
## Recommended fallback setup
Always provide a `fallbackUrl` pointing to a pre-existing static favicon. Best practice is to point it at the same `/favicon.ico` the browser would load anyway, so the tab never looks broken:
```

<GifFavicon

url="[https://example.com/loader.gif](https://example.com/loader.gif)"

fallbackUrl="/favicon.ico"

onError={(err) => console.warn('GIF favicon failed, using static fallback:', err)}

/>

```
## Generating a fallback `.ico` from the GIF's first frame
For apps that don't have an existing static favicon, the library exposes a utility to extract the first frame and convert it to a downloadable `.ico`-compatible PNG:
```

import { preloadGif, frameToDataUrl } from 'gif-favicon';

const frames = await preloadGif('[https://example.com/loader.gif](https://example.com/loader.gif)');

const dataUrl = frameToDataUrl(frames[0], 32); // 32x32 PNG data URL

// Use as fallbackUrl or inject manually

```
`frameToDataUrl(frame, size?)` is a pure utility (no React dependency) that draws a single `GifFrame` onto a canvas and returns a `data:image/png;base64,...` string suitable for use as `fallbackUrl`.
## Fallback priority order
The library resolves the favicon in this order:
<table header-row="true">
<tr>
<td>Priority</td>
<td>Source</td>
<td>Condition</td>
</tr>
<tr>
<td>1</td>
<td>Animated GIF frames</td>
<td>GIF loads and browser supports it</td>
</tr>
<tr>
<td>2</td>
<td>`fallbackUrl`</td>
<td>Any error or unsupported browser</td>
</tr>
<tr>
<td>3</td>
<td>Original page favicon</td>
<td>`restoreOnUnmount: true` on unmount</td>
</tr>
<tr>
<td>4</td>
<td>Nothing (browser default)</td>
<td>No `fallbackUrl` provided and no prior favicon</td>
</tr>
</table>
## Error handling with fallback
The `onError` callback fires before the fallback is applied, giving you the chance to log or track the failure:
```

useAnimatedFavicon(url, {

fallbackUrl: '/favicon.ico',

onError: (err) => {

analytics.track('gif_favicon_error', { message: err.message });

},

});

```
## `fallbackUrl` in SSR
In SSR environments (Next.js App Router server components, `window` undefined), the hook no-ops entirely and never touches the DOM. The fallback is not applied server-side — it is purely a client-side recovery mechanism. The browser will use whatever `<link rel="icon">` is already in the server-rendered HTML.
---
# Error Handling
<table header-row="true">
<tr>
<td>Scenario</td>
<td>Behavior</td>
</tr>
<tr>
<td>Fetch fails (network)</td>
<td>`onError` called; `fallbackUrl` set</td>
</tr>
<tr>
<td>Fetch fails (CORS)</td>
<td>`onError` with CORS message; `fallbackUrl` set</td>
</tr>
<tr>
<td>HTTP error (404, 500)</td>
<td>`onError` with status code</td>
</tr>
<tr>
<td>GIF parse fails</td>
<td>`onError` called; `fallbackUrl` set</td>
</tr>
<tr>
<td>Zero frames decoded</td>
<td>`onError` with descriptive message</td>
</tr>
<tr>
<td>GIF exceeds `maxFileSize`</td>
<td>`onWarning` called; continues loading</td>
</tr>
<tr>
<td>Safari detected</td>
<td>`onWarning` called; continues best effort</td>
</tr>
<tr>
<td>Unmounted mid-fetch</td>
<td>Aborted via `AbortController`; no state update</td>
</tr>
<tr>
<td>`useWorker: true`, Worker unavailable</td>
<td>Silent fallback to main-thread; `onWarning` called</td>
</tr>
<tr>
<td>`useWorker: true`, worker throws</td>
<td>`onError` called; no partial state</td>
</tr>
<tr>
<td>SSR (`window` undefined)</td>
<td>Hook no-ops; returns safe initial state</td>
</tr>
</table>
---
# Testing Plan
## Unit Tests (Vitest)
- `parser.ts` — mock `fetch` and `gifuct-js`; assert frame count, truncation, error paths
- `worker.ts` — assert `postMessage` payload includes transferables, frame truncation
- `favicon.ts` — mock `document.head`; assert `<link>` creation, href swaps, restore on destroy
- `scheduler.ts` — fake timers; assert interval timing, `visibilitychange` pause/resume
- `detect.ts` — mock `navigator.userAgent` and `OffscreenCanvas`; assert Safari detection
## Integration Tests (`@testing-library/react`)
- Assert `isLoading → isPlaying` state transitions
- Assert `destroy()` restores favicon href
- Assert `pauseOnHidden` stops the loop
- Assert `useWorker: true` terminates worker on unmount
- Assert SSR: hook returns safe initial state when `window` is undefined
- Assert Next.js App Router: `GifFavicon` wrapped in `'use client'` mounts without error
## Manual Browser Testing
- Chrome, Firefox, Edge, Safari (latest + one prior major)
- CORS-friendly GIF (Giphy CDN) — assert animation plays
- Non-CORS GIF — assert `onError` fires, fallback applies
- Tab switching — assert `visibilitychange` pause/resume
- Unmount — assert favicon restores
---
# Demo App
Vite + React demo deployed to GitHub Pages or Vercel:
- URL input → live animated favicon
- Frame scrubber (click any frame to jump)
- Speed control slider
- Play / Pause / Stop buttons
- Live error display for CORS failures
- Copy-paste code snippet
---
# README Sections
1. Installation — `npm install react-animated-favicon`
2. Quick start — `<AnimatedFavicon url="..." />` one-liner
3. Hook usage — full `useAnimatedFavicon` example with controls
4. Options table — all options with types and defaults
5. Web Worker — `useWorker: true` opt-in, `OffscreenCanvas` progressive enhancement, fallback
6. SSR / Next.js — `'use client'` wrapper pattern, App Router + Pages Router examples
7. CORS — explanation + Cloudflare Worker proxy snippet
8. Browser support table
9. Memory considerations — frame count vs RAM formula
10. TypeScript — all exported types
11. Contributing — local setup, test, build commands
12. License — MIT
---
# Publishing Checklist
- [ ] `npm publish --access public`
- [ ] NPM page has description, keywords: `favicon`, `gif`, `animated`, `react`, `hook`
- [ ] GitHub repo has topics set
- [ ] README has npm badge, bundlephobia badge, license badge
- [ ] Demo deployed and linked in README
- [ ] `CHANGELOG.md` initialized via Changesets
---
# Milestones
<table header-row="true">
<tr>
<td>Milestone</td>
<td>Scope</td>
<td>Target</td>
</tr>
<tr>
<td>M1 — Core</td>
<td>`parser.ts`, `favicon.ts`, `scheduler.ts`, `useGifFavicon` hook</td>
<td>Week 1</td>
</tr>
<tr>
<td>M2 — Worker & SSR</td>
<td>`worker.ts`, `detect.ts`, SSR guards, `useWorker` option, Next.js compat</td>
<td>Week 1</td>
</tr>
<tr>
<td>M3 — Component & Context</td>
<td>`GifFavicon`, `GifFaviconProvider`, `useGifFaviconContext`</td>
<td>Week 1</td>
</tr>
<tr>
<td>M4 — Tests</td>
<td>Full unit + integration suite including worker and SSR</td>
<td>Week 2</td>
</tr>
<tr>
<td>M5 — Build & CI</td>
<td>Vite lib build, GitHub Actions, NPM publish</td>
<td>Week 2</td>
</tr>
<tr>
<td>M6 — Demo & Docs</td>
<td>Demo app, README, bundlephobia check</td>
<td>Week 2</td>
</tr>
<tr>
<td>M7 — Publish</td>
<td>`npm publish`, GitHub release, announce</td>
<td>Week 2</td>
</tr>
</table>
---
# Future Considerations (v2+)
- `useNotificationFavicon` — pulse between two icons for unread count badge
- APNG support
- WebP animation support
- `gif-favicon/vanilla` — framework-agnostic export, no React dependency
- `maxMemoryMB` option — auto-truncate frames to stay within a memory budget
- Shared worker — single `SharedWorker` instance across tabs to avoid duplicate GIF parsing
```
