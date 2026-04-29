import { createContext, type ReactNode } from 'react';
import { useAnimatedFavicon } from '../hooks/useAnimatedFavicon';
import type { UseAnimatedFaviconOptions, UseAnimatedFaviconResult } from '../types';

export const GifFaviconContext = createContext<UseAnimatedFaviconResult | null>(null);

export interface AnimatedFaviconProviderProps extends UseAnimatedFaviconOptions {
  url: string;
  children: ReactNode;
}

export function AnimatedFaviconProvider({
  url,
  children,
  ...options
}: AnimatedFaviconProviderProps) {
  const result = useAnimatedFavicon(url, options);
  return (
    <GifFaviconContext.Provider value={result}>
      {children}
    </GifFaviconContext.Provider>
  );
}
