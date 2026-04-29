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
  // GitHub project page deployment path.
  base: '/react-animated-favicon/',
});
