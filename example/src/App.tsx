import { useState, useCallback } from "react";
import { useAnimatedFavicon } from "react-animated-favicon";

const PRESETS = [
  {
    label: "Loading Spinner",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif",
  },
  {
    label: "Pacman",
    url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmwxcXRzaHA4ZGtzdnlmZjYzZnBnZDlyaWVybHV3ZTh6ZjV6cXkzNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/fMW4CaO6zfiwLoIpEQ/giphy.gif",
  },
  {
    label: "Nyan Cat",
    url: "https://upload.wikimedia.org/wikipedia/commons/9/91/Nyan_cat_250px_frame.gif",
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
  const [fps, setFps] = useState<number | undefined>(undefined);
  const [warning, setWarning] = useState<string | null>(null);

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
          <div className="code-block multiline">
            <pre>
              <code>{CODE_SNIPPET}</code>
            </pre>
            <CopyButton text={CODE_SNIPPET} />
          </div>
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
