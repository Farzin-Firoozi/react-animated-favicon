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
  // For GitHub Pages: set base to /react-animated-favicon/
  // For Vercel or root hosting: set to '/'
  base: '/react-animated-favicon/',
});
