import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/solver': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/solver/, ''),
        changeOrigin: true,
      },
      '/cm-api': {
        target: 'https://challenge.crossmint.io/api',
        rewrite: (path) => path.replace(/^\/cm-api/, ''),
        changeOrigin: true,
      },
    },
  },
});
