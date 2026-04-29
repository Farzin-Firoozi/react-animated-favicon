// Primary hook
export { useAnimatedFavicon } from './hooks/useAnimatedFavicon';
export { useAnimatedFaviconContext } from './hooks/useAnimatedFaviconContext';

// Components
export { AnimatedFavicon } from './components/AnimatedFavicon';
export type { AnimatedFaviconProps } from './components/AnimatedFavicon';
export { AnimatedFaviconProvider } from './components/AnimatedFaviconProvider';
export type { AnimatedFaviconProviderProps } from './components/AnimatedFaviconProvider';

// Standalone utilities (no React dependency)
export { preloadGif } from './lib/parser';
export { frameToDataUrl } from './lib/favicon';

// Types
export type {
  GifFrame,
  ParseResult,
  UseAnimatedFaviconOptions,
  UseAnimatedFaviconResult,
} from './types';

// Aliases matching the PRD public API names
export { useAnimatedFavicon as useGifFavicon } from './hooks/useAnimatedFavicon';
export { useAnimatedFaviconContext as useGifFaviconContext } from './hooks/useAnimatedFaviconContext';
export { AnimatedFavicon as GifFavicon } from './components/AnimatedFavicon';
export { AnimatedFaviconProvider as GifFaviconProvider } from './components/AnimatedFaviconProvider';
