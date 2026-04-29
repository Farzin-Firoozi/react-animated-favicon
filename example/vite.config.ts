import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-animated-favicon': resolve(__dirname, '../src/index.ts'),
    },
  },
  // Custom domain deployment (react-animated-favicon.github.io) is served from root.
  base: '/',
});
