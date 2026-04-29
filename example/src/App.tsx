import { useState, useCallback, useEffect, useRef } from "react";
import { useAnimatedFavicon } from "react-animated-favicon";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const PRESETS = [
  {
    label: "Polish Cow",
    url: "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWM1YWJxOWwweXh5ank5dTdxZ2V1anVpanEydjUybHU2NWlpanB6ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Q3J5xe18ZEOVZqWA8x/giphy.gif",
  },
  {
    label: "Github Tiles",
    url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2tqdGJoOHZhazVhZHg0amwyazU1OHR5eXdtcXA1Nnk0b3JnZGp6ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dxn6fRlTIShoeBr69N/giphy.gif",
  },
  {
    label: "Dancing Cat",
    url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTJueGsxeXp3ZGN1YTd2eXVsMzBnczNvZWlsM3ByNmRsZms0MnJpcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/gXXFrjHFJIMoqKr8UT/giphy.gif",
  },
];

const CODE_SNIPPET = `import { AnimatedFavicon } from 'react-animated-favicon';

// Drop-in component — just add it once in your app root
function App() {
  return (
    <>
      <AnimatedFavicon
        url="https://example.com/animation.gif"
        fallbackUrl="/favicon.ico"
        onError={(err) => console.error(err)}
      />
      {/* ...rest of your app */}
    </>
  );
}

// Or use the hook for full control
function MyComponent() {
  const { isPlaying, play, pause, currentFrame, frameCount } =
    useAnimatedFavicon('https://example.com/animation.gif');

  return (
    <div>
      <p>Frame {currentFrame + 1} of {frameCount}</p>
      <button onClick={isPlaying ? pause : play}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}`;

const API_ROWS = [
  {
    api: "useAnimatedFavicon(url, options)",
    details:
      "Core hook that loads, decodes, and animates GIF frames as favicon.",
  },
  {
    api: "play() / pause() / stop()",
    details: "Playback controls. stop() resets frame index to 0.",
  },
  {
    api: "goToFrame(index)",
    details: "Seeks to a specific frame index for scrubbing and previews.",
  },
  {
    api: "isLoading / isPlaying / error",
    details: "State flags for loading, active playback, and error handling UI.",
  },
  {
    api: "fps / maxFps / maxFrames",
    details:
      "Performance controls for speed caps and memory-friendly truncation.",
  },
  {
    api: "fallbackUrl",
    details: "Static icon used when GIF fails or browser support is limited.",
  },
  {
    api: "onLoad / onWarning / onError / onFrameChange",
    details: "Lifecycle callbacks for telemetry, UX messages, and sync logic.",
  },
  {
    api: "Local GIF files",
    details:
      "Supported via file input + blob URL (object URL), not raw file:// paths.",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button className="copy-btn" onClick={handleCopy}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function App() {
  const [inputUrl, setInputUrl] = useState(PRESETS[0].url);
  const [activeUrl, setActiveUrl] = useState(PRESETS[0].url);
  const [fps, setFps] = useState<number | undefined>(15);
  const [warning, setWarning] = useState<string | null>(null);
  const localObjectUrlRef = useRef<string | null>(null);

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
  } = useAnimatedFavicon(activeUrl, {
    fps,
    maxFps: 15,
    fallbackUrl: "/favicon.svg",
    onWarning: useCallback((msg: string) => setWarning(msg), []),
    onError: useCallback(() => setWarning(null), []),
    onLoad: useCallback(() => setWarning(null), []),
  });

  const handleGo = () => {
    const trimmed = inputUrl.trim();
    if (trimmed) setActiveUrl(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleGo();
  };

  const handlePreset = (url: string) => {
    setInputUrl(url);
    setActiveUrl(url);
  };

  const handleLocalFile = (file: File | null) => {
    if (!file) return;
    if (file.type !== "image/gif") {
      setWarning("Please select a valid .gif file");
      return;
    }
    if (localObjectUrlRef.current) {
      URL.revokeObjectURL(localObjectUrlRef.current);
    }
    const objectUrl = URL.createObjectURL(file);
    localObjectUrlRef.current = objectUrl;
    setWarning(null);
    setInputUrl(objectUrl);
    setActiveUrl(objectUrl);
  };

  useEffect(() => {
    return () => {
      if (localObjectUrlRef.current) {
        URL.revokeObjectURL(localObjectUrlRef.current);
      }
    };
  }, []);

  const progress = frameCount > 0 ? (currentFrame / (frameCount - 1)) * 100 : 0;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">✨</span>
            <div>
              <h1>react-animated-favicon</h1>
              <p className="tagline">
                Animated GIF favicons for React — zero deps, SSR-safe,
                TypeScript-first
              </p>
            </div>
          </div>
          <div className="badges">
            <a
              href="https://www.npmjs.com/package/react-animated-favicon"
              target="_blank"
              rel="noreferrer"
              className="badge"
            >
              npm
            </a>
            <a
              href="https://github.com/farzinfiroozi/react-animated-favicon"
              target="_blank"
              rel="noreferrer"
              className="badge"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="section demo-section">
          <div className="section-label">Live Demo</div>
          <p className="hint">
            👆 Watch the favicon animate in your browser tab above!
          </p>

          <div className="url-row">
            <input
              className="url-input"
              type="url"
              placeholder="Paste any CORS-enabled GIF URL…"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="btn btn-primary" onClick={handleGo}>
              Load
            </button>
          </div>
          <div className="local-file-row">
            <label className="local-file-label">
              Or load local GIF:
              <input
                type="file"
                accept="image/gif"
                onChange={(e) => handleLocalFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="presets">
            {PRESETS.map((p) => (
              <button
                key={p.url}
                className={`preset-btn ${activeUrl === p.url ? "active" : ""}`}
                onClick={() => handlePreset(p.url)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {warning && <div className="notice warning">{warning}</div>}
          {error && (
            <div className="notice error">
              <strong>Error:</strong> {error.message}
              {error.message.toLowerCase().includes("cors") ||
              error.message.toLowerCase().includes("fetch") ? (
                <span> — This GIF may not allow cross-origin requests.</span>
              ) : null}
            </div>
          )}
        </section>

        <div className="controls-grid">
          <section className="section controls-section">
            <div className="section-label">Playback</div>
            <div className="status-row">
              {isLoading && <span className="status loading">⟳ Loading…</span>}
              {!isLoading && !error && isPlaying && (
                <span className="status playing">● Playing</span>
              )}
              {!isLoading && !error && !isPlaying && frameCount > 0 && (
                <span className="status paused">⏸ Paused</span>
              )}
            </div>
            <div className="btn-row">
              <button
                className="btn btn-control"
                onClick={isPlaying ? pause : play}
                disabled={isLoading || frameCount === 0}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button
                className="btn btn-control"
                onClick={stop}
                disabled={isLoading || frameCount === 0}
                title="Stop"
              >
                ⏹
              </button>
            </div>

            <div className="speed-row">
              <label className="field-label">
                Speed
                <span className="speed-value">
                  {fps ? `${fps} fps` : `auto (≤15 fps)`}
                </span>
              </label>
              <input
                type="range"
                min={1}
                max={15}
                step={1}
                value={fps ?? 0}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setFps(v === 0 ? undefined : v);
                }}
                className="slider"
              />
              <div className="slider-labels">
                <span>Auto</span>
                <span>15 fps</span>
              </div>
            </div>
          </section>

          <section className="section frames-section">
            <div className="section-label">Frames</div>
            {frameCount > 0 ? (
              <>
                <div className="frame-counter">
                  <span className="frame-current">{currentFrame + 1}</span>
                  <span className="frame-sep"> / </span>
                  <span className="frame-total">{frameCount}</span>
                </div>
                <div className="progress-bar" title="Click to seek">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                  <input
                    type="range"
                    className="progress-scrubber"
                    min={0}
                    max={frameCount - 1}
                    value={currentFrame}
                    onChange={(e) => goToFrame(Number(e.target.value))}
                  />
                </div>
                <div className="frame-grid">
                  {Array.from({ length: Math.min(frameCount, 20) }, (_, i) => (
                    <button
                      key={i}
                      className={`frame-dot ${i === currentFrame ? "active" : ""}`}
                      onClick={() => goToFrame(i)}
                      title={`Frame ${i + 1}`}
                    />
                  ))}
                  {frameCount > 20 && (
                    <span className="frame-more">+{frameCount - 20}</span>
                  )}
                </div>
              </>
            ) : (
              <p className="empty-state">
                {isLoading ? "Decoding GIF frames…" : "No frames loaded"}
              </p>
            )}
          </section>
        </div>

        <section className="section install-section">
          <div className="section-label">Install</div>
          <div className="code-block">
            <code>npm install react-animated-favicon</code>
            <CopyButton text="npm install react-animated-favicon" />
          </div>
        </section>

        <section className="section code-section">
          <div className="section-label">Usage</div>
          <div className="multiline">
            <SyntaxHighlighter language="tsx" style={oneDark}>
              {CODE_SNIPPET}
            </SyntaxHighlighter>
          </div>
        </section>

        <section className="section compat-section">
          <div className="section-label">API Details</div>
          <table className="compat-table api-table">
            <thead>
              <tr>
                <th>API</th>
                <th>Functionality</th>
              </tr>
            </thead>
            <tbody>
              {API_ROWS.map((row) => (
                <tr key={row.api}>
                  <td className="api-name">{row.api}</td>
                  <td>{row.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="section compat-section">
          <div className="section-label">Browser Compatibility</div>
          <table className="compat-table">
            <thead>
              <tr>
                <th>Browser</th>
                <th>Support</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Chrome / Edge 90+</td>
                <td>
                  <span className="badge-compat full">✅ Full</span>
                </td>
                <td>Up to ~15 fps reliable</td>
              </tr>
              <tr>
                <td>Firefox 88+</td>
                <td>
                  <span className="badge-compat full">✅ Full</span>
                </td>
                <td>Up to ~10 fps reliable</td>
              </tr>
              <tr>
                <td>Safari 15+</td>
                <td>
                  <span className="badge-compat partial">⚠️ Partial</span>
                </td>
                <td>May ignore rapid updates</td>
              </tr>
              <tr>
                <td>Safari &lt; 15 / Mobile Safari</td>
                <td>
                  <span className="badge-compat none">❌ None</span>
                </td>
                <td>
                  Falls back to <code>fallbackUrl</code>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>

      <footer className="footer">
        <p>
          MIT License · Built by{" "}
          <a
            href="https://github.com/farzinfiroozi"
            target="_blank"
            rel="noreferrer"
          >
            Farzin Firoozi
          </a>
        </p>
      </footer>
    </div>
  );
}
