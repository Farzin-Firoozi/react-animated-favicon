import { useContext } from 'react';
import { GifFaviconContext } from '../components/AnimatedFaviconProvider';

export function useAnimatedFaviconContext() {
  const ctx = useContext(GifFaviconContext);
  if (!ctx) {
    throw new Error('useAnimatedFaviconContext must be used within an AnimatedFaviconProvider');
  }
  return ctx;
}
