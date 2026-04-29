import { useAnimatedFavicon } from '../hooks/useAnimatedFavicon';
import type { UseAnimatedFaviconOptions, UseAnimatedFaviconResult } from '../types';

export interface AnimatedFaviconProps extends UseAnimatedFaviconOptions {
  url: string;
  children?: (result: UseAnimatedFaviconResult) => null;
}

export function AnimatedFavicon({ url, children, ...options }: AnimatedFaviconProps): null {
  const result = useAnimatedFavicon(url, options);
  children?.(result);
  return null;
}
