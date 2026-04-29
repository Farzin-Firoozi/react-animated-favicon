export function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua);
}

export function isFirefox(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Firefox\//.test(navigator.userAgent);
}

export function getSafariVersion(): number | null {
  if (!isSafari()) return null;
  const match = navigator.userAgent.match(/Version\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function isMobileSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && isSafari();
}

export function isUnsupportedBrowser(): boolean {
  if (isMobileSafari()) return true;
  const version = getSafariVersion();
  if (version !== null && version < 15) return true;
  return false;
}

export function supportsOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== 'undefined';
}

export function supportsWorker(): boolean {
  return typeof Worker !== 'undefined';
}
